const _ = require('lodash');
const moment = require('moment');
const neo4j = require('../../gil/driver');
const common = require('../common');

const VERSION = 1;
const RESPOND_WITH_CONTENT = false;

/**
 * Request must provide query params:
 * fromLabel
 * fromProp
 * fromVal
 * toLabel
 * toProp
 * toVal
 * relType (default: link)
 * 
 * JSON body parameters will be used for the relationship properties.
 * @param {*} req 
 * @param {*} res 
 */
const edge = (req, res) => {
    const requiredParams = [
        'fromLabel', 'fromProp', 'fromVal',
        'toLabel', 'toProp', 'toVal', 'relType',
    ];

    for(let i=0; i<requiredParams.length; i++) {
        const v = req.query[requiredParams[i]];
        if (!v) {
            return Promise.resolve(res.status(400).json({
                date: moment.utc().format(),
                error: 'One or more required parameters missing',
                requiredParams,
            }));
        }
    }

    const cypher = `
        MATCH 
          (a:\`${req.query.fromLabel}\` {
            \`${req.query.fromProp}\`: $fromVal
           }), 
          (b:\`${req.query.toLabel}\` {
            \`${req.query.toProp}\`: $toVal
          })
        CREATE (a)-[r:\`${req.query.relType || 'link'}\` $relProps]->(b)
        RETURN r;
    `;

    const relMarkers = common.markers();

    // Neo4j takes key/value props, not arbitrarily nested javascript objects,
    // so we convert.
    const relProps = neo4j.createNeo4jPropertiesFromObject(
        _.merge(_.cloneDeep(req.body), _.cloneDeep(relMarkers)));

    // Use regular request props, but override with the same markers
    // as the relationship has so we can correlate the two.
    const requestProps = _.merge(common.getRequestProps(req), 
        _.cloneDeep(relMarkers));

    const queryParams = _.merge(
        _.cloneDeep(req.query), 
        { relProps, requestProps }
    );
    const session = neo4j.getDriver().session();

    console.log('Running ', cypher, 'with', queryParams);
    return session.writeTransaction(tx => tx.run(cypher, queryParams))
        .then(result => {
            if (RESPOND_WITH_CONTENT) {
                return res.status(200).json(result.records[0].get('r'));
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

module.exports = edge;