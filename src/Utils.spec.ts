import { Response } from 'puppeteer';
import { isSuccessfulResponse, pollFor } from './Utils';

describe('Utils', () => {
    describe('isSuccessfulResponse', () => {
        const mockRequestWithStatus = (status: number) => {
            return jest.fn<Response>(() => ({
                status: () => status
            }));
        };

        it('correctly determines successful response', () => {
            let MockResponse = mockRequestWithStatus(200);
            expect(isSuccessfulResponse(new MockResponse())).toBe(true);
            MockResponse = mockRequestWithStatus(304);
            expect(isSuccessfulResponse(new MockResponse())).toBe(true);
        });
        it('correctly determines unsuccessful response', () => {
            const MockResponse = mockRequestWithStatus(500);
            expect(isSuccessfulResponse(new MockResponse())).toBe(false);
        });
    });

    describe('pollFor', () => {
        it('should execute checkFn once and return sucessfully', async () => {
            const config = {
                checkFn: (): Promise<boolean> => Promise.resolve(true),
                interval: 0,
                timeout: 500,
                timeoutMsg: 'Timed out'
            };

            const checkFnSpy = jest.spyOn(config, 'checkFn');
            const result = await pollFor(config);

            expect(checkFnSpy).toHaveBeenCalledTimes(1);
            expect(result).not.toBe('Time out');
        });

        it('should execute checkFn twice and return sucessfully', async () => {
            let times = 1;
            const config = {
                checkFn: (): Promise<boolean> => {
                    return new Promise(resolve => {
                        const timer = setTimeout(() => {
                            if (times === 2) {
                                clearInterval(timer);
                                resolve(true);
                            } else {
                                times++;
                            }
                        }, 0);
                    });
                },
                interval: 5,
                timeout: 500,
                timeoutMsg: 'Timed out'
            };

            const checkFnSpy = jest.spyOn(config, 'checkFn');
            const result = await pollFor(config);

            expect(checkFnSpy).toHaveBeenCalledTimes(2);
            expect(result).not.toBe('Time out');
        });

        it('should show timeout message when checkFn exceeds timeout', async () => {
            try {
                const result = await pollFor({
                    checkFn: (): Promise<boolean> => {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                resolve(true);
                            }, 20);
                        });
                    },
                    interval: 5,
                    timeout: 10,
                    timeoutMsg: 'Timed out'
                });
            } catch (e) {
                expect(e).toBe('Timed out');
            }
        });
    });
});
