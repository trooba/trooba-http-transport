'use strict';

const Assert = require('assert');
const Querystring = require('querystring');
const UrlUtils = require('url');
const Http = require('http');
const Wreck = require('wreck');
const _ = require('lodash');

const httpfy = require('trooba-http-api');

module.exports = function transport(pipe, config) {
    if (config && config.context &&
    pipe.store && !pipe.store.contextProvider) {
        pipe.store.contextProvider = typeof config.context === 'string' ?
            require(config.context) :
            config.context;
    }

    addServerAPI(pipe, config);
    addClientAPI(pipe, config);
};

function addClientAPI(pipe, config) {
    if (pipe.context.$server) {
        return;
    }

    pipe.on('request', function onRequest(request) {
        var options = _.merge(request || {}, config);
        var genericTimeout = options.timeout;

        if (options.connectTimeout) {
            options.timeout = options.connectTimeout;
        }
        if (options.body) {
            options.payload = options.body;
        }
        if (options.path) {
            options.pathname = options.path;
        }

        var url = UrlUtils.format(options);

        if (pipe.store && pipe.store.contextProvider) {
            // serialize from context into http request
            options.headers = options.headers || {};
            pipe.store.contextProvider.serialize(pipe.context, options);
        }

        Wreck.request(options.method, url, options, function onResponse(err, response) {
            /* handle err if it exists, in which case res will be undefined */
            if (err) {
                pipe.throw(err);
                return;
            }

            // buffer the response stream
            options.timeout = genericTimeout;
            if (options.socketTimeout) {
                options.timeout = options.socketTimeout;
            }

            Wreck.read(response, options, function onResponseRead(err, body) {
                if (err) {
                    pipe.throw(err);
                    return;
                }
                response.body = body;
                // de-serialize context
                if (pipe.store && pipe.store.contextProvider) {
                    pipe.store.contextProvider.deserialize(response, pipe.context);
                }
                pipe.respond(response);
            });
        });
    });

    httpfy(pipe);
}

function addServerAPI(pipe, config) {
    const contextProvider = pipe.store.contextProvider;
    pipe.set('server:default', function serverFactory(pipe) {
        return {
            listen(callback) {
                Assert.ok(config.port !== undefined, 'Port must be provided as part of transport config');
                const server =  Http.createServer((req, res) => {
                    const urlParts = UrlUtils.parse(req.url);
                    const context = {
                        path: urlParts.path,
                        operation: req.method,
                        // make sure it will not be propagated beyond current pipe by prefixing with '$'
                        $rawRequest: req,
                        $server: true
                    };

                    const serverContext = {
                        request: req,
                        response: res
                    };

                    // de-serialize context from request headers/cookies into context
                    if (contextProvider) {
                        contextProvider.deserialize(serverContext, context);
                    }

                    const request = Object.assign({
                        // so far no body in request
                        // body can be read later by body parser
                        // from the raw request
                    }, Querystring.parse(urlParts.query));

                    // then use the context to initiate the request
                    pipe.create(context)
                    .request(request, (err, response) => {
                        // serialize context into request headers/cookies
                        if (contextProvider) {
                            contextProvider.serialize(context, serverContext);
                        }
                        if (err) {
                            res.writeHead(500);
                            res.end(err.message);
                            return;
                        }
                        res.writeHead(response.status);
                        res.end(response.body);
                    });
                });

                return server.listen(config.port, callback);
            }
        };
    });
}
