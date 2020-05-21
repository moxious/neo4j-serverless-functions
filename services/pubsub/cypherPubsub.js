const _ = require('lodash');
const integration = require('../../integration');

// https://cloud.google.com/functions/docs/writing/background#function_parameters
const cypher = (pubSubEvent, context, callback) => {
    const input = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());

    const cypher = new integration.CypherSink(input);
    const sink = new integration.DataSink([cypher]);
    
    return sink.run()
        .then(results => callback(null, results))
        .catch(err => callback(err));
};

module.exports = cypher;