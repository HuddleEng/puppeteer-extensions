const input = 'header input';
const listItem = '.todo-list li';
const firstItem = listItem + ':nth-of-type(1)';
const firstItemInput = firstItem + ' > input';
const firstItemToggle = firstItem + ' .toggle';
const firstItemRemoveButton = firstItem + ' button';
const secondItem = listItem + ':nth-of-type(2)';
const secondItemInput = secondItem + ' > input';
const todoCount = '.todo-count';

let extensions;

beforeAll(async () => {
    extensions = require('../lib/index')(page);
    await page.goto('http://localhost:3000');
});

// Note this test is not super realistic but just a way to test all API functions
describe('Add a todo item', () => {
    it('should focus the input field', async () => {
        const inputEl = await page.$(input);
        await inputEl.focus();
        expect(await extensions.isElementFocused(input)).toBe(true);
    });
    it('should add new item after typing text and hitting enter', async () => {
        await page.waitForSelector(input);
        await page.type(input, 'My first item');
        await page.keyboard.press('Enter');
        await page.waitForSelector(firstItem);
        expect(await extensions.getText(firstItem)).toBe('My first item');
        expect(await extensions.getValue(firstItemInput)).toBe('My first item');
    });
    it('should mark item as complete after clicking checkbox', async () => {
        await page.waitForSelector(firstItemToggle);
        await page.click(firstItemToggle);
        await extensions.waitForNthSelectorAttributeValue(
            listItem,
            1,
            'class',
            'completed'
        );
        expect(await extensions.getPropertyValue(firstItem, 'className')).toBe(
            'completed'
        );
    });
    it('should add a second item after typing text and hitting enter', async () => {
        await page.type(input, 'My second item');
        await page.keyboard.press('Enter');
        await page.waitForSelector(secondItem);
        expect(await extensions.getText(secondItem)).toBe('My second item');
        expect(await extensions.getValue(secondItemInput)).toBe(
            'My second item'
        );
    });
    it('should show x button after hovering over first item', async () => {
        await page.hover(firstItem);
    });
    it('should remove item from list after clicking the x button', async () => {
        await page.click(firstItemRemoveButton);
        await extensions.waitForElementCount(listItem, 1);
        expect(await extensions.getText(todoCount)).toBe('1 item left');
    });
});
