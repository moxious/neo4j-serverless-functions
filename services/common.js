const uuid = require('uuid');
const neo4j = require('../integration/driver');
const _ = require('lodash');
const moment = require('moment');

// What do we want to add to the request?
const markers = () => {
    const extraStuff = {};
    extraStuff._date = moment.utc().format();
    extraStuff._uuid = uuid.v4();

    return extraStuff;
};

const getRequestProps = (req) => {
    const requestProps = neo4j.createNeo4jPropertiesFromObject(
        _.merge(markers(), req.headers, { ip: req.ip }));

    return requestProps;
};

module.exports = {
    markers,
    getRequestProps,
};