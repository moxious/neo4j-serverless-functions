const _ = require('lodash');
const gil = require('../../gil');

// https://cloud.google.com/functions/docs/writing/background#function_parameters
// This is the same as cypherPubsub, but the difference is that the user has to pass in a hard-wired cypher
// statement at create time, via a Cypher environment variable.
const cypher = (pubSubEvent, context, callback) => {
    if (!process.env.CYPHER) { 
        throw new Error('You must define a CYPHER env var in order to use this endpoint');
    }

    const input = JSON.parse(Buffer.from(pubSubEvent.data, 'base64').toString());
    console.log('CustomCypher CYPHER', process.env.CYPHER, 'input', input);
    const cypher = new gil.CypherSink({
        cypher: process.env.CYPHER,
        batch: input,
    });

    const sink = new gil.DataSink([cypher]);
    
    return sink.run()
        .then(results => callback(null, results))
        .catch(err => callback(err));
};

module.exports = cypher;