const CUDBatch = require('./CUDBatch');
const CUDCommand = require('./CUDCommand');
const test = require('../test/');

const fakeCommands = () => {
    const messages = [];
    for (let i=0; i<10; i++) { 
        messages.push({
            op: 'create',
            type: 'node',
            ids: { uuid: 'A' },
            labels: ['Person', 'Friend'],
            properties: {
                x: 1,
            },
        });
    }

    const commands = messages.map(msg => new CUDCommand(msg));
    return commands;
};

describe('CUD Batch', () => {
    it('can batch messages', () => {
        const commands = fakeCommands();
        const batches = CUDBatch.batchCommands(commands);

        expect(batches.length).toBe(1);
        expect(batches[0].commands().length).toBe(10);

        batches[0].commands().forEach(cmd => {
            expect(cmd.key()).toEqual('create.node.Person,Friend.uuid');
        });
    });

    it('can batch messages up to a max batch size', () => {
        const commands = fakeCommands();
        const batches = CUDBatch.batchCommands(commands, 4); // Batches no bigger than 4.
        expect(batches.length).toBe(3);
        
        expect(batches[0].commands().length).toBe(4);
        expect(batches[1].commands().length).toBe(4);
        expect(batches[2].commands().length).toBe(2);
    });
});