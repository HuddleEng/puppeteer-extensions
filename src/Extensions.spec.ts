import * as puppeteer from 'puppeteer';
import Extensions from './Extensions';

jest.setTimeout(10000);

describe('Extensions', () => {
    describe('waitForResource', () => {
        let browser;

        beforeAll(async () => {
            browser = await puppeteer.launch();
        });

        it('should respond with true if resource response is found', async () => {
            const page = await browser.newPage();

            const extensions = new Extensions(page, 10000);
            const response = extensions.waitForResource('main');

            await page.goto('https://www.gideonpyzer.com');

            await response;
            expect(response).toBeTruthy();
        });

        it('should timeout when waiting for resource that will not be requested for', async () => {
            const page = await browser.newPage();

            const extensions = new Extensions(page, 10000);
            const response = extensions.waitForResource('bla', 500);

            await page.goto('https://www.gideonpyzer.com');

            try {
                await response;
            } catch (e) {
                expect(e.message).toBe(
                    'Timeout exceeded while waiting for event'
                );
            }
        });

        afterAll(async () => {
            browser.close();
        });
    });
});
