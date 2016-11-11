# trooba-http-transport

HTTP transport for trooba pipeline

There are at least 2 use-cases where we can share the same http api in trooba pipeline, one is for server side calls and the other of ajax call in browser.

## Install

```
npm install trooba-http-transport --save
```

## Usage

```js
require('trooba')
    .transport(httpTransportFactory, {
        protocol: 'http:',
        hostname: 'www.google.com',
        connectTimeout: 100,
        socketTimeout: 1000
    })
    .create()
    .get({
        q: 'nike'
    })
    .set('some', 'header')
    .end(function (err, response) {
        console.log(err, response && response.body)
    });
```
