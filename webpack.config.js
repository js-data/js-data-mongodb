var path = require('path')

module.exports = {
  devtool: 'source-map',
  entry: './src/index.js',
  output: {
    filename: './dist/js-data-mongodb.js',
    libraryTarget: 'commonjs2'
  },
  externals: [
    'mout/string/underscore',
    'mout/array/unique',
    'mout/array/map',
    'js-data',
    'mongodb',
    'bson'
  ],
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, 'src')
        ],
        test: /\.js$/
      }
    ]
  }
}
