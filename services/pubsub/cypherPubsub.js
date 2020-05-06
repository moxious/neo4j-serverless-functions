const _ = require('lodash');
const CypherSink = require('../../cud/CypherSink');

// https://cloud.google.com/functions/docs/writing/background#function_parameters
const cypher = (pubSubEvent, context, callback) => {
    const input = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());

    return new CypherSink(input)
        .run()
        .then(results => callback(null, results))
        .catch(err => callback(err));
};

module.exports = cypher;