const moment = require('moment');
const gil = require('../../gil');

const cypher = (req, res) => {
    const input = req.body;

    const strategy = new gil.CypherSink(input);

    return new gil.DataSink([strategy]).run()
        .then(results => res.status(200).json(results))
        .catch(err => res.status(500).json({
            date: moment.utc().format(),
            error: `${err}`,
            stack: err.stack,
        }));
};

module.exports = cypher;