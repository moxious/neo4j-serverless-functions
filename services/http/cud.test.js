const handlers = require('../../index');
const cud = handlers.cud;
const cudPubsub = handlers.cudPubsub;

const test = require('../../test');
const cudMessages = require('../../test/cud-messages.json');
const neo4j = require('../../neo4j');
const sinon = require("sinon");

describe('CUD Function', () => {
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

        driver = sinon.stub(neo4j, 'getDriver');
        driver.returns({ session });
    });

    afterEach(() => {
        neo4j.getDriver.restore();
    });

    describe('Pubsub', () => {
        let callback, context;

        beforeEach(() => {
            callback = sinon.stub();
            context = sinon.stub();
        });

        const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64');

        it('should require a non-empty array', () => {
            const event = { data: encode([]) };

            return cudPubsub(event, context, callback)
                .then(() => {
                    expect(callback.calledOnce).toBe(true);
                    expect(callback.firstCall.args[0]).toBeInstanceOf(Error);
                });
        });

        it('requires well formed JSON', () => {
            const event = { data: 'alskdjf;alksdjf;asdjkfa;dsfj' };

            return cudPubsub(event, context, callback)
                .then(() => {
                    expect(callback.calledOnce).toBe(true);
                    expect(callback.firstCall.args[0]).toBeInstanceOf(Error);
                });
        });

        it('should process one simple message', () => {
            const event = { data: encode([cudMessages[0]]) };

            return cudPubsub(event, context, callback)
                .then(() => {
                    expect(callback.calledOnce).toBe(true);
                    expect(callback.firstCall.args[0]).toEqual(null);
                    // [{"batch":true,"key":"create.node.Person.","sequence":0,"commands":1}]
                });
        });

        it('should process many messages', () => {
            const event = { data: encode(cudMessages) };

           return cudPubsub(event, context, callback)
                .then(() => {
                    expect(callback.calledOnce).toBe(true);
                    expect(callback.firstCall.args[0]).toEqual(null);
                });
        });
    });

    describe('HTTP', () => {
        it('should require a non-empty array', () => {
            // Mock ExpressJS 'req' and 'res' parameters
            const req = { body: null };
            const res = test.mockResponse();

            // Call tested function
            return cud(req, res)
                .then(() => {
                    // Verify behavior of tested function
                    expect(res.json.calledOnce).toBe(true);
                    expect(res.status.firstCall.args[0]).toEqual(400);
                    expect(res.json.firstCall.args[0].error)
                        .toEqual('Required: a non-empty JSON array of CUD messages');
                });
        });

        it('should process one simple message', () => {
            data = { op: 'create', type: 'node', id: 1 };
            const req = { body: [cudMessages[0]] };
            const res = test.mockResponse();

            return cud(req, res)
                .then(() => {
                    expect(res.json.calledOnce).toBe(true);
                    expect(res.status.firstCall.args[0]).toEqual(200);
                    const results = res.json.firstCall.args[0];
                    const batch0 = results[0];
                    expect(batch0.batch).toBe(true);
                    expect(batch0.commands).toBe(1);
                });
        });

        it('should process many messages', () => {
            data = { op: 'create', type: 'node', id: 1 }; // faked result

            const req = { body: cudMessages[0] };
            const res = test.mockResponse();

            const a = cud(req, res)
                .then(() => {
                    expect(res.json.calledOnce).toBe(true);
                    expect(res.status.firstCall.args[0]).toEqual(200);
                    expect(tx.run.callCount).toBe(cudMessages.length);
                });
        });
    });
});