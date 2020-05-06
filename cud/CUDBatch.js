const _ = require('lodash');

const keyFor = cmd => {
    let { op, type, ids, properties, labels, from, to } = cmd.data;

    return `${op}.${type}`
};

let seq = 0;

const MAX_BATCH_SIZE = 2000;

class CUDBatch {
    constructor(sequence = seq++) {
        this.batch = [];
        this.key = null;
        this.seq = sequence;
    }

    commands() { return this.batch; }
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

    run(tx) {
        if (this.batch.length === 0) {
            throw new Error('Empty Batches not allowed');
        }

        const cypher = `
            UNWIND $batch as event 
            WITH event 
            ${this.batch[0].generate()}
        `;

        const params = { 
            batch: this.batch.map(cmd => cmd.data),
        };

        // console.log('RUNNING ', cypher);
        return tx.run(cypher, params)
            .then(results => {
                const rec = results.records[0];

                if (!rec) { 
                    console.error('Cypher produced no results', cypher, JSON.stringify(params));
                    return null; 
                }

                const id = rec.get('id');
                // console.log('PAYLOAD',rec);
                return {
                    op: rec.get('op'),
                    type: rec.get('type'),
                    id: Integer.inSafeRange(id) ? Integer.toNumber(id) : Integer.toString(id),
                };
            });
    }   
}

module.exports = CUDBatch;