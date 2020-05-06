const nodeSvc = require('./services/http/node');
const edgeSvc = require('./services/http/edge');
const cudSvc = require('./services/http/cud');
const cudPubsub = require('./services/pubsub/cudPubsub');
const moment = require('moment');

/**
 * Executes a function, and if it throws an error, guarantees error response.
 * @param {*} aFunction function to execute
 * @param {*} res response object
 * @returns an export function
 */
const guaranteeResponseHTTP = (aFunction, failMsg = 'Error processing response') => {
  return (req, res) => {
    try {
      return aFunction(req, res);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        date: moment.utc().format(),
        message: failMsg,
        error: `${err}`,
      });
    }
  };
};

const guaranteeCallbackPubsub = (aFunction) => {
  return (pubSubEvent, context, callback) => {
    try {
      return aFunction(pubSubEvent, context, callback);
    } catch(err) { 
      callback(err);
    }
  };
};

module.exports = {
  node: guaranteeResponseHTTP(nodeSvc),
  edge: guaranteeResponseHTTP(edgeSvc),
  cud: guaranteeResponseHTTP(cudSvc),
  cudPubsub: guaranteeCallbackPubsub(cudPubsub),
};
