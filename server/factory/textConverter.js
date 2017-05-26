/**
 * Created by danielabrao on 3/20/17.
 */
(function () {
    "use strict";

    var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1'),
        ttsCredentials = require("../configs/ttsConfig"),
        fs = require("fs"),
        text_to_speech = new TextToSpeechV1(ttsCredentials);

    module.exports = function () {
        return {
            "convertTextToAudio": function (options) {
            }
        };
    };
}());