/*jslint node: true, nomen:true*/
(function () {
    "use strict";

    var gulp = require("gulp"),
        argv = require('yargs').argv,
        browserify = require("gulp-browserify"),
        imageResize = require("gulp-image-resize"),
        gutil = require("gulp-util"),
        watch = require("gulp-watch"),
        filter = require("gulp-filter"),
        uglify = require("gulp-uglify"),
        imagemin = require("gulp-imagemin"),
        rename = require("gulp-rename"),
        cssnano = require("cssnano"),
        cache = require("gulp-cache"),
        postcss = require("gulp-postcss"),
        autoprefixer = require("autoprefixer"),
        changed = require("gulp-changed"),
        supportedBrowsers = [">0.1%"],
        processors = [
            autoprefixer({
                "remove": false,
                "browsers": supportedBrowsers
            }),
            cssnano()
        ];


    gulp.task("build", ["js-admin", "css-admin"]);

    gulp.task("js", function () {
        var production = gutil.env.type === "production";

        return gulp.src(argv.script || "./js/main.script.js", {read: false})

        // Browserify, and add source maps if this isn"t a production build
            .pipe(browserify({
                debug: !production
            }))

            // Rename the destination file
            .pipe(rename("bundle.js"))
            .pipe(gulp.dest("./dist/js/"))
            .pipe(uglify())
            .pipe(rename({suffix: ".min"}))

            // Output to the build directory
            .pipe(gulp.dest("./dist/js/"));
    });


    gulp.task("css", function () {
        return gulp.src(["./css/*.css"])
            .pipe(postcss(processors)).pipe(rename({suffix: ".min"}))
            .pipe(gulp.dest("./dist/css/"));
    });

    gulp.task('watch', function() {
        gulp.watch("js/*.js", ['js']);
    });

    gulp.task("images", function () {
        return gulp.src("assets/images_raw/*.+(png|jpg|jpeg|gif|svg)").pipe(imageResize({
            width: argv.width || 1920,
            height: argv.height || argv.width || 1080,
            crop: argv.crop || false,
            upscale: true
        })).pipe(cache(imagemin())).pipe(gulp.dest("assets/images"));
    });

    gulp.task("imagemin", function () {
        return gulp.src(argv.path + "*.+(png|jpg|jpeg|gif|svg)").pipe(cache(imagemin())).pipe(gulp.dest(argv.path));
    });

}());