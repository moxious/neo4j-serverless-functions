const sinon = require('sinon');
const uuid = require('uuid');
const moment = require('moment');

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

    generateCUDMessage: (op='create', type='node') => {
        const labels = ['Person', 'Job', 'Company'];
        const msg = { op, type };

        const someProps = () => ({
            id: Math.floor(Math.random() * 100000),
            uuid: uuid.v4(),
            x: Math.random(),
            when: moment.utc().toISOString(),
        });

        const someKeys = () => ({ id: Math.floor(Math.random() * 100000) });
        const randLabels = () => [labels[Math.floor(Math.random()*labels.length)]];

        if (type === 'relationship') {
            msg.from = {
                labels: randLabels(),
            };

            msg.to = {
                labels: randLabels(),
            };
        } else {
            msg.labels = randLabels();
            msg.ids = someKeys();
        }

        msg.properties = someProps();
        return msg;
    },
};