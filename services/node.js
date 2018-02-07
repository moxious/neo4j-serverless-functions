const _ = require('lodash');
const moment = require('moment');
const neo4j = require('../neo4j');

const VERSION = 1;
const RESPOND_WITH_CONTENT = false;

const node = (req, res) => {
    // If user submitted a label, use that.
    const label = _.get(req.query, 'label') || _.get(req.params, 'label') || 'Entry';

    // What data out of the original request do we want to save?
    const requestParts = [
        'body', 'path', 'params',
        'cookies', 'originalUrl',
        'baseUrl', 'hostname', 'ip',
        'ips', 'protocol',
        'query', 'headers', 'method',
    ];

    // What do we want to add to the request?
    const markers = () => {
        const extraStuff = {};
        extraStuff.date = moment.utc().format();
        extraStuff.version = VERSION;

        return extraStuff;
    };

    const requestData = _.pick(req, requestParts);
    const extras = markers();

    // Neo4j takes key/value props, not arbitrarily nested javascript objects,
    // so we convert.
    const props = neo4j.createNeo4jPropertiesFromObject(_.merge(extras, requestData));

    const session = neo4j.getDriver().session();

    const cypher = `CREATE (p:\`${label}\` {props}) RETURN p`;

    return session.writeTransaction(tx => tx.run(cypher, { label, props }))
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
        })
        .finally(() => console.log('done-exec'));
};

module.exports = node;