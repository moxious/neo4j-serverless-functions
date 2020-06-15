const handlers = require('../../index');
const cypher = handlers.cypher;
const cypherPubsub = handlers.cypherPubsub;
const _ = require('lodash');
const test = require('../../test');
const gil = require('../../gil');
const sinon = require("sinon");
const moment = require('moment');

const testSinkBatch = {
    cypher: 'CREATE (f:Foo) f += event',
    batch : [
        { x: 1 },
        { x: 2 },
    ],
};

// CypherSink sends back results in "batch results".  This validates one of 
// those response objects.
const validateBatchObject = (batch, size) => {
    expect(batch.batch).toBe(true);
    expect(batch.elements).toBe(size);
    expect(batch.started).toBeTruthy();
    expect(batch.finished).toBeTruthy();

    const started = moment(batch.started);
    const finished = moment(batch.finished);

    // Started has to be before finished time; or it can sometimes be zero 
    // since the test runs so fast.
    expect(started.diff(finished)).toBeLessThanOrEqual(0);
};

describe('Cypher Sink Function', () => {
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

        session = sinon.stub();
        session.returns({ writeTransaction: f => f(tx) });

        driver = sinon.stub(gil.neo4j, 'getDriver');
        driver.returns({ session });
    });

    afterEach(() => {
        gil.neo4j.getDriver.restore();
    });

    describe('Pubsub', () => {
        let callback, context;

        beforeEach(() => {
            callback = sinon.stub();
            context = sinon.stub();
        });

        const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64');

        it('should require a non-empty object', () => {
            const event = { data: encode([]) };

            return cypherPubsub(event, context, callback)
                .then(() => {
                    expect(callback.calledOnce).toBe(true);
                    expect(callback.firstCall.args[0]).toBeInstanceOf(Error);
                });
        });

        it('should process a simple batch', () => {
            const event = { data: encode(testSinkBatch) };

            return cypherPubsub(event, context, callback)
                .then(() => {
                    expect(callback.calledOnce).toBe(true);
                    const result = callback.firstCall.args[1];

                    console.log(result);
                    expect(_.isArray(result)).toBe(true);
                    expect(result.length).toBe(1);
                    const first = result[0];
                    validateBatchObject(first, testSinkBatch.batch.length);
                });
        });
    });

    describe('HTTP', () => {
        it('should require a non-empty object', () => {
            // Mock ExpressJS 'req' and 'res' parameters
            const req = { body: null };
            const res = test.mockResponse();

            // Call tested function
            return cypher(req, res)
                .then(() => {
                    // Verify behavior of tested function
                    expect(res.json.calledOnce).toBe(true);
                    expect(res.status.firstCall.args[0]).toEqual(500);
                    expect(''+res.json.firstCall.args[0].error)
                        .toContain('must contain a valid');
                });
        });

        it('should process a simple batch', () => {
            const req = { body: testSinkBatch };
            const res = test.mockResponse();

            return cypher(req, res)
                .then(() => {
                    expect(res.json.calledOnce).toBe(true);
                    expect(res.status.firstCall.args[0]).toEqual(200);
                    const json = res.json.firstCall.args[0];

                    // Response will look something like this:
                    // [{"batch": true, "elements": 2, "finished": "2020-06-11T14:10:54.155Z", "started": "2020-06-11T14:10:54.154Z"}]
                    expect(_.isArray(json)).toBe(true);
                    expect(json.length).toBe(1);
                    const first = json[0];
                    validateBatchObject(first, req.body.batch.length);
                });
        });
    });
});