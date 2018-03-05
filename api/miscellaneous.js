/**
 *
 * This file represents the miscellaneous API. It exposes functions that don't fit under a particular category.
 *
 **/

const serializeFunctionWithArgs = require('../external/serialization-utils');

module.exports = puppeteerPage => ({
    /**
     * Turn off CSS animations on the page to help avoid flaky visual comparisons
     */
    async turnOffAnimations () {
        return puppeteerPage.evaluate(() => {
            function disableAnimations() {
                const {jQuery} = window;
                if (jQuery) {
                    jQuery.fx.off = true;
                }

                const css = document.createElement('style');
                css.type = 'text/css';
                css.innerHTML = '* { -webkit-transition: none !important; transition: none !important; -webkit-animation: none !important; animation: none !important; }';
                document.body.appendChild( css );
            }

            if (document.readyState !== 'loading') {
                disableAnimations();
            } else {
                window.addEventListener('load', disableAnimations, false);
            }
        })
    },
    /**
     * Fast forward the current time by a given number of milliseconds
     * @param {number} milliseconds - The number of milliseconds to fast forward
     */
    async fastForwardTime(milliseconds) {
        return puppeteerPage.evaluate(milliseconds => {
            window.__oldDate = Date;

            function hackyDate() {
                return new window.__oldDate((new window.__oldDate()).getTime() + milliseconds);
            }

            hackyDate.now = () => {
                return hackyDate().getTime();
            };

            window.Date = hackyDate;
        }, milliseconds);
    },
    /**
     * Run a function on the page
     * @param {function} fn - The function to execute on the page
     * @param {...args} args - Arguments to be passed into the function
     */
    async evaluate(fn, ...args) {
        const fnStr = serializeFunctionWithArgs(fn, ...args);
        return puppeteerPage.evaluate(fnStr);
    },
});
