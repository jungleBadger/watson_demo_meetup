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
                return new Promise(function (resolve, reject) {
                    var params = {
                        "audio": fs.createReadStream(filePath),
                        "content_type": "audio/wav",
                        "model": "pt-BR_BroadbandModel"
                    };

                    speech_to_text.recognize(params, function (error, transcript) {
                        if (error) {
                            reject(error);
                        } else {
                            console.log(transcript);
                            resolve(transcript);
                        }
                    });

                });
            }        };
    };
}());