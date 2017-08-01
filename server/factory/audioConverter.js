/**
 * Created by danielabrao on 3/20/17.
 */
(function () {
    "use strict";

    var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1'),
        fs = require("fs"),
        sttCredentials = require("../configs/sttConfig"),
        speech_to_text = new SpeechToTextV1(sttCredentials);

    module.exports = function () {
        return {
            "convertAudioToText": function (filePath) {
            }
        };
    };
}());