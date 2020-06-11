const neo4j = require('../driver');
const Promise = require('bluebird');

class DataSink {
    constructor(strategies) {
        this.strategies = strategies;
    }

    run() {
        const driver = neo4j.getDriver();
        const session = driver.session();

        return Promise.mapSeries(this.strategies, strategy => strategy.run(session))
            .finally(session.close);
    }
}

module.exports = DataSink;