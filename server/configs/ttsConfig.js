/**
 * Created by danielabrao on 3/20/17.
 */
(function () {
    "use strict";

    module.exports = {
        "username": process.env.TTS_USER || JSON.parse(process.env.VCAP_SERVICES)["text_to_speech"][0].credentials.username,
        "password": process.env.TTS_PASS || JSON.parse(process.env.VCAP_SERVICES)["text_to_speech"][0].credentials.password
    };

}());