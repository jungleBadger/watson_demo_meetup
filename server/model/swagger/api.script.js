/**
 * Created by danielabrao on 2/2/17.
 */
(function () {
    "use strict";

    var baseAPI = require("./api.configs.json");
    baseAPI.paths = require("./api.models.json");
    baseAPI.definitions = require("./api.schemas.json");

    module.exports = baseAPI;

}());