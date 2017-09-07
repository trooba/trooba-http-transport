'use strict';

module.exports = {
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
};
