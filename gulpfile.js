const gulp = require( "gulp" );
const rename = require( "gulp-rename" );
const uglify = require( "gulp-uglify" );
const ts = require( "gulp-typescript" );
const { merge } = require( "event-stream" );

gulp.task( "default", [ "build" ] );

gulp.task( "watch", function () {
    gulp.watch( "./src/*.ts", [ "build" ] );
} );

function build( opts ) {
    const project = ts.createProject( "tsconfig.json", opts );

    return project.src().pipe( project() );
}

gulp.task( "release", function () {
    const { js, dts } = build( { target: "es5" } );
    const jsStream = js
        .pipe( uglify() )
        .pipe( gulp.dest( "./dist/" ) );
    const dtsStream = dts
        .pipe( gulp.dest( "./dist" ) );

    return merge( [ jsStream, dtsStream ] );
} );

gulp.task( "build", function () {
    const { js, dts } = build();
    const jsStream = js.pipe( gulp.dest( "./dist/" ) );
    const dtsStream = dts.pipe( gulp.dest( "./dist" ) );

    return merge( [ jsStream, dtsStream ] );
} );
