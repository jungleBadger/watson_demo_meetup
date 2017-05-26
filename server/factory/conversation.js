/**
 * Created by danielabrao on 3/21/17.
 */
(function () {
    "use strict";

    var watsonConversation = require("watson-developer-cloud/conversation/v1"),
        conversationInstance = new watsonConversation(require("../configs/wcsConfig"));

    module.exports = function (conversationCredentials) {
        return {
            "sendMessage": function (options) {
            }
        };
    };

}());