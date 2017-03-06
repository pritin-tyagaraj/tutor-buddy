'use strict';

// Hierarchical node.js configuration with command-line arguments, environment
// variables, and files.
const nconf = module.exports = require('nconf');
const path = require('path');

nconf
    // 1. Command-line arguments
    .argv()
    // 2. Environment variables
    .env([
        'DATA_BACKEND',
        'GCLOUD_PROJECT',
        'MONGO_URL',
        'MONGO_COLLECTION',
        'MYSQL_USER',
        'MYSQL_PASSWORD',
        'PORT'
    ])
    // 3. Config file
    .file({
        file: path.join(__dirname, 'config.json')
    })
    // 4. Defaults
    .defaults({
        DATA_BACKEND: 'cloudsql',
        GCLOUD_PROJECT: '<project name>',

        // MYSQL Details
        MYSQL_USER: '<user>',
        MYSQL_PASSWORD: '<pass>',
        INSTANCE_CONNECTION_NAME: '<instance name>',

        // Port for the HTTP server
        PORT: 8080
    });

// Check for required settings
checkConfig('GCLOUD_PROJECT');

if (nconf.get('DATA_BACKEND') === 'cloudsql') {
    checkConfig('MYSQL_USER');
    checkConfig('MYSQL_PASSWORD');
    if (nconf.get('NODE_ENV') === 'production') {
        checkConfig('INSTANCE_CONNECTION_NAME');
    }
} else if (nconf.get('DATA_BACKEND') === 'mongodb') {
    checkConfig('MONGO_URL');
    checkConfig('MONGO_COLLECTION');
}

function checkConfig(setting) {
    if (!nconf.get(setting)) {
        throw new Error(`You must set ${setting} as an environment variable or in config.json!`);
    }
}