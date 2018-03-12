import { serializeFunctionWithArgs } from './external/serialization-utils';
import { Request, Page, Response, ElementHandle } from 'puppeteer';

/**
 * @hidden
 */
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

/**
 * @hidden
 */
const isSuccessfulResponse = (request: Request): boolean => {
    const response: Response | null = request.response();

    if (response) {
        return response.status() === 200 || response.status() === 304;
    }

    return false;
};


export default class Extensions {
    private puppeteerPage: Page;
    private resourceRequests: Request[] = [];
    private defaultTimeout: number;

    constructor(puppeteerPage: Page, defaultTimeout: number) {
        this.puppeteerPage = puppeteerPage;
        this.defaultTimeout = defaultTimeout;

        this.puppeteerPage.on('request', (request: Request) => {
            this.resourceRequests.push(request);
        });
    }

    /**
     * wait for a resource request to be responded to
     * @param {string} resource - The URL of the resource (or a substring of it)
     * @param {number} timeout [timeout=defaultTimeout] - Timeout for the checks
     * @returns {Promise<any>}
     */
    waitForResource(resource: string, timeout: number = this.defaultTimeout) {
        return new Promise((resolve, reject) => {
            const resourceRequestHasResponded = (): boolean => {
                const resourceRequest =
                    this.resourceRequests.find(
                        r => r.url().indexOf(resource) !== -1
                    );
                if (resourceRequest) {
                    return isSuccessfulResponse(resourceRequest);
                }

                return false;
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
    }

    /**
     * Wait for a specific number of web fonts to be loaded and ready on the page
     * @param {number} count - The number of web fonts to expect
     * @param {number} timeout [timeout=defaultTimeout] - Timeout for the check
     * @returns {Promise<string>}
     */
    async waitForLoadedWebFontCountToBe(
        count: number,
        timeout: number = this.defaultTimeout
    ) {
        let hasInjectedWebFontsAllLoadedFunction = false;

        async function checkWebFontIsLoaded(): Promise<boolean> {
            const fontResponses = this.resourceRequests.filter(r => {
                if (r.resourceType() === 'font') {
                    return isSuccessfulResponse(r);
                }

                return false;
            });

            if (fontResponses.length === count) {
                if (hasInjectedWebFontsAllLoadedFunction) {
                    return this.puppeteerPage.evaluate((): boolean => {
                        return !!window.__webFontsAllLoaded;
                    });
                }

                await this.puppeteerPage.evaluate(() => {
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
    }

    /**
     * Wait for function to execute on the page
     * @param {() => any} fn - The function to execute on the page
     * @param {Object} options - Optional waiting parameters
     * @param args - Arguments to be passed into the function
     * @returns {Promise<any>}
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforfunctionpagefunction-options-args
     */
    async waitForFunction(fn: () => any, options: object, ...args: any[]) {
        const fnStr = serializeFunctionWithArgs(fn, ...args);
        return this.puppeteerPage.waitForFunction(fnStr, options);
    }

    /**
     * Wait until an element exists on the page and is visible (i.e. not transparent)
     * @param {string} selector - The selector for the element on the page
     * @returns {Promise<ElementHandle>}
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectorselector-options
     */
    async waitUntilExistsAndVisible(selector: string) : Promise<ElementHandle>{
        return this.puppeteerPage.waitForSelector(selector, { visible: true });
    }

    /**
     * Wait while an element still exists on the page and is visible (i.e. not transparent)
     * @param {string} selector - The selector for the element on the page
     * @returns {Promise<ElementHandle>}
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectorselector-options
     */
    async waitWhileExistsAndVisible(selector: string) : Promise<ElementHandle>{
        return this.puppeteerPage.waitForSelector(selector, { hidden: true });
    }

    /**
     * Wait until the selector has visible content (i.e. the element takes up some width and height on the page)
     * @param {string} selector - The selector for the element on the page
     * @returns {Promise<any>}
     */
    async waitUntilSelectorHasVisibleContent(selector: string) {
        return this.puppeteerPage.waitForFunction(
            selector => {
                const elem = document.querySelector(selector);
                const isVisible =
                    elem.offsetWidth ||
                    elem.offsetHeight ||
                    elem.getClientRects().length;
                return !!isVisible;
            },
            { timeout: this.defaultTimeout },
            selector
        );
    }

    /**
     * Wait while the selector has visible content (i.e. the element takes up some width and height on the page)
     * @param {string} selector - The selector for the element on the page
     * @returns {Promise<any>}
     */
    async waitWhileSelectorHasVisibleContent(selector: string) {
        return this.puppeteerPage.waitForFunction(
            selector => {
                const elem = document.querySelector(selector);
                const isVisible =
                    elem.offsetWidth ||
                    elem.offsetHeight ||
                    elem.getClientRects().length;
                return !isVisible;
            },
            { timeout: this.defaultTimeout },
            selector
        );
    }

    /**
     * Wait for the nth element found from the selector has a particular attribute
     * @param {string} selector - The selector for the element on the page
     * @param {number} nth - The nth element found by the selector
     * @param {string} attributeName - The attribute name to look for
     * @returns {Promise<any>}
     */
    async waitForNthSelectorAttribute(
        selector: string,
        nth: number,
        attributeName: string
    ) {
        return this.puppeteerPage.waitForFunction(
            (selector, nth, attributeName) => {
                const element = document.querySelectorAll(selector)[
                nth - 1
                    ];
                return (
                    typeof element.attributes[attributeName] !== 'undefined'
                );
            },
            { timeout: this.defaultTimeout },
            selector,
            nth,
            attributeName
        );
    }

    /**
     * Wait for the element found from the selector has a particular attribute
     * @param {string} selector - The selector for the element on the page
     * @param {string} attributeName - The attribute name to look for
     * @returns {Promise<Promise<any>>}
     */
    async waitForSelectorAttribute(
        selector: string,
        attributeName: string
    ) {
        return this.waitForNthSelectorAttribute(selector, 1, attributeName);
    }

    /**
     * Wait for the nth element found from the selector has a particular attribute value pair
     * @param {string} selector - The selector for the element on the page
     * @param {number} nth - The nth element found by the selector
     * @param {string} attributeName - The attribute name to look for
     * @param {string} attributeValue - The attribute value to match the attributeName
     * @returns {Promise<any>}
     */
    async waitForNthSelectorAttributeValue(
        selector: string,
        nth: number,
        attributeName: string,
        attributeValue: string
    ) {
        return this.puppeteerPage.waitForFunction(
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
            { timeout: this.defaultTimeout },
            selector,
            nth,
            attributeName,
            attributeValue
        );
    }

    /**
     * Wait for the element found from the selector has a particular attribute value pair
     * @param {string} selector - The selector for the element on the page
     * @param {string} attributeName - The attribute name to look for
     * @param {string} attributeValue - The attribute value to match the attributeName
     * @returns {Promise<Promise<any>>}
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
    }

    /**
     * Wait for the element count to be a particular value
     * @param {string} selector - The selector for the element on the page
     * @param {number} expectedCount - The number of elements to expect
     * @returns {Promise<any>}
     */
    async waitForElementCount(selector: string, expectedCount: number) {
        return this.puppeteerPage.waitForFunction(
            (selector, expectedCount) => {
                return (
                    document.querySelectorAll(selector).length ===
                    expectedCount
                );
            },
            { timeout: this.defaultTimeout },
            selector,
            expectedCount
        );
    }

    /**
     * Wait for the document title to be a particular string
     * @param {string} title - The expected title of the document
     * @returns {Promise<any>}
     */
    async waitForDocumentTitle(title: string) {
        return this.puppeteerPage.waitForFunction(
            title => {
                const actualTitle = document.title;
                return actualTitle === title;
            },
            { timeout: this.defaultTimeout },
            title
        );
    }

    /**
     * Wait for the current window location to match a particular regular expression
     * @param {RegExp} regex - The regular expression to match the URL on
     * @returns {Promise<Promise<Promise<any>> | Promise<any>>}
     */
    async waitForUrl(regex: RegExp) {
        return this.puppeteerPage.waitForFunction(
            regex => {
                return regex.test(window.location.href);
            },
            { timeout: this.defaultTimeout },
            regex
        );
    }

    /**
     * Wait for a given number of milliseconds
     * @param {number} milliseconds - The number of milliseconds to wait for
     * @returns {Promise<any>}
     */
    async waitFor(milliseconds: number) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }

    /**
     * Get the value property value for a particular element
     * @param {string} selector - The selector for the element to get the value for
     * @returns {Promise<string>} - The value property value for the element
     */
    async getValue(selector: string): Promise<string> {
        return this.puppeteerPage.evaluate(selector => {
            return document.querySelector(selector).value;
        }, selector);
    }

    /**
     * Get the text property value for a particular element
     * @param {string} selector - The selector for the element to get the text for
     * @returns {Promise<string>} - The text property value for the element
     */
    async getText(selector: string): Promise<string> {
        return this.puppeteerPage.evaluate(selector => {
            return document.querySelector(selector).textContent;
        }, selector);
    }

    /**
     * Get the value of a particular property for a particular element
     * @param {string} selector - The selector for the element to get the property value for
     * @param {string} property  - The property to look for
     * @returns {Promise<string>} - The property value for the element
     */
    async getPropertyValue(
        selector: string,
        property: string
    ): Promise<string> {
        try {
            return this.puppeteerPage.evaluate(
                (selector, property) => {
                    const element = document.querySelector(selector);
                    return element[property];
                },
                selector,
                property
            );
        } catch (e) {
            throw Error(`Unable able to get ${property} from ${selector}.`);
        }
    }

    /**
     * Check if element is focused
     * @param {string} selector - The selector of the element to check for focus state
     * @returns {Promise<boolean>} - Whether the element is focused or not
     */
    async isElementFocused(selector: string): Promise<boolean> {
        return this.puppeteerPage.evaluate(selector => {
            const element = document.querySelector(selector);
            return element === document.activeElement;
        }, selector);
    }

    /**
     * Turn off CSS animations on the page to help avoid flaky visual comparisons
     * @returns {Promise<any>}
     */
    async turnOffAnimations() {
        return this.puppeteerPage.evaluate(() => {
            function disableAnimations() {
                const { jQuery } = window;
                if (jQuery) {
                    jQuery.fx.off = true;
                }

                const css = document.createElement('style');
                css.type = 'text/css';
                css.innerHTML =
                    '* { -webkit-transition: none !important; transition: none !important; -webkit-animation: none !important; animation: none !important; }';
                document.body.appendChild(css);
            }

            if (document.readyState !== 'loading') {
                disableAnimations();
            } else {
                window.addEventListener('load', disableAnimations, false);
            }
        });
    }

    /**
     * Fast forward the current time by a given number of milliseconds
     * @param {number} milliseconds - The number of milliseconds to fast forward
     * @returns {Promise<any>}
     */
    async fastForwardTime(milliseconds: number) {
        return this.puppeteerPage.evaluate(milliseconds => {
            window.__oldDate = Date;

            class HackyDate {
                date: Date;

                constructor() {
                    this.date = new window.__oldDate(
                        new window.__oldDate().getTime() + milliseconds
                    );
                }

                now() {
                    return this.date.getTime();
                }
            }

            window.Date = HackyDate;
        }, milliseconds);
    }

    /**
     * Run a function on the page
     * @param {() => any} fn - The function to execute on the page
     * @param args - Arguments to be passed into the function
     * @returns {Promise<any>}
     */
    async evaluate(fn: () => any, ...args: any[]) {
        const fnStr = serializeFunctionWithArgs(fn, ...args);
        return this.puppeteerPage.evaluate(fnStr);
    }

    /**
     * Resets the resource requests cache for the page
     */
    resetResourceRequests() : void {
        this.resourceRequests = [];
    }
}