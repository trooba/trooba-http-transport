# trooba-http-transport

[![Greenkeeper badge](https://badges.greenkeeper.io/trooba/trooba-http-transport.svg)](https://greenkeeper.io/)

[![codecov](https://codecov.io/gh/trooba/trooba-http-transport/branch/master/graph/badge.svg)](https://codecov.io/gh/trooba/trooba-http-transport)
[![Build Status](https://travis-ci.org/trooba/trooba-http-transport.svg?branch=master)](https://travis-ci.org/trooba/trooba-http-transport) [![NPM](https://img.shields.io/npm/v/trooba-http-transport.svg)](https://www.npmjs.com/package/trooba-http-transport)
[![Downloads](https://img.shields.io/npm/dm/trooba-http-transport.svg)](http://npm-stat.com/charts.html?package=trooba-http-transport)
[![Known Vulnerabilities](https://snyk.io/test/github/trooba/trooba-http-transport/badge.svg)](https://snyk.io/test/github/trooba/trooba-http-transport)

HTTP transport for trooba pipeline

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

```js
require('trooba')
    .use(httpTransport, {
        protocol: 'http:',
        hostname: 'www.google.com',
        connectTimeout: 100,
        socketTimeout: 1000
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
