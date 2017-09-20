# trooba-http-transport

[![Greenkeeper badge](https://badges.greenkeeper.io/trooba/trooba-http-transport.svg)](https://greenkeeper.io/)

[![codecov](https://codecov.io/gh/trooba/trooba-http-transport/branch/master/graph/badge.svg)](https://codecov.io/gh/trooba/trooba-http-transport)
[![Build Status](https://travis-ci.org/trooba/trooba-http-transport.svg?branch=master)](https://travis-ci.org/trooba/trooba-http-transport) [![NPM](https://img.shields.io/npm/v/trooba-http-transport.svg)](https://www.npmjs.com/package/trooba-http-transport)
[![Downloads](https://img.shields.io/npm/dm/trooba-http-transport.svg)](http://npm-stat.com/charts.html?package=trooba-http-transport)
[![Known Vulnerabilities](https://snyk.io/test/github/trooba/trooba-http-transport/badge.svg)](https://snyk.io/test/github/trooba/trooba-http-transport)

HTTP transport for trooba pipeline.

The transport provides server and client API with trooba context propagation support. For more information one might want to read [this](https://trooba.github.io/docs/transport-with-context/).

## Get Involved

- **Contributing**: Pull requests are welcome!
    - Read [`CONTRIBUTING.md`](.github/CONTRIBUTING.md) and check out our [bite-sized](https://github.com/trooba/trooba-http-transport/issues?q=is%3Aissue+is%3Aopen+label%3Adifficulty%3Abite-sized) and [help-wanted](https://github.com/trooba/trooba-http-transport/issues?q=is%3Aissue+is%3Aopen+label%3Astatus%3Ahelp-wanted) issues
    - Submit github issues for any feature enhancements, bugs or documentation problems
- **Support**: Join our [gitter chat](https://gitter.im/trooba) to ask questions to get support from the maintainers and other Trooba developers
    - Questions/comments can also be posted as [github issues](https://github.com/trooba/trooba-http-transport/issues)

## Install

```
npm install trooba-http-transport --save
```

## Usage

The context serialization logic depends on type of the pipeline:

* Web application
* Service application
* Service invocation

### Web application pipeline

This type of pipeline needs to deserialize context from cookies into pipe.context and in the response flow from pipe.context into cookies.

```js
const Cookies = require('cookies');
const app = Trooba.use(httpTransport, {
    port: 0,
    context: {
        serialize: (context, serverContext) => {
            const target = Object.keys(context).forEach(name => {
                if (name.charAt(0) !== '$') {
                    const options = context[name] === undefined ?
                        // delete cookie if the property is deleted
                        {maxAge: -1} :
                        {}
                    serverContext.cookies.set(name, context[name], options);
                }
            }, {});
        },
        deserialize: (serverContext, context) => {
            serverContext.cookies = new Cookies(
                serverContext.request,
                serverContext.response,
                { keys: keys });

            context.userName = serverContext.cookies.get('username');
            context.locale = serverContext.cookies.get('locale');
            context.jsEnabled = serverContext.cookies.get('jsEnabled');
        }
    }
});
```

### Service application pipeline

This type of pipeline needs to deserialize context from request header/headers into pipe.context and in the response flow from pipe.context into response header/headers.

```js
const app = Trooba.use(httpTransport, {
    port: 0,
    context: {
        serialize: (context, serverContext) => {
            const deleted = [];
            const target = Object.keys(context).reduce((memo, name) => {
                if (name.charAt(0) !== '$') {
                    if (context[name] === undefined) {
                        // remember what was deleted
                        deleted.push(name);
                        return memo;
                    }
                    memo[name] = context[name];
                }
                return memo;
            }, {});
            // propagate deleted fields
            target['@deleted'] = deleted.length ? deleted : undefined;
            serverContext.response.setHeader('x-trooba-context', JSON.stringify(target));
        },
        deserialize: (serverContext, context) => {
            const pipeContext = serverContext.request.headers['x-trooba-context'];
            if (pipeContext) {
                Object.assign(context, JSON.parse(pipeContext));
            }
        }
    }
});
```

### Service invocation pipeline

This type of pipeline needs to serialize context into a special request header/headers and in the response flow deserialize from response header/headers into pipe.context.

For example, one can use the following context provider:

```js
require('trooba')
    .use(httpTransport, {
        protocol: 'http:',
        hostname: 'www.google.com',
        connectTimeout: 100,
        socketTimeout: 1000,
        context: { // context is optional
            serialize: (context, serverContext) => {
                const target = Object.keys(context).reduce((memo, name) => {
                    if (name.charAt(0) !== '$') {
                        memo[name] = context[name];
                    }
                    return memo;
                }, {});
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
    .build('client:default')
    .get({
        q: 'nike'
    })
    .set('some', 'header')
    .end(function (err, response) {
        console.log(err, response && response.body)
    });
```
