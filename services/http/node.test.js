const node = require('./node');
const test = require('../../test');
const neo4j = require('../../neo4j');
const sinon = require("sinon");

describe('Node Function', () => {
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
        session.returns({ 
            close: sinon.stub(),
            writeTransaction: f => f(tx) 
        });

        driver = sinon.stub(neo4j, 'getDriver');
        driver.returns({ session });
    });

    afterEach(() => {
        neo4j.getDriver.restore();
    });

    it('should process many messages', () => {
        data = { id: 1 }; // faked result

        const req = {
            body: [
                { label: 'Hello', props: { x: 1 } },
            ],
        };
        const res = test.mockResponse();

        return node(req, res)
            .then(() => {
                expect(res.json.calledOnce).toBe(true);
                expect(res.status.firstCall.args[0]).toEqual(200);
                expect(tx.run.callCount).toBe(1);
                console.log(res.json.firstCall.args);
                expect(res.json.firstCall.args[0]).toEqual([data.id]);
            });
    });
});