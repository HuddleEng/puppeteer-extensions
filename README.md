# puppeteer-extensions
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
    await page.extensions.waitForNthSelectorAttributeValue(listItem, 1, 'class', 'completed');
})();

```


## API
The API is split into categories to better organise the extension functions. This currently includes:

- [Waits](#waits)
- [Retrieval](#retrieval)
- [Miscellaneous](#miscellaneous)


**resetRequests()**

Resets the requests cache used by the `waits` API. This should be called when you are going to navigate to another page,
in order to track the new requests correctly. 

## Waits
**waitForResource(resource, timeout=defaultTimeout)**
- `resource` \<string> The URL of the resource (or a substring of it)
- `timeout` \<number> Timeout for the check

Wait for a resource request to be responded to


**waitForLoadedWebFontCountToBe(count, timeout=defaultTimeout)**
- `count` \<number> The number of web fonts to expect
- `timeout` \<number> Timeout for the check

Wait for a specific number of web fonts to be loaded and ready on the page


**waitForFunction(fn, options, ...args)**
- `fn` \<function> The function to execute on the page
- `options` \<object> Optional waiting parameters
- `args` \<...args> Arguments to be passed into the function

Wait for function to execute on the page (see [waitForFunction](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforfunctionpagefunction-options-args))


**waitUntilExistsAndVisible(selector)**
- `selector` \<string> The selector for the element on the page

Wait until an element exists on the page and is visible (i.e. not transparent) (see [waitForSelector](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectorselector-options))


**waitWhileExistsAndVisible(selector)**
- `selector` \<string> The selector for the element on the page

Wait while an element still exists on the page and is visible (i.e. not transparent) (see [waitForSelector](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitforselectorselector-options))


**waitUntilSelectorHasVisibleContent(selector)**
- `selector` \<string> The selector for the element on the page

Wait until the selector has visible content (i.e. the element takes up some width and height on the page) (i.e. not transparent)


**waitWhileSelectorHasVisibleContent(selector)**
- `selector` \<string> The selector for the element on the page

Wait while the selector has visible content (i.e. the element takes up some width and height on the page) (i.e. not transparent)


**waitForNthSelectorAttribute(selector, nth, attributeName)**
- `selector` \<string> The selector for the element on the page
- `nth` \<number> The nth element found by the selector
- `attributeName` \<string> The attribute name to look for

Wait for the nth element found from the selector has a particular attribute


**waitForSelectorAttribute(selector, attributeName)**
- `selector` \<string> The selector for the element on the page
- `attributeName` \<string> The attribute name to look for

Wait for the element found from the selector has a particular attribute


**waitForNthSelectorAttributeValue(selector, nth, attributeName, attributeValue)**
- `selector` \<string> The selector for the element on the page
- `nth` \<number> The nth element found by the selector
- `attributeName` \<string> The attribute name to look for
- `attributeValue` \<string> The attribute value to match the attributeName

Wait for the nth element found from the selector has a particular attribute value pair


**waitForSelectorAttributeValue(selector, attributeName, attributeValue)**
- `selector` \<string> The selector for the element on the page
- `attributeName` \<string> The attribute name to look for
- `attributeValue` \<string> The attribute value to match the attributeName

Wait for the element found from the selector has a particular attribute value pair


**waitForElementCount(selector, expectedCount)**
- `selector` \<string> The selector for the element on the page
- `expectedCount` \<number> The number of elements to expect

Wait for the element count to be a particular value


**waitForDocumentTitle(title)**
- `title` \<string> The expected title of the document

Wait for the document title to be a particular string


**waitForUrl(regex)**
- `regex` \<RegExp> The regular expression to match the URL on

Wait for the current window location to match a particular regular expression


**waitFor(milliseconds)**
- `milliseconds` \<number> The number of milliseconds to wait for

Wait for a given number of milliseconds


## Retrieval

**getValue(selector)**
- `selector` \<string> The selector for the element to get the value for
- **returns** \<string> The value property value for the element

Get the value property value for a particular element


**getText(selector)**
- `selector` \<string> The selector for the element to get the text for
- **returns** \<string> The text property value for the element

Get the text property value for a particular element


**getPropertyValue(selector, property)**
- `selector` \<string> The selector for the element to get the property value for
- `property` \<string> The property to look for
- **returns** \<string> The property value for the element

Get the value of a particular property for a particular element


**isElementFocused(selector)**
- `selector` \<string> The selector of the element to check for focus state
- **returns** \<boolean> Whether the element is focused or not

Check if element is focused

## Miscellaneous

**turnOffAnimations()**

Turn off CSS animations on the page to help avoid flaky visual comparisons


**fastForwardTime(milliseconds)**
- `milliseconds` \<number> The number of milliseconds to fast forward

Fast forward the current time by a given number of milliseconds


**evaluate(fn, ...args)**
- `fn` \<function> The function to execute on the page
- `args` \<...args> Arguments to be passed into the function

Runs a function on the page