const _ = require('lodash');
const neo4j = require('../driver');
const Promise = require('bluebird');
const Integer = require('neo4j-driver/lib/integer.js');
const Strategy = require('./Strategy');

const keyFor = cmd => {
    let { op, type, ids, properties, labels, from, to } = cmd.data;

    return `${op}.${type}`
};

let seq = 0;

const MAX_BATCH_SIZE = 2000;

class CUDBatch extends Strategy {
    constructor(sequence = seq++) {
        super();
        this.batch = [];
        this.key = null;
        this.seq = sequence;
    }

    commands() { return this.batch; }
    getEvents() { return this.commands(); }
    getCypher() { return this.commands()[0].generate(); }
    isEmpty() { return this.batch.length === 0; }
    canHold(cmd) { return this.key === null || this.key === cmd.key(); }

    getKey() { return this.key; }

    add(command) {
        const key = command.key();

        if (this.key === null) {
            this.key = key;
            this.batch.push(command);
            return command;
        } else if (key !== this.key) {
            throw new Error('Cannot add command of different type to batch with key ' + key);
        }

        this.batch.push(command);
        return command;
    }

    /**
     * Creates an array of batches for a sequence of commands.
     * @param {Array{CUDCommand}} commands 
     * @returns {Array[CUDBatch]}
     */
    static batchCommands(commands, maxBatchSize=MAX_BATCH_SIZE) {
        const results = [];

        let activeBatch = new CUDBatch();
        let batches = 0;

        commands.forEach(command => {
            // Don't let batches get too big.
            if (activeBatch.commands().length >= maxBatchSize) {
                // console.log('Pushing full batch and making ', ++batches);
                results.push(activeBatch);
                activeBatch = new CUDBatch();
            }

            if (activeBatch.canHold(command)) {
                // console.log('adding to batch ', batches);
                return activeBatch.add(command);
            } 

            // console.log('created batch ', ++batches);
            results.push(activeBatch);
            activeBatch = new CUDBatch();
            return activeBatch.add(command);
        });

        if (!activeBatch.isEmpty()) {
            results.push(activeBatch);
        }

        return results;
    }

    /**
     * Batch a set of commands for optimal execution, and run each batch.
     * @param {Array{CUDCommand}} commands 
     * @returns {Promise} that resolves to an array of batch results.
     */
    static runAll(commands) {
        const batches = CUDBatch.batchCommands(commands);

        const session = neo4j.getDriver().session();

        return session.writeTransaction(tx => 
            Promise.mapSeries(batches, batch => batch.run(tx)))
            .finally(session.close);
    }
}

module.exports = CUDBatch;