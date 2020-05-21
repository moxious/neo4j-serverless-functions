const moment = require('moment');
const integration = require('../../integration');

const cypher = (req, res) => {
    const input = req.body;

    const strategy = new integration.CypherSink(input);

    return new integration.DataSink([strategy]).run()
        .then(results => res.status(200).json(results))
        .catch(err => res.status(500).json({
            date: moment.utc().format(),
            error: `${err}`,
            stack: err.stack,
        }));
};

module.exports = cypher;