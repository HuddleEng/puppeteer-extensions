const initExtensions = require('./lib/index');
global.extensions = initExtensions(global.page);
