const gulp = require( "gulp" );
const uglify = require( "gulp-uglify-es" ).default;
const ts = require( "gulp-typescript" );
const tsify = require( "tsify" );
const browserify = require( "browserify" );
const rename = require( "gulp-rename" );
const source = require( "vinyl-source-stream" );
const buffer = require( "vinyl-buffer" );
const { merge } = require( "event-stream" );

function bundle( file, release ) {
    const options = { project: "tsconfig.json" };

    if ( release )
        options.target = "es5";

    return browserify( file )
        .plugin( tsify, options )
        .bundle()
        .pipe( source( "instascan.js" ) );
}

function build( opts ) {
    const project = ts.createProject( "tsconfig.json", opts );

    return gulp.src( [ "./src/**.ts", "!./src/instascan.ts" ] )
        .pipe( project() );
}

gulp.task( "default", [ "build" ] );

gulp.task( "watch", ["build"], function () {
    gulp.watch( "./src/*.ts", [ "build" ] );
} );

gulp.task( "release", function () {
    const options = {
        target: "es5",
        sourceRoot: "./src",
        declaration: true,
        declarationDir: "./dist"
    };
    const { js, dts } = build( options );
    const jsStream = js
        .pipe( uglify() )
        .pipe( gulp.dest( "./dist" ) );
    const dtsStream = dts
        .pipe( gulp.dest( "./dist" ) );
    const bundleStream = bundle( "./src/instascan.ts" )
        .pipe( buffer() )
        .pipe( uglify() )
        .pipe( rename( { suffix: ".min" } ) )
        .on( "error", function ( err ) { console.log( err.toString() ); } )
        .pipe( gulp.dest( "./dist" ) );

    return merge( [ jsStream, dtsStream, bundleStream ] );
} );

gulp.task( "build", function () {
    const { js, dts } = build();
    const jsStream = js.pipe( gulp.dest( "./dist" ) );
    const dtsStream = dts.pipe( gulp.dest( "./dist" ) );
    const bundleStream = bundle( "./src/instascan.ts" ).pipe( gulp.dest( "./dist" ) );

    return merge( [ jsStream, dtsStream, bundleStream ] );
} );
