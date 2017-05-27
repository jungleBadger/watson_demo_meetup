/**
 * Created by danielabrao on 3/21/17.
 */
(function (process) {
    "use strict";

    module.exports = {
        "username": process.env.CONV_USER || "test",
        "password": process.env.CONV_PASS || "test",
        "version": "v1",
        "version_date": "2017-04-21",
        "workspace_id": process.env.CONV_WORKSPACE || "test"
    };

}(process));