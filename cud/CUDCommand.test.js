const CUDCommand = require('./CUDCommand');

const cleanupString = str => str.trim().replace(/\s+/g, ' ');

describe('CUD Command', function () {
    it('should create a node', () => {
        const data = {
            op: 'create',
            type: 'node',
            labels: ['Person'],
            properties: {
                a: 'b',
            },
        };

        const expected = "CREATE (n:`Person` { }) SET n += $event.properties RETURN $event.op as op, $event.type as type, id(n) as id";

        const c = new CUDCommand(data);
        expect(cleanupString(c.generate())).toEqual(expected);
    });


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

        const expected = "MERGE (n:`Person` { `foo`: $event.ids.`foo`, `baz`: $event.ids.`baz` }) SET n += $event.properties RETURN $event.op as op, $event.type as type, id(n) as id";

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
                ids: { x: 1, y: 2 },
                labels: ['Person'],
            },
            to: {
                ids: { z: 3 },
                labels: ['Company'],
            },
            rel_type: 'WORKS_FOR',
        };

        const expected = "MATCH (a:`Person` { `x`: $event.from.ids.`x`, `y`: $event.from.ids.`y` }) WITH a MATCH (b:`Company` { `z`: $event.to.ids.`z` }) CREATE (a)-[r:`WORKS_FOR`]->(b) SET r += $event.properties RETURN $event.op as op, $event.type as type, id(r) as id";
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

        const expected = "MATCH (a:`Foo` { `uuid`: $event.from.ids.`uuid` })-[r:`blorko`]->(b:`Bar` { `uuid`: $event.to.ids.`uuid` }) DELETE r RETURN $event.op as op, $event.type as type, id(r) as id";
        const c = new CUDCommand(data);
        expect(cleanupString(c.generate())).toEqual(expected);
    });

    describe('Validation', () => {
        it('should fail a bogus message', () =>
            expect(() => new CUDCommand()).toThrow(Error));

        it('requires IDs for node merge', () =>
            expect(() => new CUDCommand({
                type: 'node',
                op: 'merge',
                labels: ['Foo'],
                properties: { x: 1 },
            })).toThrow(Error));

        it('requires labesl for node merge', () =>
            expect(() => new CUDCommand({
                type: 'node',
                op: 'merge',
                ids: { x: 1 },
                properties: { x: 1 },
            })).toThrow(Error));

        it('requires from on relationships', () =>
            expect(() => new CUDCommand({
                type: 'relationship',
                op: 'merge',
                ids: { x: 1 },
                rel_type: 'foo',
                to: { labels: ['X'], ids: { x: 1 } },
                properties: { x: 1 },
            })).toThrow(Error));

        it('requires to on relationships', () =>
            expect(() => new CUDCommand({
                type: 'relationship',
                op: 'merge',
                ids: { x: 1 },
                rel_type: 'foo',
                from: { labels: ['X'], ids: { x: 1 } },
                properties: { x: 1 },
            })).toThrow(Error));

        it('requires rel_type on relationships', () =>
            expect(() => new CUDCommand({
                type: 'relationship',
                op: 'merge',
                ids: { x: 1 },
                from: { labels: ['X'], ids: { x: 1 } },
                to: { labels: ['X'], ids: { x: 1 } },
                properties: { x: 1 },
            })).toThrow(Error));
    });
});