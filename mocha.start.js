/*global assert:true */
'use strict'

// prepare environment for js-data-adapter-tests
import 'babel-polyfill'

import * as JSData from 'js-data'
import JSDataAdapterTests from './node_modules/js-data-adapter/dist/js-data-adapter-tests'
import * as JSDataMongoDB from './src/index'

const assert = global.assert = JSDataAdapterTests.assert
global.sinon = JSDataAdapterTests.sinon

JSDataAdapterTests.init({
  debug: false,
  JSData: JSData,
  Adapter: JSDataMongoDB.MongoDBAdapter,
  adapterConfig: {
    uri: 'mongodb://localhost:27017',
    translateObjectIDs: true
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
require('./test/update.test')

describe('exports', function () {
  it('should have exports', function () {
    assert(JSDataMongoDB.version, 'Should have version')
  })
})
