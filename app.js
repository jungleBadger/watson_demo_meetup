/**
 * Created by danielabrao on 1/31/17.
 */
(function () {
    "use strict";

    require("dotenv").config({"silent": true});
    var express = require("express"),
        app = express(),
        path = require("path"),
        cfenv = require("cfenv"),
        appEnv = cfenv.getAppEnv(),
        fs = require("fs"),
        engines = require('consolidate'),
        ejs = require("ejs"),
        request = require("request"),
        bodyParser = require("body-parser"),
        compress = require("compression"),
        server = require("http").createServer(app),
        FileHandler = require("./server/factory/fileHandler")(),
        apiDocs = require("./server/model/swagger/api.script"),
        sttFactory = require("./server/factory/audioConverter")(),
        ttsFactory = require("./server/factory/textConverter")(),
        wcsFactory = require("./server/factory/conversation")(),
        multer = require("multer"),
        upload = multer({
            fileFilter: function (req, file, cb) {
                console.log(file);
                try {
                    var splittedName = file.originalname.split(".");
                    file.dataType = splittedName[splittedName.length - 1];
                } catch(e) {
                    console.log(e);
                }

                return cb(null, true);
            }
        }),
        morgan = require("morgan");

    app.use(express.static(path.join(__dirname, "./client/")));
    app.use(compress());
    app.use(morgan("dev"));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json({limit: "50mb"}));
    app.engine("html", engines.ejs);
    app.set("views", __dirname + "/client/");
    app.set("view engine", "html");
    app.all("/*", function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-type, Accept, X-Access-Token, X-Key");

        if (req.method === "OPTIONS") {
            res.status(200).end();
        } else {
            next();
        }
    });
    require("./server/routes/index.script")(app, upload, ttsFactory, sttFactory, wcsFactory, FileHandler, fs, apiDocs);
    server.listen(appEnv.port, appEnv.bind, function () {
        console.log(appEnv.url);
    });

}());