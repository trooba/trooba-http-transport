'use strict';

var Wreck = require('wreck');
var _ = require('lodash');

var httpfy = require('trooba-http-api');

module.exports = function httpTransportFactory(config) {

    var transport = function transport(requestContext, responseContext) {
        requestContext.options = _.merge(requestContext.options || {}, config);
        Wreck.request(requestContext.options, function onResponse(err, response) {
            responseContext.error = err;
            if (response) {
                responseContext.statusCode = response.statusCode;
                responseContext.response = response;
            }
            responseContext.next();
        });
    };

    transport = httpfy(transport);

    return transport;
};
