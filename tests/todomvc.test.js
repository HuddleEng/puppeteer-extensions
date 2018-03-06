const input = 'header input';
const listItem = '.todo-list li';
const firstItem = listItem + ':nth-of-type(1)';
const firstItemInput = firstItem + ' > input';
const firstItemToggle = firstItem + ' .toggle';
const firstItemRemoveButton = firstItem + ' button';
const secondItem = listItem + ':nth-of-type(2)';
const secondItemInput = secondItem + ' > input';
const todoCount = '.todo-count';

const puppeteer = require('puppeteer');
const server = require('./server');

let serverInstance;
let browser;
let extensions;
let page;

// Notice how you have to add all this boilerplate to every test file. This is what Muppeteer solves.
beforeAll(async () => {
    serverInstance = await server.start(3000);
    browser = await puppeteer.launch();
    page = await browser.newPage();
    extensions = require('../lib/index')(page);
    await page.goto('http://localhost:3000');
});

afterAll(async () => {
    await browser.close();
    server.stop(serverInstance);
});

// Note this test is not super realistic but just a way to test all API functions
describe('Add a todo item', () => {
    it('input field is focused', async() => {
        const inputEl = await page.$(input);
        await inputEl.focus();
        expect(await extensions.isElementFocused(input)).toBe(true);
    });
    it('typing text and hitting enter key adds new item', async () => {
        await page.waitForSelector(input);
        await page.type(input, 'My first item');
        await page.keyboard.press('Enter');
        await page.waitForSelector(firstItem);
        expect(await extensions.getText(firstItem)).toBe('My first item');
        expect(await extensions.getValue(firstItemInput)).toBe('My first item');
    });
    it('clicking checkbox marks item as complete', async () => {
        await page.waitForSelector(firstItemToggle);
        await page.click(firstItemToggle);
        await extensions.waitForNthSelectorAttributeValue(listItem, 1, 'class', 'completed');
        expect(await extensions.getPropertyValue(firstItem, 'className')).toBe('completed');
    });
    it('typing more text and hitting enter adds a second item', async () => {
        await page.type(input, 'My second item');
        await page.keyboard.press('Enter');
        await page.waitForSelector(secondItem);
        expect(await extensions.getText(secondItem)).toBe('My second item');
        expect(await extensions.getValue(secondItemInput)).toBe('My second item');
    });
    it('hovering over first item shows x button', async () => {
        await page.hover(firstItem);
    });
    it('clicking on first item x button removes it from the list', async () => {
        await page.click(firstItemRemoveButton);
        await extensions.waitForElementCount(listItem, 1);
        expect(await extensions.getText(todoCount)).toBe('1 item left');
    });
});


