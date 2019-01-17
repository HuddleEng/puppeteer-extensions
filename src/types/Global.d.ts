import { Page } from 'puppeteer';
import Extensions from '../Extensions';
// tslint:disable interface-name

declare global {
    namespace NodeJS {
        interface Global {
            extensions: Extensions;
            page: Page;
        }
    }
}
