'use strict';

module.exports = {
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
};
