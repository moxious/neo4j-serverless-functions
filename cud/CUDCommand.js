const _ = require('lodash');
const operations = ['create', 'merge', 'delete'];
const types = ['node', 'relationship'];
const Integer = require('neo4j-driver/lib/integer.js');

const validNonEmptyObject = o => {
    return _.isObject(o) && _.values(o).length > 0;
};

const validate = data => {
    if (operations.indexOf(data.op) === -1 || types.indexOf(data.type) === -1) {
        throw new Error('CUD command missing valid operation or type');
    }

    if (data.type === 'relationship') {
        if (!validNonEmptyObject(data.from)) { throw new Error('Missing from information for relationship'); }
        if (!validNonEmptyObject(data.to)) { throw new Error('Missing to information for relationship'); }
        if (!data.rel_type) { throw new Error('Missing rel_type'); }
    }

    if (data.type === 'node') {
        if (_.isNil(data.labels) || _.isEmpty(data.labels) || !_.isArray(data.labels)) {
            throw new Error('Nodes must have an array of labels specified; unlabeled nodes are not supported.');
        }
    }

    if (data.type === 'node' && data.op === 'merge') {
        if (!validNonEmptyObject(data.ids)) {
            throw new Error('Missing ids field for merge operation')
        }
    }
}

const escape = str => '`' + str.replace(/\`/g, '') + '`';

const labels2Cypher = labels => labels.map(escape).join(':');

const matchProperties = (criteria, paramField='ids') => {
    const clauses = Object.keys(criteria).map(propertyName =>
        `${escape(propertyName)}: $event.${paramField}.${escape(propertyName)}`)
        .join(', ');
        
    return '{ ' + clauses + ' }';
};

const matchOn = (alias, criteria, paramField='ids') => {
    const a = escape(alias);
    
    return Object.keys(criteria).map(propertyName =>
        `${a}.${escape(propertyName)} = $event.${paramField}.${escape(propertyName)}`)
        .join(' AND ');
};

/**
 * Returns a single match clause for a single node by a lookup property set.
 * @param {String} alias name of variable to alias
 * @param {Object} data key/value pairs of properties to match on.
 */
const nodePattern = (alias, data, paramFields='ids') =>
    `(${alias}:${labels2Cypher(data.labels)} ${matchProperties(data.ids || {}, paramFields)})`;

class CUDCommand {
    constructor(data={}) {
        validate(data);
        data.properties = data.properties || {};
        this.data = data;
    }

    _deleteNode() {
        const { op, properties, ids, labels, detach } = this.data;
        return (`
            MATCH ${nodePattern('n', this.data)}
            ${ detach ? 'DETACH' : ''} DELETE n
            RETURN $event.op as op, $event.type as type, id(n) as id
        `);
    }

    _generateNode() {
        const { op, properties, ids, labels } = this.data;

        let whereClause = '';

        if (op === 'merge') {

        }

        return (`
            ${op.toUpperCase()} ${nodePattern('n', this.data)}
            SET n += $event.properties
            RETURN $event.op as op, $event.type as type, id(n) as id
        `);
    }

    _deleteRelationship() {
        const { op, from, rel_type, to, properties, ids, labels } = this.data;

        let extraMatch = '';

        if (properties && !_.isEmpty(properties)) {
            extraMatch = 'WHERE ' + matchOn('r', properties, 'properties');
        }

        return (`
            MATCH ${nodePattern('a', from, 'from.ids')}-[r:${escape(rel_type)}]->${nodePattern('b', to, 'to.ids')}
            ${extraMatch}
            DELETE r
            RETURN $event.op as op, $event.type as type, id(r) as id
        `);
    }

    _generateRelationship() {
        const { op, from, rel_type, to, properties, ids, labels } = this.data;
        return (`
            MATCH ${nodePattern('a', from, 'from.ids')} 
            WITH a 
            MATCH ${nodePattern('b', to, 'to.ids')}
            ${op.toUpperCase()} (a)-[r:${escape(rel_type)}]->(b)
            SET r += $event.properties
            RETURN $event.op as op, $event.type as type, id(r) as id
        `);
    }

    generate() {
        if (this.data.type === 'node') {
            if (this.data.op === 'delete') {
                return this._deleteNode();
            }
            return this._generateNode();
        } else {
            if (this.data.op === 'delete') {
                return this._deleteRelationship();
            }
            return this._generateRelationship();
        }
    }

    /**
     * Run the command
     * @param {Transaction} tx a driver Transaction object
     * @returns {Promise} containing op, type, and id fields on success.
     */
    run(tx) {
        const cypher = this.generate();
        const params = { event: this.data };

        // console.log('RUNNING ', cypher);
        return tx.run(cypher, params)
            .then(results => {
                const rec = results.records[0];

                if (!rec) { 
                    console.error('Cypher produced no results', cypher, JSON.stringify(params));
                    return null; 
                }

                const id = rec.get('id');
                // console.log('PAYLOAD',rec);
                return {
                    op: rec.get('op'),
                    type: rec.get('type'),
                    id: Integer.inSafeRange(id) ? Integer.toNumber(id) : Integer.toString(id),
                };
            });
    }
};

module.exports = CUDCommand;