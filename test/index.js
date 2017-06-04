// Set the process to 'test' mode
'use strict';
process.env.mode = 'TEST';

// Turn of winston reporting. Makes the test result list ugly.
const winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    level: 'none',
    prettyPrint: true,
    colorize: true,
    silent: false,
    timestamp: false
});

// Run the tests
require('./api/auth/facebook');
require('./api/auth/whitelist');
require('./api/auth/session');