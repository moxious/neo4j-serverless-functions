const uuid = require('uuid');
const test = require('../../test/index');

const buf = [];
for (let i=0; i<100; i++) {
    const msg = {
        op: 'create',
        type: 'node',
        labels: ['Test'],
        properties: {
            index: i,
            x: Math.random(),
            uuid: uuid.v4(),
        },
    };

    buf.push(test.generateCUDMessage());
}

console.log(JSON.stringify(buf));
