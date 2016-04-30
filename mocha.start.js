/*global assert:true */
'use strict'

// prepare environment for js-data-adapter-tests
require('babel-polyfill')

var JSData = require('js-data')
var JSDataAdapterTests = require('js-data-adapter-tests')
var JSDataMongoDB = require('./')
var version = JSDataMongoDB.version
var MongoDBAdapter = JSDataMongoDB.MongoDBAdapter

var assert = global.assert = JSDataAdapterTests.assert
global.sinon = JSDataAdapterTests.sinon

JSDataAdapterTests.init({
  debug: false,
  JSData: JSData,
  Adapter: MongoDBAdapter,
  adapterConfig: {
    uri: 'mongodb://localhost:27017'
  },
  containerConfig: {
    mapperDefaults: {
      idAttribute: '_id'
    }
  },
  storeConfig: {
    mapperDefaults: {
      idAttribute: '_id'
    }
  },
  xmethods: [
    // sum not supported yet, I don't quite understand collection#aggregate...
    'sum',
    'updateMany'
  ],
  features: [
    'findHasManyLocalKeys',
    'findHasManyForeignKeys'
  ]
})

require('./test/find.test')

describe('exports', function () {
  assert(version)
  assert(version.full)
})
