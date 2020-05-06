const moment = require('moment');
const _ = require('lodash');
const neo4j = require('../neo4j');

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
class CypherSink {
    constructor(data) {
        if (!data.cypher) {
            throw new Error('Input must contain a cypher field');
        } else if (!data.batch || !_.isArray(data.batch) || _.isEmpty(data.batch)) {
            throw new Error('Missing, invalid, or empty batch');
        }

        this.data = data;
    }

    run() {
        const cypher = `UNWIND $batch as event ${this.data.cypher}`;
        const params = { batch: this.data.batch };
    
        const session = neo4j.getDriver().session();
        const started = moment.utc().toISOString();
        return session.writeTransaction(tx =>
            tx.run(cypher, params))
            .then(() => ({ 
                batch: true, 
                elements: this.data.batch.length, 
                started,
                finished: moment.utc().toISOString(),
            }))
            .finally(session.close);
    }
}

module.exports = CypherSink;