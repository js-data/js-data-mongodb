/*global assert:true */
'use strict'

// prepare environment for js-data-adapter-tests
require('babel-polyfill')

var JSData = require('js-data')
var JSDataAdapterTests = require('js-data-adapter-tests')
var MongoDBAdapter = require('./')

global.assert = JSDataAdapterTests.assert
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
    'updateMany'
  ],
  features: [
    'findHasManyLocalKeys',
    'findHasManyForeignKeys'
  ]
})

require('./test/find.test')
