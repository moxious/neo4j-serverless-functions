const neo4j = require('neo4j-driver');
const Promise = require('bluebird');
const flat = require('flat');
const _ = require('lodash');
const me = require('../../package.json');
const Neode = require('neode');
const driverConfiguration = require('./driverConfiguration');

const driverSetup = async () => {
    const config = await driverConfiguration();
    const driver = neo4j.driver(...config);

    driver._userAgent = `neo4j-serverless-functions/v${me.version}`;
    return driver;
};

let persistentDriver = null;

const setupInitial = async () => {
    const driver = await driverSetup();
    persistentDriver = driver;
};
 
/**
 * Get a driver instance.  Creates them lazy according to google best practices.
 */
const getDriver = async () => {
    if (!persistentDriver) {
        persistentDriver = await driverSetup();
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

const getSessionConfig = () => {
    const database = process.env.NEO4J_DATABASE || false
    return { ...(database ? { database } : {}) }
}

module.exports = {
    getDriver,
    getSessionConfig,
    createNeo4jPropertiesFromObject,
};
