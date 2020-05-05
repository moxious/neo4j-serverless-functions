const _ = require('lodash');
const moment = require('moment');
const neo4j = require('../neo4j');
const Integer = require('neo4j-driver/lib/integer.js');
const common = require('./common');

const node = (req, res) => {
    console.log('TEST');
    // If user submitted a label, use that.
    const label = _.get(req.query, 'label') || _.get(req.params, 'label') || 'Entry';

    // Neo4j takes key/value props, not arbitrarily nested javascript objects,
    // so we convert.
    const requestProps = common.getRequestProps(req);

    let records;

    if (_.isEmpty(req.body)) {
        records = [req.params];
    } else if (_.isArray(req.body)) {
        records = req.body;
    } else if (_.isObject(req.body)) {
        records = [req.body];
    }

    // Batch parameter to set in query.
    const batch = records.map(propSet => ({ props: neo4j.createNeo4jPropertiesFromObject(propSet) }));
    const session = neo4j.getDriver().session();

    const cypher = `
        UNWIND $batch as input
        CREATE (p:\`${label}\`) 
        SET p += input.props
        RETURN id(p) as id
    `;
    
    const queryParams = {
        batch,
        requestProps, 
        method: req.method,
    };

    return session.writeTransaction(tx => tx.run(cypher, queryParams))
        .then(result => {
            const data = result.records
                .map(rec => rec.get('id'))
                .map(num => Integer.inSafeRange(num) ? Integer.toNumber(num) : Integer.toString(num));
            return res.status(200).json(data);
        })
        .catch(err => {
            return res.status(500).json({
                date: moment.utc().format(),
                error: `${err}`,
                stack: err.stack,
            });
        })
        .finally(session.close);
};

module.exports = node;