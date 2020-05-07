const edge = require('../../index').edge;
const test = require('../../test');
const neo4j = require('../../neo4j');
const sinon = require("sinon");
const _ = require('lodash');

describe('Edge Function', () => {
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

    const query = {
        fromLabel: 'Person',
        fromProp: 'id',
        fromVal: 1,
        toLabel: 'Person',
        toProp: 'id',
        toVal: 2,
        relType: 'KNOWS',
    };

    ['fromLabel', 'fromProp', 'fromVal', 'toLabel', 'toProp', 'relType', 'toVal'].forEach(attr => {
        it(`should require query param ${attr}`, () => {
            const thisQuery = _.cloneDeep(query);
            delete(thisQuery[attr]);

            const req = { query: thisQuery, body: { rel: 'props' } };
            const res = test.mockResponse();

            return edge(req, res)
                .then(() => {
                    expect(res.json.calledOnce).toBe(true);
                    expect(res.status.firstCall.args[0]).toEqual(400);
                    expect(res.json.firstCall.args[0].error).toBeTruthy();
                });
        });
    });

    it('should create a relationship', () => {
        const req = { query, body: { rel: 'props' } };
        const res = test.mockResponse();

        return edge(req, res)
            .then(() => {
                expect(res.json.calledOnce).toBe(true);
                expect(res.status.firstCall.args[0]).toEqual(200);
            });
    });

});