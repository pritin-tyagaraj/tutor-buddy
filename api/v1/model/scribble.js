const util = require('./util');
const winston = require('winston');

module.exports = {
    updateScribbleForBatch: function (batchId, scribbleContent, cb) {
        util.executeQuery('UPDATE ' + util.Table.SCRIBBLES + ' SET `content` = ? WHERE `batch_id` = ?', [scribbleContent, batchId], cb, () => {
            cb();
        });
    },

    getScribbleForBatch: function (batchId, cb) {
        util.executeQuery('SELECT `content` FROM ' + util.Table.SCRIBBLES + ' WHERE `batch_id` = ?', [batchId], cb, (result) => {
            var content = result[0].content;
            if(!content) {
                content = "";
            }

            cb(null, content);
        });
    }
};