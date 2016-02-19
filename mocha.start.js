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
  DS: JSData.DS,
  Adapter: MongoDBAdapter,
  adapterConfig: {
    uri: 'mongodb://localhost:27017'
  },
  storeConfig: {
    bypassCache: true,
    linkRelations: false,
    cacheResponse: false,
    idAttribute: '_id',
    log: false,
    debug: false
  },
  features: [],
  methods: [
    'create',
    'destroy',
    'destroyAll',
    'find',
    'findAll',
    'update',
    'updateAll'
  ]
})

require('./test/find.test')
