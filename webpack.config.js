const path = require('path');

module.exports = {
  node: {
    fs: 'empty'
  },
  entry: {
    "instascan": "./index.js",
    "instascan.min": "./index.js"
  },
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  plugins: [],
  module: {
    rules: [{
      test: /\.js$/,
      exclude: path.join(__dirname, 'src', 'zxing.js'),
      include: path.join(__dirname, 'src'),
      use: {
        loader: 'babel-loader'
      }
    }]
  }
};
