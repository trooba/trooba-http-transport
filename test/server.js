'use strict';

var Assert = require('assert');
var Trooba = require('trooba');
var Async = require('async');

var httpTransport = require('..');

describe(__filename, function () {

    it('should create a server instance', () => {
        const app = Trooba.use(httpTransport).build().create('server:default');
        Assert.ok(app);
        Assert.ok(app.listen);
    });

    it('should start the server', next => {
        const app = Trooba.use(httpTransport, {
            port: 0
        })
        .build()
        .create('server:default');

        const svr = app.listen(err => {
            Assert.ok(!err, err && err.stack);
            Assert.ok(svr.address().port > 0);
            next();
        });
        Assert.ok(svr);
        Assert.ok(svr.close);
    });

    it('should close the server', next => {
        const app = Trooba.use(httpTransport, {
            port: 0
        })
        .build()
        .create('server:default');

        const svr = app.listen(err => {
            svr.close(next);
        });
    });

    it('should accept requests', next => {
        const app = Trooba.use(httpTransport, {
            port: 0
        })
        .use(pipe => {
            pipe.on('request', () => {
                pipe.respond({
                    status: 200,
                    body: 'ok'
                });
            });
        })
        .build()
        .create('server:default');

        const svr = app.listen(err => {
            Assert.ok(!err, err && err.stack);

            const client = Trooba.use(httpTransport, {
                port: svr.address().port,
                hostname: 'localhost',
                protocol: 'http:'
            }).build();

            client.create().request({
                method: 'GET'
            }, (err, res) => {
                Assert.ok(!err, err && err.stack);
                Assert.equal('ok', res.body);
                next();
            });
        });
    });

    it('should accept multiple requests', next => {
        const app = Trooba.use(httpTransport, {
            port: 0
        })
        .use(pipe => {
            pipe.on('request', request => {
                pipe.respond({
                    status: 200,
                    body: '' + request.index
                });
            });
        })
        .build()
        .create('server:default');

        const svr = app.listen(err => {
            Assert.ok(!err, err && err.stack);

            let count = 0;
            const MAX = 10;

            const client = Trooba.use(httpTransport, {
                port: svr.address().port,
                hostname: 'localhost',
                protocol: 'http:'
            }).build();

            Async.times(MAX, (index, next) => {
                client.create().request({
                    method: 'GET',
                    search: `&index=${index}`
                }, (err, res) => {
                    Assert.ok(!err, err && err.stack);
                    Assert.equal('' + index, res.body.toString());
                    count++;
                    next();
                });
            }, err => {
                Assert.ok(!err, err && err.stack);
                Assert.equal(MAX, count);
                next();
            });

        });
    });

    it('should get 404 response', next => {
        const app = Trooba.use(httpTransport, {
            port: 0
        })
        .use(pipe => {
            pipe.on('request', () => {
                pipe.respond({
                    status: 404,
                    body: 'Not found'
                });
            });
        })
        .build()
        .create('server:default');

        const svr = app.listen(err => {
            Assert.ok(!err, err && err.stack);

            const client = Trooba.use(httpTransport, {
                port: svr.address().port,
                hostname: 'localhost',
                protocol: 'http:'
            }).build();

            client.create().request({
                method: 'GET'
            }, (err, res) => {
                Assert.ok(!err, err && err.stack);
                Assert.equal(404, res.statusCode);
                Assert.equal('Not found', res.body);
                next();
            });
        });
    });

    it('should get 500 response on error', next => {
        const app = Trooba.use(httpTransport, {
            port: 0
        })
        .use(pipe => {
            pipe.on('request', () => {
                pipe.throw(new Error('Boom'));
            });
        })
        .build()
        .create('server:default');

        const svr = app.listen(err => {
            Assert.ok(!err, err && err.stack);

            const client = Trooba.use(httpTransport, {
                port: svr.address().port,
                hostname: 'localhost',
                protocol: 'http:'
            }).build();

            client.create().request({
                method: 'GET'
            }, (err, res) => {
                Assert.ok(!err, err && err.stack);
                Assert.equal(500, res.statusCode);
                Assert.equal('Boom', res.body);
                next();
            });
        });
    });

    it('should serialize/deserialize context', next => {
        const app = Trooba.use(httpTransport, {
            port: 0,
            context: {
                serialize: (context, serverContext) => {
                    const deleted = [];
                    const target = Object.keys(context).reduce((memo, name) => {
                        if (name.charAt(0) !== '$') {
                            if (context[name] === undefined) {
                                deleted.push(name);
                                return memo;
                            }
                            memo[name] = context[name];
                        }
                        return memo;
                    }, {});
                    target['@deleted'] = deleted.length ? deleted : undefined;
                    serverContext.response.setHeader('x-trooba-context', JSON.stringify(target));
                },
                deserialize: (serverContext, context) => {
                    const troobaContext = serverContext.request.headers['x-trooba-context'];
                    if (troobaContext) {
                        Object.assign(context, JSON.parse(troobaContext));
                    }
                }
            }
        })
        .use(pipe => {
            pipe.on('request', () => {
                const actual = Object.keys(pipe.context).reduce((memo, name) => {
                    if (name.charAt(0) !== '$') {
                        memo[name] = pipe.context[name];
                    }
                    return memo;
                }, {});
                Assert.deepEqual({
                    path: '/',
                    operation: 'GET',
                    foo: 'bar',
                    qaz: 'will be deleted',
                    wsx: '1.2&3&amp;4 5',
                    number: 0,
                    bool: false,
                    validate: {
                        request: false
                    }
                }, actual);
                pipe.context.foo = 'new-bar';
                pipe.context.new = 'new';
                pipe.context.qaz = undefined;
                pipe.respond({
                    status: 200,
                    body: 'ok'
                });
            });
        })
        .build()
        .create('server:default');

        const svr = app.listen(err => {
            Assert.ok(!err, err && err.stack);

            const client = Trooba.use(httpTransport, {
                port: svr.address().port,
                hostname: 'localhost',
                protocol: 'http:',
                context: {
                    serialize: (context, requestContext) => {
                        const target = Object.keys(context).reduce((memo, name) => {
                            if (name.charAt(0) !== '$') {
                                memo[name] = context[name];
                            }
                            return memo;
                        }, {});
                        requestContext.headers['x-trooba-context'] = JSON.stringify(target);
                    },
                    deserialize: (responseContext, context) => {
                        let troobaContext = responseContext.headers['x-trooba-context'];
                        if (troobaContext) {
                            troobaContext = JSON.parse(troobaContext);
                            // check if any field needs to be deleted
                            if (troobaContext['@deleted']) {
                                troobaContext['@deleted'].forEach(name => {
                                    delete context[name];
                                });
                                delete troobaContext['@deleted'];
                            }
                            Object.assign(context, (troobaContext));
                        }
                    }
                }
            }).build();

            const clientContext = {
                foo: 'bar',
                qaz: 'will be deleted',
                wsx: '1.2&3&amp;4 5',
                number: 0,
                bool: false
            };

            client.create(clientContext).request({
                method: 'GET'
            }, (err, res) => {
                const context = JSON.parse(res.headers['x-trooba-context']);

                Assert.deepEqual({
                    path: '/',
                    operation: 'GET',
                    foo: 'new-bar',
                    wsx: '1.2&3&amp;4 5',
                    number: 0,
                    bool: false,
                    new: 'new',
                    validate: {
                        request: false
                    },
                    '@deleted': ['qaz']
                }, context);

                // verify clientContext should get desrialized context
                Assert.deepEqual({
                    path: '/',
                    operation: 'GET',
                    foo: 'new-bar',
                    wsx: '1.2&3&amp;4 5',
                    number: 0,
                    bool: false,
                    new: 'new',
                    validate: {
                        request: false
                    }
                }, Object.keys(clientContext).reduce((memo, name) => {
                    if (name.charAt(0) !== '$') {
                        memo[name] = clientContext[name];
                    }
                    return memo;
                }, {}));

                Assert.ok(!err, err && err.stack);
                Assert.equal('ok', res.body);
                next();
            });
        });
    });

    it('should serialize/deserialize context with module serializers', next => {
        const app = Trooba.use(httpTransport, {
            port: 0,
            context: require.resolve('./fixtures/web-context')
        })
        .use(pipe => {
            pipe.on('request', () => {
                const actual = Object.keys(pipe.context).reduce((memo, name) => {
                    if (name.charAt(0) !== '$') {
                        memo[name] = pipe.context[name];
                    }
                    return memo;
                }, {});
                Assert.deepEqual({
                    path: '/',
                    operation: 'GET',
                    foo: 'bar',
                    qaz: 'will be deleted',
                    wsx: '1.2&3&amp;4 5',
                    number: 0,
                    bool: false,
                    validate: {
                        request: false
                    }
                }, actual);
                pipe.context.foo = 'new-bar';
                pipe.context.new = 'new';
                pipe.context.qaz = undefined;
                pipe.respond({
                    status: 200,
                    body: 'ok'
                });
            });
        })
        .build()
        .create('server:default');

        const svr = app.listen(err => {
            Assert.ok(!err, err && err.stack);

            const client = Trooba.use(httpTransport, {
                port: svr.address().port,
                hostname: 'localhost',
                protocol: 'http:',
                context: require.resolve('./fixtures/http-context')
            }).build();

            const clientContext = {
                foo: 'bar',
                qaz: 'will be deleted',
                wsx: '1.2&3&amp;4 5',
                number: 0,
                bool: false
            };

            client.create(clientContext).request({
                method: 'GET'
            }, (err, res) => {
                const context = JSON.parse(res.headers['x-trooba-context']);

                Assert.deepEqual({
                    path: '/',
                    operation: 'GET',
                    foo: 'new-bar',
                    wsx: '1.2&3&amp;4 5',
                    number: 0,
                    bool: false,
                    new: 'new',
                    validate: {
                        request: false
                    },
                    '@deleted': ['qaz']
                }, context);

                // verify clientContext should get desrialized context
                Assert.deepEqual({
                    path: '/',
                    operation: 'GET',
                    foo: 'new-bar',
                    wsx: '1.2&3&amp;4 5',
                    number: 0,
                    bool: false,
                    new: 'new',
                    validate: {
                        request: false
                    }
                }, Object.keys(clientContext).reduce((memo, name) => {
                    if (name.charAt(0) !== '$') {
                        memo[name] = clientContext[name];
                    }
                    return memo;
                }, {}));

                Assert.ok(!err, err && err.stack);
                Assert.equal('ok', res.body);
                next();
            });
        });
    });
});
