/**
 * Created by danielabrao on 2/10/17.
 */
(function () {
    "use strict";


    module.exports = function (app, upload, watsonTextToSpeech, watsonSpeechToText, watsonConversation, FileHandler, fs) {

        app.post("/convertAudioToText", upload.single("audio"), function (req, res) {
            return res.status(200).send("not implemented yet");
        });

        app.post("/convertTextToAudio", function (req, res) {
            return res.status(200).send("not implemented yet");
        });

        app.post("/askWatson", function (req, res) {
            return res.status(200).send("not implemented yet");
        });

        app.get("/downloadAudio", function (req, res) {
            return res.status(200).send("not implemented yet");
        });

    };

}());