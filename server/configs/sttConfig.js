/**
 * Created by danielabrao on 3/20/17.
 */
/**
 * Created by danielabrao on 3/20/17.
 */
(function () {
    "use strict";

    module.exports = {
        "username": process.env.STT_USER || JSON.parse(process.env.VCAP_SERVICES)["speech_to_text"][0].credentials.username,
        "password": process.env.STT_PASS || JSON.parse(process.env.VCAP_SERVICES)["speech_to_text"][0].credentials.password
    };

}());