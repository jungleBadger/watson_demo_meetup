/**
 * Created by danielabrao on 3/21/17.
 */
(function () {
    "use strict";

    var watsonConversation = require("watson-developer-cloud/conversation/v1"),
        watsonConfigs = require("../configs/wcsConfig"),
        conversationInstance = new watsonConversation(watsonConfigs);

    module.exports = function () {
        return {
            "sendMessage": function (options) {
                return new Promise(function (resolve, reject) {
                    if (!options) {
                        return reject("Can not proceed without options object");
                    }

                    if (!options.workspace_id) {
                        options.workspace_id = watsonConfigs.workspace_id;
                    }

                    conversationInstance.message(options, function (err, response) {
                        if (err) {
                            console.log(err);
                            return reject(err);
                        } else {
                            return resolve(response);
                        }
                    });
                });
            }
        };
    };

}());