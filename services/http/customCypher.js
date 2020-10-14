const moment = require('moment');
const gil = require('../../gil');

// This is the same as cypher, except the user has to define a CYPHER env var to bind the cypher statement
// ahead of time.
const cypher = (req, res) => {
    const input = req.body;

    if (!process.env.CYPHER) {
        throw new Error('You must define a pre-determined CYPHER query environment variable to use this endpoint');
    }

    const sink = {
        cypher: process.env.CYPHER,
        batch: input,
    };

    const strategy = new gil.CypherSink(sink);

    return new gil.DataSink([strategy]).run()
        .then(results => res.status(200).json(results))
        .catch(err => res.status(500).json({
            date: moment.utc().format(),
            error: `${err}`,
            stack: err.stack,
        }));
};

module.exports = cypher;