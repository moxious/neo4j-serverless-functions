const neo4j = require('../driver');
const Promise = require('bluebird');

class DataSink {
    constructor(strategies) {
        this.strategies = strategies;
    }

    async run() {
        const driver = await neo4j.getDriver();
        const session = driver.session(neo4j.getSessionConfig());

        return Promise.mapSeries(this.strategies, strategy => strategy.run(session))
            .finally(session.close);
    }
}

module.exports = DataSink;
