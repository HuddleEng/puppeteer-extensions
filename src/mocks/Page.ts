import {
    Page,
    Timeoutable,
    Response,
    PageEventObj,
    Request,
    ResourceType
} from 'puppeteer';

export default {
    waitForResponse(
        urlOrPredicate: (res: Response) => boolean,
        options?: Timeoutable
    ): Promise<Response> {
        return new Promise((resolve, reject) => {
            const response = {
                url: () => 'http://something.com/main.js',
                status: () => 200
            } as Response;

            const resourceFound = urlOrPredicate(response);

            if (resourceFound) {
                resolve(response);
            } else {
                reject('Timeout exceeded while waiting for event');
            }
        });
    },
    on<K extends keyof PageEventObj>(
        eventName: K,
        handler: (e: PageEventObj[K], ...args: any[]) => void
    ): Page {
        const request = {
            resourceType(): ResourceType {
                return 'document';
            }
        } as Request;

        handler(request);
        return this;
    }
} as Page;
