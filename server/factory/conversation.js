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
            }
        };
    };

}());