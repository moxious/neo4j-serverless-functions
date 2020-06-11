const moment = require('moment');

class Strategy {
    constructor() {
    }

    getCypher() {
        throw new Error('Override me (getCypher) in a subclass!');
    }

    getEvents() {
        throw new Error('Override me (getEvents) in a subclass!');
    }

    run(session) {
        const cypher = `UNWIND $events as event ${this.getCypher()}`
        const events = this.getEvents();
        const elements = events.length;
        const params = { events };
        const started = moment.utc().toISOString();

        return session.writeTransaction(tx => tx.run(cypher, params))
            .then(() => ({
                batch: true,
                elements,
                started,
                finished: moment.utc().toISOString(),
            }));
    }
}

module.exports = Strategy;