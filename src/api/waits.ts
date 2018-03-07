/**
 *
 * This file represents the waits API. It exposes useful polling functions for particular resources or selectors
 *
 */

import { serializeFunctionWithArgs } from '../external/serialization-utils';
import { Request, Page, Response } from 'puppeteer';

const pollFor = ({
    checkFn,
    interval,
    timeout,
    timeoutMsg
}: {
    checkFn: () => Promise<boolean>;
    interval: number;
    timeout: number;
    timeoutMsg: string;
}): Promise<string> => {
    return new Promise((resolve, reject) => {
        const startTime = new Date().getTime();
        const timer = setInterval(async () => {
            if (new Date().getTime() - startTime < timeout) {
                if (await checkFn()) {
                    clearInterval(timer);
                    resolve('Finished polling');
                }
            } else {
                clearInterval(timer);
                reject(timeoutMsg);
            }
        }, interval);
    });
};

const isSuccessfulResponse = (request: Request): boolean => {
    const response: Response | null = request.response();

    if (response) {
        return response.status() === 200 || response.status() === 304;
    }

    return false;
};

export function init(puppeteerPage: Page, requests, defaultTimeout): object {
    return {
        /**
         * Wait for a resource request to be responded to
         * @param {string} resource - The URL of the resource (or a substring of it)
         * @param {number] [timeout=defaultTimeout] - Timeout for the check
         */
        waitForResource(resource: string, timeout: number = defaultTimeout) {
            return new Promise((resolve, reject) => {
                const resourceRequestHasResponded = (): boolean => {
                    const resourceRequest =
                        requests &&
                        requests.find(
                            r => r.url && r.url().indexOf(resource) !== -1
                        );
                    return isSuccessfulResponse(resourceRequest);
                };

                if (resourceRequestHasResponded()) {
                    resolve();
                } else {
                    pollFor({
                        timeout,
                        checkFn: async () => {
                            return resourceRequestHasResponded();
                        },
                        interval: 100,
                        timeoutMsg: 'Timeout waiting for resource match.'
                    })
                        .then(resolve)
                        .catch(reject);
                }
            });
        },
        /**
         * Wait for a specific number of web fonts to be loaded and ready on the page
         * @param {number} count - The number of web fonts to expect
         * @param {number] [timeout=defaultTimeout] - Timeout for the check
         */
        async waitForLoadedWebFontCountToBe(
            count: number,
            timeout: number = defaultTimeout
        ) {
            let hasInjectedWebFontsAllLoadedFunction = false;

            async function checkWebFontIsLoaded(): Promise<boolean> {
                const fontResponses = requests.filter(r => {
                    if (r.resourceType() === 'font') {
                        return isSuccessfulResponse(r);
                    }

                    return false;
                });

                if (fontResponses.length === count) {
                    if (hasInjectedWebFontsAllLoadedFunction) {
                        return puppeteerPage.evaluate((): boolean => {
                            return !!window.__webFontsAllLoaded;
                        });
                    }

                    await puppeteerPage.evaluate(() => {
                        return (async function() {
                            try {
                                window.__webFontsAllLoaded = await document
                                    .fonts.ready;
                            } catch (e) {
                                return false;
                            }
                        })();
                    });

                    hasInjectedWebFontsAllLoadedFunction = true;
                    return false;
                }

                return false;
            }

            return pollFor({
                timeout,
                checkFn: checkWebFontIsLoaded,
                interval: 100,
                timeoutMsg: `Timeout waiting for ${count} web font responses`
            });
        },
        /**
         * Wait for function to execute on the page
         * @param {function} fn - The function to execute on the page
         * @param {object} options - Optional waiting parameters
         * @param {...args} args - Arguments to be passed into the function
         * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforfunctionpagefunction-options-args
         */
        async waitForFunction(fn: () => any, options: object, ...args: any[]) {
            const fnStr = serializeFunctionWithArgs(fn, ...args);
            return puppeteerPage.waitForFunction(fnStr, options);
        },
        /**
         * Wait until an element exists on the page and is visible (i.e. not transparent)
         * @param {string} selector - The selector for the element on the page
         * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectorselector-options
         */
        async waitUntilExistsAndVisible(selector: string) {
            return puppeteerPage.waitForSelector(selector, { visible: true });
        },
        /**
         * Wait while an element still exists on the page and is visible (i.e. not transparent)
         * @param {string} selector - The selector for the element on the page
         * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectorselector-options
         */
        async waitWhileExistsAndVisible(selector: string) {
            return puppeteerPage.waitForSelector(selector, { hidden: true });
        },
        /**
         * Wait until the selector has visible content (i.e. the element takes up some width and height on the page)
         * @param {string} selector - The selector for the element on the page
         */
        async waitUntilSelectorHasVisibleContent(selector: string) {
            return puppeteerPage.waitForFunction(
                selector => {
                    const elem = document.querySelector(selector);
                    const isVisible =
                        elem.offsetWidth ||
                        elem.offsetHeight ||
                        elem.getClientRects().length;
                    return !!isVisible;
                },
                { timeout: defaultTimeout },
                selector
            );
        },
        /**
         * Wait while the selector has visible content (i.e. the element takes up some width and height on the page)
         * @param {string} selector - The selector for the element on the page
         */
        async waitWhileSelectorHasVisibleContent(selector: string) {
            return puppeteerPage.waitForFunction(
                selector => {
                    const elem = document.querySelector(selector);
                    const isVisible =
                        elem.offsetWidth ||
                        elem.offsetHeight ||
                        elem.getClientRects().length;
                    return !isVisible;
                },
                { timeout: defaultTimeout },
                selector
            );
        },
        /**
         * Wait for the nth element found from the selector has a particular attribute
         * @param {string} selector - The selector for the element on the page
         * @param {number} nth - The nth element found by the selector
         * @param {string} attributeName - The attribute name to look for
         */
        async waitForNthSelectorAttribute(
            selector: string,
            nth: number,
            attributeName: string
        ) {
            return puppeteerPage.waitForFunction(
                (selector, nth, attributeName) => {
                    const element = document.querySelectorAll(selector)[
                        nth - 1
                    ];
                    return (
                        typeof element.attributes[attributeName] !== 'undefined'
                    );
                },
                { timeout: defaultTimeout },
                selector,
                nth,
                attributeName
            );
        },
        /**
         * Wait for the element found from the selector has a particular attribute
         * @param {string} selector - The selector for the element on the page
         * @param {string} attributeName - The attribute name to look for
         */
        async waitForSelectorAttribute(
            selector: string,
            attributeName: string
        ) {
            return this.waitForNthSelectorAttribute(selector, 1, attributeName);
        },
        /**
         * Wait for the nth element found from the selector has a particular attribute value pair
         * @param {string} selector - The selector for the element on the page
         * @param {number} nth - The nth element found by the selector
         * @param {string} attributeName - The attribute name to look for
         * @param {string} attributeValue - The attribute value to match the attributeName
         */
        async waitForNthSelectorAttributeValue(
            selector: string,
            nth: number,
            attributeName: string,
            attributeValue: string
        ) {
            return puppeteerPage.waitForFunction(
                (selector, nth, attributeName, attributeValue) => {
                    const element = document.querySelectorAll(selector)[
                        nth - 1
                    ];
                    return (
                        element.attributes[attributeName] &&
                        element.attributes[attributeName].value ===
                            attributeValue
                    );
                },
                { timeout: defaultTimeout },
                selector,
                nth,
                attributeName,
                attributeValue
            );
        },
        /**
         * Wait for the element found from the selector has a particular attribute value pair
         * @param {string} selector - The selector for the element on the page
         * @param {string} attributeName - The attribute name to look for
         * @param {string} attributeValue - The attribute value to match the attributeName
         */
        async waitForSelectorAttributeValue(
            selector: string,
            attributeName: string,
            attributeValue: string
        ) {
            return this.waitForNthSelectorAttributeValue(
                selector,
                1,
                attributeName,
                attributeValue
            );
        },
        /**
         * Wait for the element count to be a particular value
         * @param {string} selector - The selector for the element on the page
         * @param {number} expectedCount - The number of elements to expect
         */
        async waitForElementCount(selector: string, expectedCount: number) {
            return puppeteerPage.waitForFunction(
                (selector, expectedCount) => {
                    return (
                        document.querySelectorAll(selector).length ===
                        expectedCount
                    );
                },
                { timeout: defaultTimeout },
                selector,
                expectedCount
            );
        },
        /**
         * Wait for the document title to be a particular string
         * @param {string} title - The expected title of the document
         */
        async waitForDocumentTitle(title: string) {
            return puppeteerPage.waitForFunction(
                title => {
                    const actualTitle = document.title;
                    return actualTitle === title;
                },
                { timeout: defaultTimeout },
                title
            );
        },
        /**
         * Wait for the current window location to match a particular regular expression
         * @param {RegExp} regex - The regular expression to match the URL on
         */
        async waitForUrl(regex: RegExp) {
            return this.waitForFunction(
                regex => {
                    return regex.test(window.location.href);
                },
                { timeout: defaultTimeout },
                regex
            );
        },
        /**
         * Wait for a given number of milliseconds
         * @param {number} milliseconds - The number of milliseconds to wait for
         */
        async waitFor(milliseconds: number) {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, milliseconds);
            });
        }
    };
}
