const cud = require('./cud');
const test = require('../test/');

describe('CUD Function', () => {
    it('should require a non-empty array', () => {
        // Mock ExpressJS 'req' and 'res' parameters
        const req = {
            query: {},
            body: null,
        };

        const res = test.mockResponse();

        // Call tested function
        cud(req, res);

        // Verify behavior of tested function
        expect(res.json.calledOnce).toBe(true);
        expect(res.status.firstCall.args[0]).toEqual(400);
        expect(res.json.firstCall.args[0].error)
            .toEqual('Required: a non-empty JSON array of CUD messages');
    });
});