/**
 *
 * This file represents the retrieval API. It exposes convenience functions for getting properties/values/state from the UI.
 *
 **/

module.exports = puppeteerPage => ({
    /**
     * Get the value property value for a particular element
     * @param {string} selector - The selector for the element to get the value for
     * @returns {string} value - The value property value for the element
     */
    async getValue(selector) {
        return puppeteerPage.evaluate(selector => {
            return document.querySelector(selector).value;
        }, selector);
    },
    /**
     * Get the text property value for a particular element
     * @param {string} selector - The selector for the element to get the text for
     * @returns {string} value - The text property value for the element
     */
    async getText(selector) {
        return puppeteerPage.evaluate(selector => {
            return document.querySelector(selector).textContent;
        }, selector);
    },
    /**
     * Get the value of a particular property for a particular element
     * @param {string} selector - The selector for the element to get the property value for
     * @param {string} property - The property to look for
     * @returns {string} value - The property value for the element
     */
    async getPropertyValue(selector, property) {
        try {
            return puppeteerPage.evaluate((selector, property) => {
                const element = document.querySelector(selector);
                return element[property];
            }, selector, property);
        } catch(e) {
            throw Error(`Unable able to get ${property} from ${selector}.`, e);
        }
    },
    /**
     * Check if element is focused
     * @param {string} selector - The selector of the element to check for focus state
     * @returns {boolean} Whether the element is focused or not
     */
    async isElementFocused (selector) {
        return puppeteerPage.evaluate(selector => {
            const element = document.querySelector(selector);
            return element === document.activeElement;
        }, selector);
    },
});
