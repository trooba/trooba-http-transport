# trooba-http-transport

[![Build Status](https://travis-ci.org/trooba/trooba-http-transport.svg?branch=master)](https://travis-ci.org/trooba/trooba-http-transport) [![NPM](https://img.shields.io/npm/v/trooba-http-transport.svg)](https://www.npmjs.com/package/trooba-http-transport)
[![Downloads](https://img.shields.io/npm/dm/trooba-http-transport.svg)](http://npm-stat.com/charts.html?package=trooba-http-transport)
[![Known Vulnerabilities](https://snyk.io/test/github/trooba/trooba/badge.svg)](https://snyk.io/test/github/trooba/trooba-http-transport)

HTTP transport for trooba pipeline

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
    .build()
    .get({
        q: 'nike'
    })
    .set('some', 'header')
    .end(function (err, response) {
        console.log(err, response && response.body)
    });
```
