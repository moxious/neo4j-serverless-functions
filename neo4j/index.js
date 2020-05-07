const neo4j = require('neo4j-driver');
const Promise = require('bluebird');
const flat = require('flat');
const _ = require('lodash');
const me = require('../package.json');
const Neode = require('neode');

const DRIVER_OPTIONS = {
    maxConnectionLifetime: 8 * 1000 * 60, // 8 minutes
    connectionLivenessCheckTimeout: 2 * 1000 * 60,
};

/**
 * Using environment variables, creates a new authenticated driver instance.
 */
const driverSetup = () => {
    const username = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'neo4j';
    const uri = process.env.NEO4J_URI || 'bolt://localhost';

    const auth = neo4j.auth.basic(username, password);
    const driver = neo4j.driver(uri, auth, DRIVER_OPTIONS);

    driver._userAgent = `neo4j-serverless-functions/v${me.version}`;
    return driver;
};

let persistentDriver = null;

/**
 * Get a driver instance.  Creates them lazy according to google best practices.
 */
const getDriver = () => {
    if (!persistentDriver) {
        persistentDriver = driverSetup();
    }

    return persistentDriver;
};

const createNeo4jPropertiesFromObject = obj => {
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

module.exports = {
    getDriver,
    createNeo4jPropertiesFromObject,
};