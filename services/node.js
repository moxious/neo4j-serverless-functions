const _ = require('lodash');
const moment = require('moment');
const neo4j = require('../neo4j');
const common = require('./common');

const VERSION = 1;
const RESPOND_WITH_CONTENT = false;

const node = (req, res) => {
    console.log('TEST');
    // If user submitted a label, use that.
    const label = _.get(req.query, 'label') || _.get(req.params, 'label') || 'Entry';

    // Neo4j takes key/value props, not arbitrarily nested javascript objects,
    // so we convert.
    const requestProps = common.getRequestProps(req);

    const props = neo4j.createNeo4jPropertiesFromObject(
        _.merge(common.markers(), 
            _.isEmpty(req.body) ? req.params : req.body));

    const session = neo4j.getDriver().session();

    const cypher = `
        CREATE (r:Request {requestProps})-[:\`${req.method}\`]->
               (p:\`${label}\` {props}) 
        RETURN p
    `;
    
    const queryParams = {
        requestProps, props, label, method: req.method,
    };

    return session.writeTransaction(tx => tx.run(cypher, queryParams))
        .then(result => {
            if (RESPOND_WITH_CONTENT) {
                return res.status(200).json(result.records[0].get('p'));
            }

            return res.status(200).json('OK');
        })
        .catch(err => {
            return res.status(500).json({
                date: moment.utc().format(),
                error: `${err}`,
                stack: err.stack,
            });
        });
};

module.exports = node;