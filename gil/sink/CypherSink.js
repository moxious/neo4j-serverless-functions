const Strategy = require('./Strategy');
const _ = require('lodash');

/**
 * Example message input to constructor
 {
    "cypher": "CREATE (b:Blork) SET b += event",
    "batch": [
        {"x": 1, "y": 2},
        {"x": 3, "y": 4}
    ]
}
*/
class CypherSink extends Strategy {
    constructor(data) {
        super();

        if (!data || !data.cypher || !data.batch || !_.isArray(data.batch) || _.isEmpty(data.batch)) {
            throw new Error('Input must contain a valid cypher field and a valid batch');
        }

        this.data = data;
    }

    getCypher() { return this.data.cypher; };
    getEvents() { return this.data.batch; };
}

module.exports = CypherSink;