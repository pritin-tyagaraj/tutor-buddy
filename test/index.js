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

// Authentication
require('./api/auth/facebook');
require('./api/auth/config');
require('./api/auth/whitelist');
require('./api/auth/session');

// Middleware
require('./api/middleware/validateRequest');

// Model
require('./api/v1/model/user');
require('./api/v1/model/util');

// API
require('./api/v1/batch');
require('./api/v1/payment');
require('./api/v1/scribble');
require('./api/v1/student');
require('./api/v1/user');