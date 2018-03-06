const {promisify} = require('util');
const extract = promisify(require('extract-zip'));
const path = require('path');
const colors = require('colors');
const file = 'todomvc-react.zip';
const source = path.join(__dirname, file);
const CONSOLE_PREFIX = 'Puppeteer Extensions: ';

(async() => {
    console.log(`${CONSOLE_PREFIX} Running post-setup script...`.green);
    const extractErrors = await extract(source, { dir: __dirname });
    
    if (!extractErrors) {
        console.log(`${CONSOLE_PREFIX} Post-setup script complete`.green);
    } else {
        throw Error(`${CONSOLE_PREFIX} Unable to extract ${file}`.red);
    }
})();