const moment = require('moment');
const CypherSink = require('../../cud/CypherSink');

const cypher = (req, res) => {
    const input = req.body;

    return new CypherSink(input)
        .run()
        .then(results => res.status(200).json(results))
        .catch(err => res.status(500).json({
            date: moment.utc().format(),
            error: `${err}`,
            stack: err.stack,
        }));
};

module.exports = cypher;