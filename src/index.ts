import {init as setupWaits} from './api/waits';
import {init as setupRetrieval} from './api/retrieval';
import {init as setupMiscellaneous} from './api/miscellaneous';

const DEFAULT_TIMEOUT_MS = 5000;
let resourceRequests = [];

export function init (puppeteerInstance, timeout = DEFAULT_TIMEOUT_MS) {
    puppeteerInstance.on('request', request => {
        resourceRequests.push(request);
    });

    const resetRequests = () => {
        resourceRequests = [];
    };

    return Object.assign({resetRequests},
        setupWaits(puppeteerInstance, resourceRequests, timeout),
        setupRetrieval(puppeteerInstance),
        setupMiscellaneous(puppeteerInstance),
    );
}