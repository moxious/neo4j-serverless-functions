const _ = require('lodash');
const moment = require('moment');
const neo4j = require('../neo4j');
const Promise = require('bluebird');
const CUDCommand = require('../cud/CUDCommand');

const cud = (req, res) => {
    const records = req.body;

    if (_.isNil(records) || !_.isArray(records) || _.isEmpty(records)) {
        return res.status(400).json({
            date: moment.utc().format(),
            error: `Required: a non-empty JSON array of CUD messages`,
        });
    }

    let commands;

    try { 
        commands = records.map(rec => new CUDCommand(rec));
    } catch(e) {
        // This is going to be a CUD message formatting error
        return res.status(400).json({
            date: moment.utc().format(),
            error: `${err}`,
        });
    }

    const session = neo4j.getDriver().session();

    return session.writeTransaction(tx =>
        Promise.map(commands, cudCommand => cudCommand.run(tx), { concurrency: 1 })
    )
        .then(results => res.status(200).json(results))
        .catch(err => {
            return res.status(500).json({
                date: moment.utc().format(),
                error: `${err}`,
                stack: err.stack,
            });
        })
        .finally(session.close);
};

module.exports = cud;