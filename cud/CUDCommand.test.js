const CUDCommand = require('./CUDCommand');

const cleanupString = str => str.trim().replace(/\s+/g, ' ');

describe('CUD Command', function() { 
    it('should merge a node', () => {
        const data = {
            op: 'merge',
            type: 'node',
            labels: ['Person'],
            ids: {
                foo: 'bar',
                baz: 'quux',
            },
            properties: {
                a: 'b',
            },
        };

        const expected = "MERGE (n:`Person`) WHERE `n`.`foo` = $event.ids.`foo` AND `n`.`baz` = $event.ids.`baz` SET n += $event.properties RETURN $event.op as op, $event.type as type, id(n) as id";

        const c = new CUDCommand(data);
        expect(cleanupString(c.generate())).toEqual(expected);
    });

    it('should delete a node', () => {
        const data = {
            op: 'delete',
            type: 'node',
            labels: ['A', 'B', 'C'],
            ids: {
                key: 1,
                otherKey: 2,
            },
        };

        const expected = "MATCH (n:`A`:`B`:`C` { `key`: $event.ids.`key`, `otherKey`: $event.ids.`otherKey` }) DELETE n RETURN $event.op as op, $event.type as type, id(n) as id";
        const c = new CUDCommand(data);
        expect(cleanupString(c.generate())).toEqual(expected);
    });

    it('knows how to detach a node', () => {
        const data = {
            op: 'delete',
            type: 'node',
            labels: ['A'],
            ids: { key: 1 },
            detach: true,
        };

        const expected = "MATCH (n:`A` { `key`: $event.ids.`key` }) DETACH DELETE n RETURN $event.op as op, $event.type as type, id(n) as id";
        const c = new CUDCommand(data);
        expect(cleanupString(c.generate())).toEqual(expected);
    });

    it('should generate a relationship', () => {
        const data = {
            op: 'create',
            type: 'relationship',
            from: {
                ids: { x: 1,  y: 2 },
                labels: ['Person'],
            },
            to: {
                ids: { z: 3 },
                labels: ['Company'],
            },
            rel_type: 'WORKS_FOR',
        };

        const expected = "MATCH (a:`Person` { `x`: $event.ids.`x`, `y`: $event.ids.`y` }) WITH a MATCH (b:`Company` { `z`: $event.ids.`z` }) CREATE (a)-[r:`WORKS_FOR`]->(b) SET r += $event.properties RETURN $event.op as op, $event.type as type, id(r) as id";
        const c = new CUDCommand(data);
        expect(cleanupString(c.generate())).toEqual(expected);
    });

    it('should delete a relationship', () => {
        const data = {
            op: 'delete',
            type: 'relationship',
            from: {
                labels: ['Foo'],
                ids: { uuid: '123' },
            },
            to: {
                labels: ['Bar'],
                ids: { uuid: 'a' },
            },
            rel_type: 'blorko',
        };

        const expected = "MATCH (a:`Foo` { `uuid`: $event.ids.`uuid` })-[r:`blorko`]->(b:`Bar` { `uuid`: $event.ids.`uuid` }) DELETE r RETURN $event.op as op, $event.type as type, id(r) as id";
        const c = new CUDCommand(data);
        expect(cleanupString(c.generate())).toEqual(expected);
    });
});