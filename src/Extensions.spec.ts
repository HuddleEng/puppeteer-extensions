import Extensions from './Extensions';
import page from './mocks/page';

describe('Extensions', () => {
    describe('waitForResource', () => {
        it('should respond with Response object if resource response is found', async () => {
            const extensions = new Extensions(page, 10000);
            const response = await extensions.waitForResource('main');
            expect(response).toBeTruthy();
        });

        it('should timeout when waiting for resource that will not be requested for', async () => {
            const extensions = new Extensions(page, 10000);

            try {
                await extensions.waitForResource('bla', 500);
            } catch (msg) {
                expect(msg).toBe('Timeout exceeded while waiting for event');
            }
        });
    });
    describe('waitForLoadedWebFontCountToBe', () => {
        if ('should return true when all web fonts are loaded', async() => {

        })
    });
});
