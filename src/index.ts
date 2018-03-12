import Extensions from './Extensions';

const DEFAULT_TIMEOUT_MS: number = 5000;

/**
 * Initialize puppeteer extensions
 * @param puppeteerInstance
 * @param {number} timeout
 */
function init(puppeteerInstance: any, timeout: number = DEFAULT_TIMEOUT_MS): any {
    return new Extensions(puppeteerInstance, timeout);
}

export = init;
