/*global assert:true */
'use strict'

// prepare environment for js-data-adapter-tests
require('babel-polyfill')
global.assert = require('chai').assert

var JSData = require('js-data')
var TestRunner = require('js-data-adapter-tests')
var MongoDBAdapter = require('./')

TestRunner.init({
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
  methods: [
    'create',
    'createMany',
    'destroy',
    'destroyAll',
    'find',
    'findAll',
    'update',
    'updateAll'
  ],
  features: [
    'findHasManyLocalKeys',
    'findHasManyForeignKeys'
  ]
})

require('./test/find.test')
