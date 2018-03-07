/**
 *
 * This file represents the miscellaneous API. It exposes functions that don't fit under a particular category.
 *
 */

import { serializeFunctionWithArgs } from '../external/serialization-utils';
import { Page } from 'puppeteer';

export function init(puppeteerPage: Page): object {
    return {
        /**
         * Turn off CSS animations on the page to help avoid flaky visual comparisons
         */
        async turnOffAnimations() {
            return puppeteerPage.evaluate(() => {
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
        },
        /**
         * Fast forward the current time by a given number of milliseconds
         * @param {number} milliseconds - The number of milliseconds to fast forward
         */
        async fastForwardTime(milliseconds: number) {
            return puppeteerPage.evaluate(milliseconds => {
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
        },
        /**
         * Run a function on the page
         * @param {function} fn - The function to execute on the page
         * @param {...args} args - Arguments to be passed into the function
         */
        async evaluate(fn: () => any, ...args: any[]) {
            const fnStr = serializeFunctionWithArgs(fn, ...args);
            return puppeteerPage.evaluate(fnStr);
        }
    };
}
