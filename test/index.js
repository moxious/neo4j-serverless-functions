const sinon = require('sinon');

module.exports = {
    mockResponse: () => {
        const json = sinon.stub();
        const status = sinon.stub();
        status.returns({ json });

        const res = { 
            json,
            status,
        };

        return res;
    },
};