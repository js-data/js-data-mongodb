'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var mongodb = require('mongodb');
var bson = require('bson');
var jsData = require('js-data');
var jsDataAdapter = require('js-data-adapter');
var snakeCase = _interopDefault(require('lodash.snakecase'));

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var DEFAULTS = {
  /**
   * Convert ObjectIDs to strings when pulling records out of the database.
   *
   * @name MongoDBAdapter#translateId
   * @type {boolean}
   * @default true
   */
  translateId: true,
  /**
   * Convert fields of record from database that are ObjectIDs to strings
   *
   * @name MongoDBAdapter#translateObjectIDs
   * @type {Boolean}
   * @default false
   */
  translateObjectIDs: false,

  /**
   * MongoDB URI.
   *
   * @name MongoDBAdapter#uri
   * @type {string}
   * @default mongodb://localhost:27017
   */
  uri: 'mongodb://localhost:27017',

  /**
   * MongoDB Driver options
   *
   * @name MongoDBAdapter#mongoDriverOpts
   * @type {object}
   * @default { ignoreUndefined: true }
   */
  mongoDriverOpts: {
    ignoreUndefined: true
  }
};

var COUNT_OPTS_DEFAULTS = {};
var FIND_OPTS_DEFAULTS = {};
var FIND_ONE_OPTS_DEFAULTS = {};
var INSERT_OPTS_DEFAULTS = {};
var INSERT_MANY_OPTS_DEFAULTS = {};
var UPDATE_OPTS_DEFAULTS = {};
var REMOVE_OPTS_DEFAULTS = {};

/**
 * MongoDBAdapter class.
 *
 * @example
 * // Use Container instead of DataStore on the server
 * import { Container } from 'js-data';
 * import MongoDBAdapter from 'js-data-mongodb';
 *
 * // Create a store to hold your Mappers
 * const store = new Container({
 *   mapperDefaults: {
 *     // MongoDB uses "_id" as the primary key
 *     idAttribute: '_id'
 *   }
 * });
 *
 * // Create an instance of MongoDBAdapter with default settings
 * const adapter = new MongoDBAdapter();
 *
 * // Mappers in "store" will use the MongoDB adapter by default
 * store.registerAdapter('mongodb', adapter, { default: true });
 *
 * // Create a Mapper that maps to a "user" collection
 * store.defineMapper('user');
 *
 * @class MongoDBAdapter
 * @extends Adapter
 * @param {object} [opts] Configuration options.
 * @param {boolean} [opts.debug=false] See {@link Adapter#debug}.
 * @param {object} [opts.countOpts] See {@link MongoDBAdapter#countOpts}.
 * @param {object} [opts.findOpts] See {@link MongoDBAdapter#findOpts}.
 * @param {object} [opts.findOneOpts] See {@link MongoDBAdapter#findOneOpts}.
 * @param {object} [opts.insertOpts] See {@link MongoDBAdapter#insertOpts}.
 * @param {object} [opts.insertManyOpts] See {@link MongoDBAdapter#insertManyOpts}.
 * @param {boolean} [opts.raw=false] See {@link Adapter#raw}.
 * @param {object} [opts.removeOpts] See {@link MongoDBAdapter#removeOpts}.
 * @param {boolean} [opts.translateId=true] See {@link MongoDBAdapter#translateId}.
 * @param {boolean} [opts.translateObjectIDs=false] See {@link MongoDBAdapter#translateObjectIDs}.
 * @param {object} [opts.updateOpts] See {@link MongoDBAdapter#updateOpts}.
 * @param {string} [opts.uri="mongodb://localhost:27017"] See {@link MongoDBAdapter#uri}.
 */
function MongoDBAdapter(opts) {
  var _this = this;

  jsData.utils.classCallCheck(this, MongoDBAdapter);
  opts || (opts = {});
  if (jsData.utils.isString(opts)) {
    opts = { uri: opts };
  }
  jsData.utils.fillIn(opts, DEFAULTS);

  // Setup non-enumerable properties
  Object.defineProperties(this, {
    /**
     * A Promise that resolves to a reference to the MongoDB client being used by
     * this adapter.
     *
     * @name MongoDBAdapter#client
     * @type {Promise}
     */
    client: {
      writable: true,
      value: undefined
    },

    _db: {
      writable: true,
      value: undefined
    }
  });

  jsDataAdapter.Adapter.call(this, opts);

  /**
   * Default options to pass to collection#count.
   *
   * @name MongoDBAdapter#countOpts
   * @type {object}
   * @default {}
   */
  this.countOpts || (this.countOpts = {});
  jsData.utils.fillIn(this.countOpts, COUNT_OPTS_DEFAULTS);

  /**
   * Default options to pass to collection#find.
   *
   * @name MongoDBAdapter#findOpts
   * @type {object}
   * @default {}
   */
  this.findOpts || (this.findOpts = {});
  jsData.utils.fillIn(this.findOpts, FIND_OPTS_DEFAULTS);

  /**
   * Default options to pass to collection#findOne.
   *
   * @name MongoDBAdapter#findOneOpts
   * @type {object}
   * @default {}
   */
  this.findOneOpts || (this.findOneOpts = {});
  jsData.utils.fillIn(this.findOneOpts, FIND_ONE_OPTS_DEFAULTS);

  /**
   * Default options to pass to collection#insert.
   *
   * @name MongoDBAdapter#insertOpts
   * @type {object}
   * @default {}
   */
  this.insertOpts || (this.insertOpts = {});
  jsData.utils.fillIn(this.insertOpts, INSERT_OPTS_DEFAULTS);

  /**
   * Default options to pass to collection#insertMany.
   *
   * @name MongoDBAdapter#insertManyOpts
   * @type {object}
   * @default {}
   */
  this.insertManyOpts || (this.insertManyOpts = {});
  jsData.utils.fillIn(this.insertManyOpts, INSERT_MANY_OPTS_DEFAULTS);

  /**
   * Default options to pass to collection#update.
   *
   * @name MongoDBAdapter#updateOpts
   * @type {object}
   * @default {}
   */
  this.updateOpts || (this.updateOpts = {});
  jsData.utils.fillIn(this.updateOpts, UPDATE_OPTS_DEFAULTS);

  /**
   * Default options to pass to collection#destroy.
   *
   * @name MongoDBAdapter#removeOpts
   * @type {object}
   * @default {}
   */
  this.removeOpts || (this.removeOpts = {});
  jsData.utils.fillIn(this.removeOpts, REMOVE_OPTS_DEFAULTS);

  this.client = new jsData.utils.Promise(function (resolve, reject) {
    mongodb.MongoClient.connect(opts.uri, opts.mongoDriverOpts, function (err, db) {
      if (err) {
        return reject(err);
      }
      _this._db = db;
      resolve(db);
    });
  });
}

jsDataAdapter.Adapter.extend({
  constructor: MongoDBAdapter,

  _translateObjectIDs: function _translateObjectIDs(r, opts) {
    opts || (opts = {});
    if (this.getOpt('translateObjectIDs', opts)) {
      this._translateFieldObjectIDs(r);
    } else if (this.getOpt('translateId', opts)) {
      this._translateId(r);
    }
    return r;
  },


  /**
   * Translate ObjectIDs to strings.
   *
   * @method MongoDBAdapter#_translateId
   * @return {*}
   */
  _translateId: function _translateId(r) {
    if (jsData.utils.isArray(r)) {
      r.forEach(function (_r) {
        var __id = _r._id ? _r._id.toString() : _r._id;
        _r._id = typeof __id === 'string' ? __id : _r._id;
      });
    } else if (jsData.utils.isObject(r)) {
      var __id = r._id ? r._id.toString() : r._id;
      r._id = typeof __id === 'string' ? __id : r._id;
    }
    return r;
  },
  _translateFieldObjectIDs: function _translateFieldObjectIDs(r) {
    var _checkFields = function _checkFields(r) {
      for (var field in r) {
        if (r[field]._bsontype === 'ObjectID') {
          r[field] = typeof r[field].toString() === 'string' ? r[field].toString() : r[field];
        }
      }
    };
    if (jsData.utils.isArray(r)) {
      r.forEach(function (_r) {
        _checkFields(_r);
      });
    } else if (jsData.utils.isObject(r)) {
      _checkFields(r);
    }
    return r;
  },


  /**
   * Retrieve the number of records that match the selection query.
   *
   * @method MongoDBAdapter#count
   * @param {object} mapper The mapper.
   * @param {object} query Selection query.
   * @param {object} [opts] Configuration options.
   * @param {object} [opts.countOpts] Options to pass to collection#count.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {string[]} [opts.with=[]] Relations to eager load.
   * @return {Promise}
   */

  /**
   * Retrieve the records that match the selection query. Internal method used
   * by Adapter#count.
   *
   * @method MongoDBAdapter#_count
   * @private
   * @param {object} mapper The mapper.
   * @param {object} query Selection query.
   * @param {object} [opts] Configuration options.
   * @return {Promise}
   */
  _count: function _count(mapper, query, opts) {
    var _this2 = this;

    opts || (opts = {});

    return this._run(function (client, success, failure) {
      var collectionId = _this2._getCollectionId(mapper, opts);
      var countOpts = _this2.getOpt('countOpts', opts);
      jsData.utils.fillIn(countOpts, _this2.getQueryOptions(mapper, query));

      var mongoQuery = _this2.getQuery(mapper, query);

      client.collection(collectionId).count(mongoQuery, countOpts, function (err, count) {
        return err ? failure(err) : success([count, {}]);
      });
    });
  },


  /**
   * Create a new record.
   *
   * @method MongoDBAdapter#create
   * @param {object} mapper The mapper.
   * @param {object} props The record to be created.
   * @param {object} [opts] Configuration options.
   * @param {object} [opts.insertOpts] Options to pass to collection#insert.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * @return {Promise}
   */

  /**
   * Create a new record. Internal method used by Adapter#create.
   *
   * @method MongoDBAdapter#_create
   * @private
   * @param {object} mapper The mapper.
   * @param {object} props The record to be created.
   * @param {object} [opts] Configuration options.
   * @return {Promise}
   */
  _create: function _create(mapper, props, opts) {
    var _this3 = this;

    props || (props = {});
    opts || (opts = {});

    return this._run(function (client, success, failure) {
      var collectionId = _this3._getCollectionId(mapper, opts);
      var insertOpts = _this3.getOpt('insertOpts', opts);

      var collection = client.collection(collectionId);
      var handler = function handler(err, cursor) {
        return err ? failure(err) : success(cursor);
      };

      props = jsData.utils.plainCopy(props);

      if (collection.insertOne) {
        collection.insertOne(props, insertOpts, handler);
      } else {
        collection.insert(props, insertOpts, handler);
      }
    }).then(function (cursor) {
      var record = void 0;
      var r = cursor.ops ? cursor.ops : cursor;
      _this3._translateObjectIDs(r, opts);
      record = jsData.utils.isArray(r) ? r[0] : r;
      cursor.connection = undefined;
      return [record, cursor];
    });
  },


  /**
   * Create multiple records in a single batch.
   *
   * @method MongoDBAdapter#createMany
   * @param {object} mapper The mapper.
   * @param {object} props The records to be created.
   * @param {object} [opts] Configuration options.
   * @param {object} [opts.insertManyOpts] Options to pass to
   * collection#insertMany.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */

  /**
   * Create multiple records in a single batch. Internal method used by
   * Adapter#createMany.
   *
   * @method MongoDBAdapter#_createMany
   * @private
   * @param {object} mapper The mapper.
   * @param {object} props The records to be created.
   * @param {object} [opts] Configuration options.
   * @return {Promise}
   */
  _createMany: function _createMany(mapper, props, opts) {
    var _this4 = this;

    props || (props = {});
    opts || (opts = {});

    return this._run(function (client, success, failure) {
      var collectionId = _this4._getCollectionId(mapper, opts);
      var insertManyOpts = _this4.getOpt('insertManyOpts', opts);
      props = jsData.utils.plainCopy(props);

      client.collection(collectionId).insertMany(props, insertManyOpts, function (err, cursor) {
        return err ? failure(err) : success(cursor);
      });
    }).then(function (cursor) {
      var records = [];
      var r = cursor.ops ? cursor.ops : cursor;
      _this4._translateObjectIDs(r, opts);
      records = r;
      cursor.connection = undefined;
      return [records, cursor];
    });
  },


  /**
   * Destroy the record with the given primary key.
   *
   * @method MongoDBAdapter#destroy
   * @param {object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * @param {object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {object} [opts.removeOpts] Options to pass to collection#remove.
   * @return {Promise}
   */

  /**
   * Destroy the record with the given primary key. Internal method used by
   * Adapter#destroy.
   *
   * @method MongoDBAdapter#_destroy
   * @private
   * @param {object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * @param {object} [opts] Configuration options.
   * @return {Promise}
   */
  _destroy: function _destroy(mapper, id, opts) {
    var _this5 = this;

    opts || (opts = {});

    return this._run(function (client, success, failure) {
      var collectionId = _this5._getCollectionId(mapper, opts);
      var removeOpts = _this5.getOpt('removeOpts', opts);

      var mongoQuery = defineProperty({}, mapper.idAttribute, _this5.toObjectID(mapper, id));
      var collection = client.collection(collectionId);
      var handler = function handler(err, cursor) {
        return err ? failure(err) : success(cursor);
      };

      if (collection.deleteOne) {
        collection.deleteOne(mongoQuery, removeOpts, handler);
      } else {
        collection.remove(mongoQuery, removeOpts, handler);
      }
    }).then(function (cursor) {
      return [undefined, cursor];
    });
  },


  /**
   * Destroy the records that match the selection query.
   *
   * @method MongoDBAdapter#destroyAll
   * @param {object} mapper the mapper.
   * @param {object} [query] Selection query.
   * @param {object} [query.where] Filtering criteria.
   * @param {string|Array} [query.orderBy] Sorting criteria.
   * @param {string|Array} [query.sort] Same as `query.sort`.
   * @param {number} [query.limit] Limit results.
   * @param {number} [query.skip] Offset results.
   * @param {number} [query.offset] Same as `query.skip`.
   * @param {object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {object} [opts.removeOpts] Options to pass to collection#remove.
   * @return {Promise}
   */

  /**
   * Destroy the records that match the selection query. Internal method used by
   * Adapter#destroyAll.
   *
   * @method MongoDBAdapter#_destroyAll
   * @private
   * @param {object} mapper the mapper.
   * @param {object} [query] Selection query.
   * @param {object} [opts] Configuration options.
   * @return {Promise}
   */
  _destroyAll: function _destroyAll(mapper, query, opts) {
    var _this6 = this;

    query || (query = {});
    opts || (opts = {});

    return this._run(function (client, success, failure) {
      var collectionId = _this6._getCollectionId(mapper, opts);
      var removeOpts = _this6.getOpt('removeOpts', opts);
      jsData.utils.fillIn(removeOpts, _this6.getQueryOptions(mapper, query));

      var mongoQuery = _this6.getQuery(mapper, query);
      var collection = client.collection(collectionId);
      var handler = function handler(err, cursor) {
        return err ? failure(err) : success(cursor);
      };

      if (collection.deleteMany) {
        collection.deleteMany(mongoQuery, removeOpts, handler);
      } else {
        collection.remove(mongoQuery, removeOpts, handler);
      }
    }).then(function (cursor) {
      cursor.connection = undefined;
      return [undefined, cursor];
    });
  },


  /**
   * Retrieve the record with the given primary key.
   *
   * @method MongoDBAdapter#find
   * @param {object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {object} [opts] Configuration options.
   * @param {string|string[]|object} [opts.fields] Select a subset of fields to be returned.
   * @param {object} [opts.findOneOpts] Options to pass to collection#findOne.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {string[]} [opts.with=[]] Relations to eager load.
   * @return {Promise}
   */

  /**
   * Retrieve the record with the given primary key. Internal method used by
   * Adapter#find.
   *
   * @method MongoDBAdapter#_find
   * @private
   * @param {object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {object} [opts] Configuration options.
   * @param {string|string[]|object} [opts.fields] Select a subset of fields to be returned.
   * @return {Promise}
   */
  _find: function _find(mapper, id, opts) {
    var _this7 = this;

    opts || (opts = {});
    opts.with || (opts.with = []);

    return this._run(function (client, success, failure) {
      var collectionId = _this7._getCollectionId(mapper, opts);
      var findOneOpts = _this7.getOpt('findOneOpts', opts);
      findOneOpts.fields = _this7._getFields(mapper, opts);

      var mongoQuery = defineProperty({}, mapper.idAttribute, _this7.toObjectID(mapper, id));

      client.collection(collectionId).findOne(mongoQuery, findOneOpts, function (err, record) {
        return err ? failure(err) : success(record);
      });
    }).then(function (record) {
      if (record) {
        _this7._translateObjectIDs(record, opts);
      } else {
        record = undefined;
      }
      return [record, {}];
    });
  },


  /**
   * Retrieve the records that match the selection query.
   *
   * @method MongoDBAdapter#findAll
   * @param {object} mapper The mapper.
   * @param {object} query Selection query.
   * @param {object} [opts] Configuration options.
   * @param {string|string[]|object} [opts.fields] Select a subset of fields to be returned.
   * @param {object} [opts.findOpts] Options to pass to collection#find.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {string[]} [opts.with=[]] Relations to eager load.
   * @return {Promise}
   */

  /**
   * Retrieve the records that match the selection query. Internal method used
   * by Adapter#findAll.
   *
   * @method MongoDBAdapter#_findAll
   * @private
   * @param {object} mapper The mapper.
   * @param {object} query Selection query.
   * @param {object} [opts] Configuration options.
   * @param {string|string[]|object} [opts.fields] Select a subset of fields to be returned.
   * @return {Promise}
   */
  _findAll: function _findAll(mapper, query, opts) {
    var _this8 = this;

    opts || (opts = {});

    return this._run(function (client, success, failure) {
      var collectionId = _this8._getCollectionId(mapper, opts);
      var findOpts = _this8.getOpt('findOpts', opts);
      jsData.utils.fillIn(findOpts, _this8.getQueryOptions(mapper, query));
      findOpts.fields = _this8._getFields(mapper, opts);

      var mongoQuery = _this8.getQuery(mapper, query);

      client.collection(collectionId).find(mongoQuery, findOpts).toArray(function (err, records) {
        return err ? failure(err) : success(records);
      });
    }).then(function (records) {
      _this8._translateObjectIDs(records, opts);
      return [records, {}];
    });
  },
  _getCollectionId: function _getCollectionId(mapper, opts) {
    opts || (opts = {});
    return opts.table || opts.collection || mapper.table || mapper.collection || snakeCase(mapper.name);
  },
  _getFields: function _getFields(mapper, opts) {
    opts || (opts = {});
    if (jsData.utils.isString(opts.fields)) {
      opts.fields = defineProperty({}, opts.fields, 1);
    } else if (jsData.utils.isArray(opts.fields)) {
      var fields = {};
      opts.fields.forEach(function (field) {
        fields[field] = 1;
      });
      return fields;
    }
    return opts.fields;
  },
  _run: function _run(cb) {
    var _this9 = this;

    if (this._db) {
      // Use the cached db object
      return new jsData.utils.Promise(function (resolve, reject) {
        cb(_this9._db, resolve, reject);
      });
    }
    return this.getClient().then(function (client) {
      return new jsData.utils.Promise(function (resolve, reject) {
        cb(client, resolve, reject);
      });
    });
  },


  /**
   * Apply the given update to the record with the specified primary key.
   *
   * @method MongoDBAdapter#update
   * @param {object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {object} props The update to apply to the record.
   * @param {object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {object} [opts.updateOpts] Options to pass to collection#update.
   * @return {Promise}
   */

  /**
   * Apply the given update to the record with the specified primary key.
   * Internal method used by Adapter#update.
   *
   * @method MongoDBAdapter#_update
   * @private
   * @param {object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {object} props The update to apply to the record.
   * @param {object} [opts] Configuration options.
   * @return {Promise}
   */
  _update: function _update(mapper, id, props, opts) {
    var _this10 = this;

    props || (props = {});
    opts || (opts = {});

    return this._find(mapper, id, { raw: false }).then(function (result) {
      if (!result[0]) {
        throw new Error('Not Found');
      }
      return _this10._run(function (client, success, failure) {
        var collectionId = _this10._getCollectionId(mapper, opts);
        var updateOpts = _this10.getOpt('updateOpts', opts);

        var mongoQuery = defineProperty({}, mapper.idAttribute, _this10.toObjectID(mapper, id));
        var collection = client.collection(collectionId);
        var handler = function handler(err, cursor) {
          return err ? failure(err) : success(cursor);
        };

        if (collection.updateOne) {
          collection.updateOne(mongoQuery, { $set: props }, updateOpts, handler);
        } else {
          collection.update(mongoQuery, { $set: props }, updateOpts, handler);
        }
      });
    }).then(function (cursor) {
      return _this10._find(mapper, id, { raw: false }).then(function (result) {
        cursor.connection = undefined;
        return [result[0], cursor];
      });
    });
  },


  /**
   * Apply the given update to all records that match the selection query.
   *
   * @method MongoDBAdapter#updateAll
   * @param {object} mapper The mapper.
   * @param {object} props The update to apply to the selected records.
   * @param {object} [query] Selection query.
   * @param {object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {object} [opts.updateOpts] Options to pass to collection#update.
   * @return {Promise}
   */

  /**
   * Apply the given update to all records that match the selection query.
   * Internal method used by Adapter#updateAll.
   *
   * @method MongoDBAdapter#_updateAll
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateAll: function _updateAll(mapper, props, query, opts) {
    var _this11 = this;

    props || (props = {});
    query || (query = {});
    opts || (opts = {});
    var ids = void 0;

    return this._run(function (client, success, failure) {
      return _this11._findAll(mapper, query, { raw: false }).then(function (result) {
        var collectionId = _this11._getCollectionId(mapper, opts);
        var updateOpts = _this11.getOpt('updateOpts', opts);
        updateOpts.multi = true;

        var queryOptions = _this11.getQueryOptions(mapper, query);
        queryOptions.$set = props;
        ids = result[0].map(function (record) {
          return _this11.toObjectID(mapper, record[mapper.idAttribute]);
        });

        var mongoQuery = _this11.getQuery(mapper, query);
        var collection = client.collection(collectionId);
        var handler = function handler(err, cursor) {
          return err ? failure(err) : success(cursor);
        };

        if (collection.updateMany) {
          collection.updateMany(mongoQuery, queryOptions, updateOpts, handler);
        } else {
          collection.update(mongoQuery, queryOptions, updateOpts, handler);
        }
      });
    }).then(function (cursor) {
      var query = defineProperty({}, mapper.idAttribute, {
        'in': ids
      });
      return _this11._findAll(mapper, query, { raw: false }).then(function (result) {
        cursor.connection = undefined;
        return [result[0], cursor];
      });
    });
  },


  /**
   * Return a Promise that resolves to a reference to the MongoDB client being
   * used by this adapter.
   *
   * Useful when you need to do anything custom with the MongoDB client library.
   *
   * @method MongoDBAdapter#getClient
   * @return {object} MongoDB client.
   */
  getClient: function getClient() {
    return this.client;
  },


  /**
   * Map filtering params in a selection query to MongoDB a filtering object.
   *
   * Handles the following:
   *
   * - where
   *   - and bunch of filtering operators
   *
   * @method MongoDBAdapter#getQuery
   * @return {object}
   */
  getQuery: function getQuery(mapper, query) {
    query = jsData.utils.plainCopy(query || {});
    query.where || (query.where = {});

    jsData.utils.forOwn(query, function (config, keyword) {
      if (jsDataAdapter.reserved.indexOf(keyword) === -1) {
        if (jsData.utils.isObject(config)) {
          query.where[keyword] = config;
        } else {
          query.where[keyword] = {
            '==': config
          };
        }
        delete query[keyword];
      }
    });

    var mongoQuery = {};

    if (Object.keys(query.where).length !== 0) {
      jsData.utils.forOwn(query.where, function (criteria, field) {
        if (!jsData.utils.isObject(criteria)) {
          query.where[field] = {
            '==': criteria
          };
        }
        jsData.utils.forOwn(criteria, function (v, op) {
          if (op === '==' || op === '===' || op === 'contains') {
            mongoQuery[field] = v;
          } else if (op === '!=' || op === '!==' || op === 'notContains') {
            mongoQuery[field] = mongoQuery[field] || {};
            mongoQuery[field].$ne = v;
          } else if (op === '>') {
            mongoQuery[field] = mongoQuery[field] || {};
            mongoQuery[field].$gt = v;
          } else if (op === '>=') {
            mongoQuery[field] = mongoQuery[field] || {};
            mongoQuery[field].$gte = v;
          } else if (op === '<') {
            mongoQuery[field] = mongoQuery[field] || {};
            mongoQuery[field].$lt = v;
          } else if (op === '<=') {
            mongoQuery[field] = mongoQuery[field] || {};
            mongoQuery[field].$lte = v;
          } else if (op === 'in') {
            mongoQuery[field] = mongoQuery[field] || {};
            mongoQuery[field].$in = v;
          } else if (op === 'notIn') {
            mongoQuery[field] = mongoQuery[field] || {};
            mongoQuery[field].$nin = v;
          } else if (op === '|==' || op === '|===' || op === '|contains') {
            mongoQuery.$or = mongoQuery.$or || [];
            var orEqQuery = {};
            orEqQuery[field] = v;
            mongoQuery.$or.push(orEqQuery);
          } else if (op === '|!=' || op === '|!==' || op === '|notContains') {
            mongoQuery.$or = mongoQuery.$or || [];
            var orNeQuery = {};
            orNeQuery[field] = {
              '$ne': v
            };
            mongoQuery.$or.push(orNeQuery);
          } else if (op === '|>') {
            mongoQuery.$or = mongoQuery.$or || [];
            var orGtQuery = {};
            orGtQuery[field] = {
              '$gt': v
            };
            mongoQuery.$or.push(orGtQuery);
          } else if (op === '|>=') {
            mongoQuery.$or = mongoQuery.$or || [];
            var orGteQuery = {};
            orGteQuery[field] = {
              '$gte': v
            };
            mongoQuery.$or.push(orGteQuery);
          } else if (op === '|<') {
            mongoQuery.$or = mongoQuery.$or || [];
            var orLtQuery = {};
            orLtQuery[field] = {
              '$lt': v
            };
            mongoQuery.$or.push(orLtQuery);
          } else if (op === '|<=') {
            mongoQuery.$or = mongoQuery.$or || [];
            var orLteQuery = {};
            orLteQuery[field] = {
              '$lte': v
            };
            mongoQuery.$or.push(orLteQuery);
          } else if (op === '|in') {
            mongoQuery.$or = mongoQuery.$or || [];
            var orInQuery = {};
            orInQuery[field] = {
              '$in': v
            };
            mongoQuery.$or.push(orInQuery);
          } else if (op === '|notIn') {
            mongoQuery.$or = mongoQuery.$or || [];
            var orNinQuery = {};
            orNinQuery[field] = {
              '$nin': v
            };
            mongoQuery.$or.push(orNinQuery);
          }
        });
      });
    }

    return mongoQuery;
  },


  /**
   * Map non-filtering params in a selection query to MongoDB query options.
   *
   * Handles the following:
   *
   * - limit
   * - skip/offset
   * - orderBy/sort
   *
   * @method MongoDBAdapter#getQueryOptions
   * @return {object}
   */
  getQueryOptions: function getQueryOptions(mapper, query) {
    query = jsData.utils.plainCopy(query || {});
    query.orderBy = query.orderBy || query.sort;
    query.skip = query.skip || query.offset;

    var queryOptions = {};

    if (query.orderBy) {
      if (jsData.utils.isString(query.orderBy)) {
        query.orderBy = [[query.orderBy, 'asc']];
      }
      for (var i = 0; i < query.orderBy.length; i++) {
        if (jsData.utils.isString(query.orderBy[i])) {
          query.orderBy[i] = [query.orderBy[i], 'asc'];
        }
      }
      queryOptions.sort = query.orderBy;
    }

    if (query.skip) {
      queryOptions.skip = +query.skip;
    }

    if (query.limit) {
      queryOptions.limit = +query.limit;
    }

    return queryOptions;
  },


  /**
   * Turn an _id into an ObjectID if it isn't already an ObjectID.
   *
   * @method MongoDBAdapter#toObjectID
   * @return {*}
   */
  toObjectID: function toObjectID(mapper, id) {
    if (id !== undefined && mapper.idAttribute === '_id' && typeof id === 'string' && bson.ObjectID.isValid(id) && !(id instanceof bson.ObjectID)) {
      return new bson.ObjectID(id);
    }
    return id;
  },


  /**
   * Return the foreignKey from the given record for the provided relationship.
   *
   * @method MongoDBAdapter#makeBelongsToForeignKey
   * @return {*}
   */
  makeBelongsToForeignKey: function makeBelongsToForeignKey(mapper, def, record) {
    return this.toObjectID(def.getRelation(), jsDataAdapter.Adapter.prototype.makeBelongsToForeignKey.call(this, mapper, def, record));
  },


  /**
   * Return the localKeys from the given record for the provided relationship.
   *
   * Override with care.
   *
   * @method MongoDBAdapter#makeHasManyLocalKeys
   * @return {*}
   */
  makeHasManyLocalKeys: function makeHasManyLocalKeys(mapper, def, record) {
    var _this12 = this;

    var relatedMapper = def.getRelation();
    var localKeys = jsDataAdapter.Adapter.prototype.makeHasManyLocalKeys.call(this, mapper, def, record);
    return localKeys.map(function (key) {
      return _this12.toObjectID(relatedMapper, key);
    });
  },


  /**
   * Not supported.
   *
   * @method MongoDBAdapter#updateMany
   */
  updateMany: function updateMany() {
    throw new Error('not supported!');
  }
});

/**
 * Details of the current version of the `js-data-mongodb` module.
 *
 * @example
 * import { version } from 'js-data-mongodb';
 * console.log(version.full);
 *
 * @name module:js-data-mongodb.version
 * @type {object}
 * @property {string} version.full The full semver value.
 * @property {number} version.major The major version number.
 * @property {number} version.minor The minor version number.
 * @property {number} version.patch The patch version number.
 * @property {(string|boolean)} version.alpha The alpha version value,
 * otherwise `false` if the current version is not alpha.
 * @property {(string|boolean)} version.beta The beta version value,
 * otherwise `false` if the current version is not beta.
 */
var version = {
  full: '1.0.2',
  major: 1,
  minor: 0,
  patch: 2
};

/**
 * {@link MongoDBAdapter} class.
 *
 * @example
 * import { MongoDBAdapter } from 'js-data-mongodb';
 * const adapter = new MongoDBAdapter();
 *
 * @name module:js-data-mongodb.MongoDBAdapter
 * @see MongoDBAdapter
 * @type {Constructor}
 */

/**
 * Registered as `js-data-mongodb` in NPM.
 *
 * @example <caption>Install from NPM</caption>
 * npm i --save js-data-mongodb js-data mongodb bson
 *
 * @example <caption>Load via CommonJS</caption>
 * const MongoDBAdapter = require('js-data-mongodb').MongoDBAdapter;
 * const adapter = new MongoDBAdapter();
 *
 * @example <caption>Load via ES2015 Modules</caption>
 * import { MongoDBAdapter } from 'js-data-mongodb';
 * const adapter = new MongoDBAdapter();
 *
 * @module js-data-mongodb
 */

/**
 * Create a subclass of this MongoDBAdapter:
 * @example <caption>MongoDBAdapter.extend</caption>
 * // Normally you would do: import { MongoDBAdapter } from 'js-data-mongodb';
 * const JSDataMongoDB = require('js-data-mongodb');
 * const { MongoDBAdapter } = JSDataMongoDB;
 * console.log('Using JSDataMongoDB v' + JSDataMongoDB.version.full);
 *
 * // Extend the class using ES2015 class syntax.
 * class CustomMongoDBAdapterClass extends MongoDBAdapter {
 *   foo () { return 'bar'; }
 *   static beep () { return 'boop'; }
 * }
 * const customMongoDBAdapter = new CustomMongoDBAdapterClass();
 * console.log(customMongoDBAdapter.foo());
 * console.log(CustomMongoDBAdapterClass.beep());
 *
 * // Extend the class using alternate method.
 * const OtherMongoDBAdapterClass = MongoDBAdapter.extend({
 *   foo () { return 'bar'; }
 * }, {
 *   beep () { return 'boop'; }
 * });
 * const otherMongoDBAdapter = new OtherMongoDBAdapterClass();
 * console.log(otherMongoDBAdapter.foo());
 * console.log(OtherMongoDBAdapterClass.beep());
 *
 * // Extend the class, providing a custom constructor.
 * function AnotherMongoDBAdapterClass () {
 *   MongoDBAdapter.call(this);
 *   this.created_at = new Date().getTime();
 * }
 * MongoDBAdapter.extend({
 *   constructor: AnotherMongoDBAdapterClass,
 *   foo () { return 'bar'; }
 * }, {
 *   beep () { return 'boop'; }
 * });
 * const anotherMongoDBAdapter = new AnotherMongoDBAdapterClass();
 * console.log(anotherMongoDBAdapter.created_at);
 * console.log(anotherMongoDBAdapter.foo());
 * console.log(AnotherMongoDBAdapterClass.beep());
 *
 * @method MongoDBAdapter.extend
 * @param {object} [props={}] Properties to add to the prototype of the
 * subclass.
 * @param {object} [props.constructor] Provide a custom constructor function
 * to be used as the subclass itself.
 * @param {object} [classProps={}] Static properties to add to the subclass.
 * @returns {Constructor} Subclass of this MongoDBAdapter class.
 * @since 3.0.0
 */

exports.MongoDBAdapter = MongoDBAdapter;
exports.version = version;
//# sourceMappingURL=js-data-mongodb.js.map
