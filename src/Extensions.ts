import { ElementHandle, Page, Request, Response } from 'puppeteer';
import { serializeFunctionWithArgs } from './external/serialization-utils';
import HackyDate from './HackyDate';

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
    public waitForResource(
        resource: string,
        timeout: number = this.defaultTimeout
    ) {
        return new Promise((resolve, reject) => {
            const resourceRequestHasResponded = (): boolean => {
                const resourceRequest = this.resourceRequests.find(
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
                    checkFn: async () => {
                        return resourceRequestHasResponded();
                    },
                    interval: 100,
                    timeout,
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
    public async waitForLoadedWebFontCountToBe(
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
                    return this.puppeteerPage.evaluate(
                        (): boolean => {
                            return !!window.__webFontsAllLoaded;
                        }
                    );
                }

                await this.puppeteerPage.evaluate(() => {
                    return (async () => {
                        try {
                            window.__webFontsAllLoaded = await document.fonts
                                .ready;
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
            checkFn: checkWebFontIsLoaded,
            interval: 100,
            timeout,
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
    public async waitForFunction(
        fn: () => any,
        options: object,
        ...args: any[]
    ) {
        const fnStr = serializeFunctionWithArgs(fn, ...args);
        return this.puppeteerPage.waitForFunction(fnStr, options);
    }

    /**
     * Wait until an element exists on the page and is visible (i.e. not transparent)
     * @param {string} selector - The selector for the element on the page
     * @returns {Promise<ElementHandle>}
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectorselector-options
     */
    public async waitUntilExistsAndVisible(
        selector: string
    ): Promise<ElementHandle> {
        return this.puppeteerPage.waitForSelector(selector, { visible: true });
    }

    /**
     * Wait while an element still exists on the page and is visible (i.e. not transparent)
     * @param {string} selector - The selector for the element on the page
     * @returns {Promise<ElementHandle>}
     * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectorselector-options
     */
    public async waitWhileExistsAndVisible(
        selector: string
    ): Promise<ElementHandle> {
        return this.puppeteerPage.waitForSelector(selector, { hidden: true });
    }

    /**
     * Wait until the selector has visible content (i.e. the element takes up some width and height on the page)
     * @param {string} selector - The selector for the element on the page
     * @returns {Promise<any>}
     */
    public async waitUntilSelectorHasVisibleContent(selector: string) {
        return this.puppeteerPage.waitForFunction(
            s => {
                const elem = document.querySelector(s);
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
    public async waitWhileSelectorHasVisibleContent(selector: string) {
        return this.puppeteerPage.waitForFunction(
            s => {
                const elem = document.querySelector(s);
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
    public async waitForNthSelectorAttribute(
        selector: string,
        nth: number,
        attributeName: string
    ) {
        return this.puppeteerPage.waitForFunction(
            (s, n, a) => {
                const element = document.querySelectorAll(s)[n - 1];
                return typeof element.attributes[a] !== 'undefined';
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
    public async waitForSelectorAttribute(
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
    public async waitForNthSelectorAttributeValue(
        selector: string,
        nth: number,
        attributeName: string,
        attributeValue: string
    ) {
        return this.puppeteerPage.waitForFunction(
            (s, n, a, v) => {
                const element = document.querySelectorAll(s)[n - 1];
                return (
                    element.attributes[a] && element.attributes[a].value === v
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
    public async waitForSelectorAttributeValue(
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
    public async waitForElementCount(selector: string, expectedCount: number) {
        return this.puppeteerPage.waitForFunction(
            (s, c) => {
                return document.querySelectorAll(s).length === c;
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
    public async waitForDocumentTitle(title: string) {
        return this.puppeteerPage.waitForFunction(
            t => {
                const actualTitle = document.title;
                return actualTitle === t;
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
    public async waitForUrl(regex: RegExp) {
        return this.puppeteerPage.waitForFunction(
            r => {
                return r.test(window.location.href);
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
    public async waitFor(milliseconds: number) {
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
    public async getValue(selector: string): Promise<string> {
        return this.puppeteerPage.evaluate(s => {
            return document.querySelector(s).value;
        }, selector);
    }

    /**
     * Get the text property value for a particular element
     * @param {string} selector - The selector for the element to get the text for
     * @returns {Promise<string>} - The text property value for the element
     */
    public async getText(selector: string): Promise<string> {
        return this.puppeteerPage.evaluate(s => {
            return document.querySelector(s).textContent;
        }, selector);
    }

    /**
     * Get the value of a particular property for a particular element
     * @param {string} selector - The selector for the element to get the property value for
     * @param {string} property  - The property to look for
     * @returns {Promise<string>} - The property value for the element
     */
    public async getPropertyValue(
        selector: string,
        property: string
    ): Promise<string> {
        try {
            return this.puppeteerPage.evaluate(
                (s, p) => {
                    const element = document.querySelector(s);
                    return element[p];
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
    public async isElementFocused(selector: string): Promise<boolean> {
        return this.puppeteerPage.evaluate(s => {
            const element = document.querySelector(s);
            return element === document.activeElement;
        }, selector);
    }

    /**
     * Turn off CSS animations on the page to help avoid flaky visual comparisons
     * @returns {Promise<any>}
     */
    public async turnOffAnimations() {
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
    public async fastForwardTime(milliseconds: number) {
        return this.puppeteerPage.evaluate(m => {
            window.__oldDate = Date;
            window.Date = HackyDate.bind(HackyDate, m);
        }, milliseconds);
    }

    /**
     * Run a function on the page
     * @param {() => any} fn - The function to execute on the page
     * @param args - Arguments to be passed into the function
     * @returns {Promise<any>}
     */
    public async evaluate(fn: () => any, ...args: any[]) {
        const fnStr = serializeFunctionWithArgs(fn, ...args);
        return this.puppeteerPage.evaluate(fnStr);
    }

    /**
     * Resets the resource requests cache for the page
     */
    public resetResourceRequests(): void {
        this.resourceRequests = [];
    }
}
