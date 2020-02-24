var gulp = require('gulp');
var rename = require('gulp-rename');
var umd = require('gulp-umd');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var babelify = require('babelify');

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
  return build('./export.js')
    .pipe(buffer())
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', function () {
  return build('./export.js')
    .pipe(gulp.dest('./dist/'));
});

gulp.task('umd', ['build'], function () {
  return gulp.src('./dist/instascan.js')
    .pipe(umd())
    .pipe(gulp.dest('./dist/'));
});
