var path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  node: {
    fs: 'empty'
  },
  entry: {
    "instascan": "./index.js",
    "instascan.min": "./index.js",
  },
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  plugins: [
    new UglifyJsPlugin({
      include: /\.min.*/,
      sourceMap: true
    })
  ]
};
