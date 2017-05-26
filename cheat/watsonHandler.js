/**
 * Created by danielabrao on 2/10/17.
 */
(function () {
    "use strict";


    module.exports = function (app, upload, watsonTextToSpeech, watsonSpeechToText, watsonConversation, FileHandler, fs) {

        app.post("/convertAudioToText", upload.single("audio"), function (req, res) {
            FileHandler.saveFile("test", req.file).then(function (filePath) {
                watsonSpeechToText.convertAudioToText(filePath).then(function (data) {
                    FileHandler.deleteFile(filePath).then(function () {
                        var msg;
                        try {
                            msg = data.results[0].alternatives[0].transcript;
                        } catch (e) {
                            msg = "Invalid";
                        }
                        watsonConversation.sendMessage({
                            "input": {
                                "text": msg
                            },
                            "context": {},
                            "workspace_id": ""
                        }).then(function (conversationData) {
                            watsonTextToSpeech.convertTextToAudio({
                                "fileName": "converted",
                                "textMessage": conversationData.output.text[0]
                            }).then(function (ttsData) {
                                return res.status(200).send({
                                    "tts": ttsData,
                                    "stt": data.results,
                                    "conversation": conversationData
                                });
                            }, function (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            });

                        }, function (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        });
                    }, function (err) {
                        return res.status(500).send(err);
                    });
                }, function (err) {
                    console.log(err);
                    return res.status(500).send(err);
                });
            }, function (err) {
                return res.status(500).send(err);
            });
        });

        app.post("/convertTextToAudio", function (req, res) {
            watsonTextToSpeech.convertTextToAudio({
                "fileName": "converted",
                "textMessage": req.body.textMessage
            }).then(function (data) {
                return res.status(200).send(data);
            }, function (err) {
                console.log(err);
                return res.status(500).send(err);
            });
        });

        app.post("/askWatson", function (req, res) {
            var context;
            if (!req.query.question && !req.body.question) {
                return res.status(403).send("Can not proceed without question property");
            }

            if (req.body.context) {
                try {
                    context = JSON.parse(req.body.context);
                } catch (e) {
                    context = req.body.context;
                }
            } else {
                context = {};
            }

            watsonConversation.sendMessage({
                "input": {
                    "text": req.body.question
                },
                "context": context
            }).then(function (data) {
                return res.status(200).send(data);
            }, function (err) {
                console.log(err);
                return res.status(500).send(err);
            });
        });

        app.get("/downloadAudio", function (req, res) {
            if (!req.query.filePath || !req.query.fileName) {
                return res.status(500).send("Can not proceed without file name and path");
            }
            //
            setTimeout(function () {
                try {
                    fs.unlinkSync(req.query.filePath);
                } catch (e) {
                    console.log(e);
                }
            }, 3000);
            res.setHeader("content-Type", "audio/wav");
            res.setHeader("Content-Disposition", ["attachment;filename=/", req.query.fileName + ".wav"].join(""));
            return res.download(req.query.filePath);
        });

    };

}());