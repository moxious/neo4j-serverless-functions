const neo4j = require('neo4j-driver');
const Promise = require('bluebird');
const flat = require('flat');
const _ = require('lodash');
let _creds;

try {
    _creds = require('./creds.json');
} catch (e) {
    console.error('Failed to import creds.json, did you define that file?');
    throw e;
}

exports.creds = () => [
    _creds.username, _creds.password, _creds.uri,
];

/**
 * Using environment variables, creates a new authenticated driver instance.
 */
const driverSetup = () => {
    const username = process.env.NEO4J_USER || _creds.username || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || _creds.password || 'neo4j';
    const uri = process.env.NEO4J_URI || _creds.uri || 'bolt://localhost';

    const auth = neo4j.auth.basic(username, password);
    return neo4j.driver(uri, auth);
};

let persistentDriver = null;

/**
 * Get a driver instance.  Creates them lazy according to google best practices.
 */
exports.getDriver = () => {
    if (!persistentDriver) {
        persistentDriver = driverSetup();
    }

    return persistentDriver;
};

exports.createNeo4jPropertiesFromObject = obj => {
    const flattened = flat.flatten(obj);
    // Eliminate empty maps.
    _.forEach(flattened, (val, key) => {
        // Cypher can't store empty maps, so set them to null.
        if (_.isObject(val) && _.isEmpty(val)) {
            _.set(flattened, key, null);
        }
    });

    return flattened;
};
