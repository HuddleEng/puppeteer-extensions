import { Page } from 'puppeteer';
import Extensions from './Extensions';

const DEFAULT_TIMEOUT_MS: number = 5000;

/**
 * Initialize puppeteer extensions
 * @param puppeteerPage
 * @param {number} timeout
 */
const init = (
    puppeteerPage: Page,
    timeout: number = DEFAULT_TIMEOUT_MS
): Extensions => {
    return new Extensions(puppeteerPage, timeout);
};

export = init;
