const CypherSink = require('./CypherSink');
const neo4j = require('../driver');
const sinon = require('sinon');

describe('CypherSink', () => {
    let driver, session, tx, run, rec;
    let data;

    beforeEach(() => {
        rec = {
            get: field => data[field],
        };

        run = sinon.stub();
        run.returns(Promise.resolve({
            records: [rec],
        }));

        tx = { run };

        session = sinon.stub().returns({ writeTransaction: f => f(tx) });

        driver = sinon.stub(neo4j, 'getDriver');
        driver.returns({ session });
    });

    afterEach(() => {
        neo4j.getDriver.restore();
    });

    it('should validate inputs', () => {
        expect(() => new CypherSink({})).toThrow(Error);
        expect(() => new CypherSink({ cypher: 'match n return n' })).toThrow(Error);
        expect(() => new CypherSink({
            cypher: 'CREATE (n:Foo) SET n += event',
            batch: [],
        })).toThrow(Error);
    });

    it('should run a batch', () => {
        const data = {
            cypher: 'CREATE (n:Foo) SET n += event',
            batch: [
                { x: 1, y: 2 },
                { x: 3, y: 4 },
            ],
        };

        const fakeSession = { writeTransaction: f => f(tx) };

        return new CypherSink(data).run(fakeSession)
            .then(result => {
                expect(result.batch).toBe(true);
                expect(result.elements).toBe(2);
                expect(result.started).toBeTruthy();
                expect(result.finished).toBeTruthy();
            });
    });
});