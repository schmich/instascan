const gulp = require('gulp');
const gutil = require("gulp-util");
const webpack = require('webpack');
const config = require('./webpack.config.js');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const uglify = new UglifyJsPlugin({
  include: /\.min.*/,
  sourceMap: true
});

gulp.task('default', ['dev', 'watch']);

gulp.task('watch', function() {
  gulp.watch('./src/*.js', ['dev']);
});

gulp.task('production', function() {
  config.plugins.push(uglify)
  return webpack(config, function(err, stats) {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      // output options
    }));
  });
});

gulp.task('dev', function() {
  return webpack(config, function(err, stats) {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      // output options
    }));
  });
});
