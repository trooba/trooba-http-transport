'use strict';

var Assert = require('assert');
var Http = require('http');
var Trooba = require('trooba');
var nock = require('nock');

var httpTransportFactory = require('..');

describe(__filename, function () {
    after(function () {
        nock.cleanAll();
    });

    it('should make http call', function (done) {
        var session = nock('http://www.trooba.xc')
            .get('/?q=nike')
            .reply(200, 'some text');

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc'
            })
            .create({
                foo: 'bar'
            });

        client.get({
            q: 'nike'
        }).end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal('some text', response.body.toString());
            done();
        });
    });

    it('should handle unknwon host', function (done) {
        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'sss'
            })
            .create({
                foo: 'bar'
            });

        client.get({
            q: 'nike'
        }).end(function (err, response) {
            Assert.ok(err);
            Assert.equal('ENOTFOUND', err.code);
            done();
        });
    });

    describe('should handle connect timeout', function () {
        it('test', function (done) {
            var client = Trooba
                .transport(httpTransportFactory, {
                    protocol: 'http:',
                    hostname: 'localhost',
                    connectTimeout: 1
                })
                .create({
                    foo: 'bar'
                });

            client.get({
                q: 'nike'
            }).end(function (err, response) {
                Assert.ok(err);
                Assert.equal(504, err.output.statusCode);
                done();
            });
        });
    });

    describe('should handle socket timeout', function () {
        var svr;
        var port;
        var called;
        before(function (next) {
            var app = Http.createServer(function (req, res) {
                called = true;
                res.writeHead(200);
                res.write('chunk');
                // no response after that
            });
            svr = app.listen(function () {
                port = svr.address().port;
                next();
            });
        });

        after(function () {
            svr.close();
        });

        it('test', function (done) {
            var client = Trooba
                .transport(httpTransportFactory, {
                    protocol: 'http:',
                    hostname: 'localhost',
                    port: port,
                    socketTimeout: 1
                })
                .create({
                    foo: 'bar'
                });

            client.get({
                q: 'nike'
            }).end(function (err, response) {
                Assert.ok(err);
                Assert.equal(408, err.output.statusCode);
                done();
            });
        });
    });

    it('should handle 404', function (done) {
        var session = nock('http://www.trooba.xc')
            .get('/?q=nike')
            .reply(404, 'some text');

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc'
            })
            .create({
                foo: 'bar'
            });

        client.get({
            q: 'nike'
        }).end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal(404, response.statusCode);
            done();
        });
    });

    it('should handle 500', function (done) {
        var session = nock('http://www.trooba.xc')
            .get('/?q=nike')
            .reply(500, 'some text');

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc'
            })
            .create({
                foo: 'bar'
            });

        client.get({
            q: 'nike'
        }).end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal(500, response.statusCode);
            done();
        });
    });

    it('should handle JSON response', function (done) {
        var session = nock('http://www.trooba.xc')
            .get('/?q=nike')
            .reply(200, {
                foo: 'bar'
            });

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc',
                json: true
            })
            .create();

        client.get({
            q: 'nike'
        }).end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal(200, response.statusCode);
            Assert.equal('object', typeof response.body);
            Assert.deepEqual({ foo: 'bar' }, response.body);
            done();
        });
    });

    it('should do get', function (done) {
        var session = nock('http://www.trooba.xc')
            .get('/?q=nike')
            .reply(200, {
                foo: 'bar'
            });

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc',
                json: true
            })
            .create();

        client.get({
            q: 'nike'
        }).end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal(200, response.statusCode);
            Assert.deepEqual({ foo: 'bar' }, response.body);
            done();
        });
    });

    it('should do post', function (done) {
        var session = nock('http://www.trooba.xc')
            .post('/', {
                q: 'nike'
            })
            .reply(200, function(uri, requestBody) {
                return {
                    foo: 'bar'
                };
            });

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc',
                json: true
            })
            .create();

        client.post({
            q: 'nike'
        }).end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal(200, response.statusCode);
            Assert.deepEqual({ foo: 'bar' }, response.body);
            done();
        });
    });

    it('should do put', function (done) {
        var session = nock('http://www.trooba.xc')
            .put('/user', {
                q: 'nike'
            })
            .reply(200, function(uri, requestBody) {
                return {
                    foo: 'bar'
                };
            });

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc',
                json: true
            })
            .create();

        client.put({
            q: 'nike'
        })
        .path('/user')
        .end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal(200, response.statusCode);
            Assert.deepEqual({ foo: 'bar' }, response.body);
            done();
        });
    });

    it('should do delete', function (done) {
        var session = nock('http://www.trooba.xc')
            .put('/user', {
                q: 'nike'
            })
            .reply(200, function(uri, requestBody) {
                return {
                    foo: 'bar'
                };
            });

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc',
                json: true
            })
            .create();

        client.put({
            q: 'nike'
        })
        .path('/user')
        .end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal(200, response.statusCode);
            Assert.deepEqual({ foo: 'bar' }, response.body);
            done();
        });
    });

    it('should do patch', function (done) {
        var session = nock('http://www.trooba.xc')
            .patch('/user', {
                q: 'nike'
            })
            .reply(200, function(uri, requestBody) {
                return {
                    foo: 'bar'
                };
            });

        var client = Trooba
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.trooba.xc',
                json: true
            })
            .create();

        client.patch({
            q: 'nike'
        })
        .path('/user')
        .end(function (err, response) {
            session.done();
            Assert.ok(!err);
            Assert.equal(200, response.statusCode);
            Assert.deepEqual({ foo: 'bar' }, response.body);
            done();
        });
    });

    it.skip('readme example', function (done) {
        var client = require('trooba')
            .transport(httpTransportFactory, {
                protocol: 'http:',
                hostname: 'www.google.com'
            })
            .create();

        client.get({
            q: 'nike'
        })
        .set('some', 'header')
        .end(function (err, response) {
            Assert.ok(!err);
            Assert.equal(200, response.statusCode);
            Assert.ok(response.body);
            done();
        });
    });
});
