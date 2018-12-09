const _ = require('lodash');
const moment = require('moment');
// const neo4j = require('../../neo4j');
// const common = require('../common');

const VERSION = 1;
const RESPOND_WITH_CONTENT = false;

const echo = (event, callback) => {
  const pubsubMessage = event.data;
  const msgData = pubsubMessage.data ? Buffer.from(pubsubMessage.data, 'base64').toString() : null;

  try {
    const json = JSON.parse(msgData);
    console.log('MSG JSON', json);
  } catch (e) {
    console.error('Failed to parse invalid JSON from', pubsubMessage);
    return callback(e);
  }

  callback();
};

module.exports = echo;