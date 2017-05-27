/**
 * Created by danielabrao on 3/21/17.
 */
(function () {
    "use strict";

    var watsonConversation = require("watson-developer-cloud/conversation/v1"),
        credentials = require("../configs/wcsConfig"),
        conversationInstance = new watsonConversation(credentials);

    module.exports = function (conversationCredentials) {
        return {
            "sendMessage": function (options) {
                console.log(options);
                return new Promise(function (resolve, reject) {
                    if (!options) {
                        return reject("Can not proceed without options object");
                    }
                    options.workspace_id = credentials.workspace_id;
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