import { Request, Response } from 'puppeteer';

/**
 * @hidden
 */
const isSuccessfulResponse = (request: Request): boolean => {
    const response: Response | null = request.response();

    if (response) {
        return response.status() === 200 || response.status() === 304;
    }

    return false;
};

/**
 * @hidden
 */
const pollFor = ({
    checkFn,
    interval,
    timeout,
    timeoutMsg
}: {
    checkFn: () => Promise<boolean>;
    interval: number;
    timeout: number;
    timeoutMsg: string;
}): Promise<string> => {
    return new Promise((resolve, reject) => {
        const startTime = new Date().getTime();
        const timer = setInterval(async () => {
            if (new Date().getTime() - startTime < timeout) {
                if (await checkFn()) {
                    clearInterval(timer);
                    resolve('Finished polling');
                }
            } else {
                clearInterval(timer);
                reject(timeoutMsg);
            }
        }, interval);
    });
};

export { isSuccessfulResponse, pollFor };
