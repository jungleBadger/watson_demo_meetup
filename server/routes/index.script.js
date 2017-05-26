/**
 * Created by danielabrao on 1/31/17.
 */
(function () {
    "use strict";

    var watsonRoutes = require("./partials/watsonHandler"),
        docRoutes = require("./partials/docHandler");

    module.exports = function (app, upload, text_to_speech, speech_to_text, conversation, FileHandler, fs, apiDocs) {
        watsonRoutes(app, upload, text_to_speech, speech_to_text, conversation, FileHandler, fs);
        docRoutes(app, apiDocs);
        app.get("/", function (req, res) {
            return res.status(200).render("./demo_module/index.html", {
                user: req.user || ""
            });
        });
    };

}());