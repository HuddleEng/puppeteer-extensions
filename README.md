# puppeteer-extensions
[![Build Status](https://travis-ci.org/HuddleEng/puppeteer-extensions.svg?branch=master)](https://travis-ci.org/HuddleEng/puppeteer-extensions)

This library exposes a number of convenience functions to extend Puppeteer's API, in order to make writing tests easier.
The idea is that many of these functions (or similar ones) will eventually make their way into Puppeteer's own API, but 
this allows us to experiment with new ways of improving UI testing.

## Usage
- `page` Puppeteer page instance
- `timeout` [Optional] Timeout for waits in milliseconds (default: 5000 ms)

```javascript
const extensions = require('puppeteer-extensions')(page);
```

```javascript
(async() {
    const listItem = '.todo-list li';
    ...
    await extensions.waitForNthSelectorAttributeValue(listItem, 1, 'class', 'completed');
})();

```