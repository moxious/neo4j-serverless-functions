const _ = require('lodash');
const moment = require('moment');
const gil = require('../../gil');

// https://cloud.google.com/functions/docs/writing/background#function_parameters
const cud = (pubSubEvent, context, callback) => {
    const records = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());

    if (_.isNil(records) || !_.isArray(records) || _.isEmpty(records)) {
        return Promise.resolve(callback(new Error('Required: non-empty JSON array of CUD messages')));
    }

    let commands;

    try { 
        commands = records.map(rec => new gil.CUDCommand(rec));
    } catch(e) {
        // This is going to be a CUD message formatting error
        return Promise.resolve(callback(e, JSON.stringify({
            date: moment.utc().format(),
            error: `${e}`,
        })));
    }

    const batches = gil.CUDBatch.batchCommands(commands);
    const sink = new gil.DataSink(batches);

    return sink.run()
        .then(results => callback(null, JSON.stringify(results)))
        .catch(err => callback(err));
};

module.exports = cud;