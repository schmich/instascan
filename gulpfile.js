var gulp = require('gulp');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var babelify = require('babelify');
const gutil = require("gulp-util");
const webpack = require('webpack');
const config = require('./webpack.config.js');

gulp.task('default', ['build', 'watch']);

gulp.task('watch', function () {
  gulp.watch('./src/*.js', ['build']);
  gulp.watch('./*.js', ['build']);
});

function build(file) {
  return browserify(file, {
      noParse: [require.resolve('./src/zxing')]
    })
    .transform(babelify, {
      ignore: /zxing\.js$/i,
      presets: ['es2015'],
      plugins: ['syntax-async-functions', 'transform-regenerator']
    })
    .bundle()
    .pipe(source('instascan.js'));
}

gulp.task('release', function () {
  return webpack(config, function(err, stats) {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      // output options
    }));
  });
});

gulp.task('build', function () {
  return build('./export.js')
    .pipe(gulp.dest('./dist/'));
});
