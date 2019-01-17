# puppeteer-extensions

[![Build Status](https://travis-ci.org/HuddleEng/puppeteer-extensions.svg?branch=master)](https://travis-ci.org/HuddleEng/puppeteer-extensions)

Provides extension functions for working with Puppeteer, in order to make writing tests easier.

## Usage

-   `page` Puppeteer page instance
-   `timeout` [Optional] Timeout for waits in milliseconds (default: 5000 ms)

```javascript
const extensions = require('puppeteer-extensions')(page);
```

**Example:**

```javascript
(async() {
    const listItem = '.todo-list li';
    ...
    await extensions.waitForNthSelectorAttributeValue(listItem, 1, 'class', 'completed');
})();

```
