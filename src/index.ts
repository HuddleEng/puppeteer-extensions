import {init as setupWaits} from './api/waits';
import {init as setupRetrieval} from './api/retrieval';
import {init as setupMiscellaneous} from './api/miscellaneous';
import {Request} from "puppeteer";

const DEFAULT_TIMEOUT_MS : number = 5000;
let resourceRequests : Request[] = [];

function init(puppeteerInstance: any, timeout : number = DEFAULT_TIMEOUT_MS) {
    puppeteerInstance.on('request', (request: Request) => {
        resourceRequests.push(request);
    });

    const resetRequests = () : void => {
        resourceRequests = [];
    };

    return Object.assign({resetRequests},
        setupWaits(puppeteerInstance, resourceRequests, timeout),
        setupRetrieval(puppeteerInstance),
        setupMiscellaneous(puppeteerInstance),
    );
}

export = init;
