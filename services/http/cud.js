const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const integration = require('../../integration');

const cud = (req, res) => {
    const records = req.body;

    if (_.isNil(records) || !_.isArray(records) || _.isEmpty(records)) {
        return Promise.resolve(res.status(400).json({
            date: moment.utc().format(),
            error: `Required: a non-empty JSON array of CUD messages`,
        }));
    }

    let commands;

    try { 
        commands = records.map(rec => new integration.CUDCommand(rec));
    } catch(e) {
        // This is going to be a CUD message formatting error
        return Promise.resolve(res.status(400).json({
            date: moment.utc().format(),
            error: `${e}`,
        }));
    }

    const batches = integration.CUDBatch.batchCommands(commands);
    const sink = new integration.DataSink(batches);

    return sink.run()
        .then(results => res.status(200).json(results))
        .catch(err => {
            return res.status(500).json({
                date: moment.utc().format(),
                error: `${err}`,
                stack: err.stack,
            });
        });
};

module.exports = cud;