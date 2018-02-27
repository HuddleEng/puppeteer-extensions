const waits = require('./api/waits');
const retrieval = require('./api/retrieval');
const miscellaneous = require('./api/miscellaneous');
const DEFAULT_TIMEOUT_MS = 5000;
let resourceRequests = [];

module.exports = (puppeteerInstance, timeout = DEFAULT_TIMEOUT_MS) => {
    puppeteerInstance.on('request', request => {
        resourceRequests.push(request);
    });

    const resetRequests = () => {
        resourceRequests = [];
    };

    return Object.assign({resetRequests},
        waits(puppeteerInstance, resourceRequests, timeout),
        retrieval(puppeteerInstance),
        miscellaneous(puppeteerInstance),
    );
};