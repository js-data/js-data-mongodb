import {MongoClient} from 'mongodb'
import {ObjectID} from 'bson'
import {utils} from 'js-data'
import Adapter from 'js-data-adapter'
import {
  reserved
} from 'js-data-adapter'
import underscore from 'mout/string/underscore'

const {
  addHiddenPropsToTarget,
  classCallCheck,
  extend,
  fillIn,
  forOwn,
  isArray,
  isObject,
  isString,
  plainCopy
} = utils

const DEFAULTS = {
  /**
   * Convert ObjectIDs to strings when pulling records out of the database.
   *
   * @name MongoDBAdapter#translateId
   * @type {boolean}
   * @default true
   */
  translateId: true,

  /**
   * MongoDB URI.
   *
   * @name MongoDBAdapter#uri
   * @type {string}
   * @default mongodb://localhost:27017
   */
  uri: 'mongodb://localhost:27017'
}

const FIND_OPTS_DEFAULTS = {}
const FIND_ONE_OPTS_DEFAULTS = {}
const INSERT_OPTS_DEFAULTS = {}
const INSERT_MANY_OPTS_DEFAULTS = {}
const UPDATE_OPTS_DEFAULTS = {}
const REMOVE_OPTS_DEFAULTS = {}

/**
 * MongoDBAdapter class.
 *
 * @example
 * // Use Container instead of DataStore on the server
 * import {Container} from 'js-data'
 * import MongoDBAdapter from 'js-data-mongodb'
 *
 * // Create a store to hold your Mappers
 * const store = new Container({
 *   mapperDefaults: {
 *     // MongoDB uses "_id" as the primary key
 *     idAttribute: '_id'
 *   }
 * })
 *
 * // Create an instance of MongoDBAdapter with default settings
 * const adapter = new MongoDBAdapter()
 *
 * // Mappers in "store" will use the MongoDB adapter by default
 * store.registerAdapter('mongodb', adapter, { default: true })
 *
 * // Create a Mapper that maps to a "user" collection
 * store.defineMapper('user')
 *
 * @class MongoDBAdapter
 * @extends Adapter
 * @param {Object} [opts] Configuration opts.
 * @param {boolean} [opts.debug=false] Whether to log debugging information.
 * @param {Object} [opts.findOpts] Options to pass to collection#find.
 * @param {Object} [opts.findOneOpts] Options to pass to collection#findOne.
 * @param {Object} [opts.insertOpts] Options to pass to collection#insert.
 * @param {Object} [opts.insertManyOpts] Options to pass to
 * collection#insertMany.
 * @param {boolean} [opts.raw=false] Whether to return detailed result objects
 * instead of just record data.
 * @param {Object} [opts.removeOpts] Options to pass to collection#remove.
 * @param {boolean} [opts.translateId=true] Convert ObjectIDs to strings when
 * pulling records out of the database.
 * @param {Object} [opts.updateOpts] Options to pass to collection#update.
 * @param {string} [opts.uri="mongodb://localhost:27017"] MongoDB URI.
 */
function MongoDBAdapter (opts) {
  const self = this
  classCallCheck(self, MongoDBAdapter)
  opts || (opts = {})
  if (isString(opts)) {
    opts = { uri: opts }
  }
  fillIn(opts, DEFAULTS)
  Adapter.call(self, opts)

  /**
   * Default options to pass to collection#find.
   *
   * @name MongoDBAdapter#findOpts
   * @type {Object}
   * @default {}
   */
  self.findOpts || (self.findOpts = {})
  fillIn(self.findOpts, FIND_OPTS_DEFAULTS)

  /**
   * Default options to pass to collection#findOne.
   *
   * @name MongoDBAdapter#findOneOpts
   * @type {Object}
   * @default {}
   */
  self.findOneOpts || (self.findOneOpts = {})
  fillIn(self.findOneOpts, FIND_ONE_OPTS_DEFAULTS)

  /**
   * Default options to pass to collection#insert.
   *
   * @name MongoDBAdapter#insertOpts
   * @type {Object}
   * @default {}
   */
  self.insertOpts || (self.insertOpts = {})
  fillIn(self.insertOpts, INSERT_OPTS_DEFAULTS)

  /**
   * Default options to pass to collection#insertMany.
   *
   * @name MongoDBAdapter#insertManyOpts
   * @type {Object}
   * @default {}
   */
  self.insertManyOpts || (self.insertManyOpts = {})
  fillIn(self.insertManyOpts, INSERT_MANY_OPTS_DEFAULTS)

  /**
   * Default options to pass to collection#update.
   *
   * @name MongoDBAdapter#updateOpts
   * @type {Object}
   * @default {}
   */
  self.updateOpts || (self.updateOpts = {})
  fillIn(self.updateOpts, UPDATE_OPTS_DEFAULTS)

  /**
   * Default options to pass to collection#update.
   *
   * @name MongoDBAdapter#removeOpts
   * @type {Object}
   * @default {}
   */
  self.removeOpts || (self.removeOpts = {})
  fillIn(self.removeOpts, REMOVE_OPTS_DEFAULTS)

  /**
   * A Promise that resolves to a reference to the MongoDB client being used by
   * this adapter.
   *
   * @name MongoDBAdapter#client
   * @type {Object}
   */
  self.client = new Promise(function (resolve, reject) {
    MongoClient.connect(opts.uri, function (err, db) {
      return err ? reject(err) : resolve(db)
    })
  })
}

// Setup prototype inheritance from Adapter
MongoDBAdapter.prototype = Object.create(Adapter.prototype, {
  constructor: {
    value: MongoDBAdapter,
    enumerable: false,
    writable: true,
    configurable: true
  }
})

Object.defineProperty(MongoDBAdapter, '__super__', {
  configurable: true,
  value: Adapter
})

/**
 * Alternative to ES6 class syntax for extending `MongoDBAdapter`.
 *
 * @name MongoDBAdapter.extend
 * @method
 * @param {Object} [instanceProps] Properties that will be added to the
 * prototype of the MongoDBAdapter.
 * @param {Object} [classProps] Properties that will be added as static
 * properties to the MongoDBAdapter itself.
 * @return {Object} MongoDBAdapter of `MongoDBAdapter`.
 */
MongoDBAdapter.extend = extend

addHiddenPropsToTarget(MongoDBAdapter.prototype, {
  /**
   * Translate ObjectIDs to strings.
   *
   * @name MongoDBAdapter#_translateId
   * @method
   * @return {*}
   */
  _translateId (r, opts) {
    opts || (opts = {})
    if (this.getOpt('translateId', opts)) {
      if (isArray(r)) {
        r.forEach(function (_r) {
          const __id = _r._id ? _r._id.toString() : _r._id
          _r._id = typeof __id === 'string' ? __id : _r._id
        })
      } else if (isObject(r)) {
        const __id = r._id ? r._id.toString() : r._id
        r._id = typeof __id === 'string' ? __id : r._id
      }
    }
    return r
  },

  /**
   * Create a new record.
   *
   * @name MongoDBAdapter#create
   * @method
   * @param {Object} mapper The mapper.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.insertOpts] Options to pass to collection#insert.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * @return {Promise}
   */

  /**
   * Create a new record. Internal method used by Adapter#create.
   *
   * @name MongoDBAdapter#_create
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _create (mapper, props, opts) {
    const self = this
    props || (props = {})
    opts || (opts = {})
    props = plainCopy(props)

    const insertOpts = self.getOpt('insertOpts', opts)

    return self.getClient().then(function (client) {
      return new Promise(function (resolve, reject) {
        const collection = client.collection(mapper.table || underscore(mapper.name))
        const method = collection.insertOne ? 'insertOne' : 'insert'
        collection[method](props, insertOpts, function (err, cursor) {
          return err ? reject(err) : resolve(cursor)
        })
      })
    }).then(function (cursor) {
      let record
      let r = cursor.ops ? cursor.ops : cursor
      self._translateId(r, opts)
      record = isArray(r) ? r[0] : r
      cursor.connection = undefined
      return [record, cursor]
    })
  },

  /**
   * Create multiple records in a single batch.
   *
   * @name MongoDBAdapter#createMany
   * @method
   * @param {Object} mapper The mapper.
   * @param {Object} props The records to be created.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.insertManyOpts] Options to pass to
   * collection#insertMany.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @return {Promise}
   */

  /**
   * Create multiple records in a single batch. Internal method used by
   * Adapter#createMany.
   *
   * @name MongoDBAdapter#_createMany
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The records to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _createMany (mapper, props, opts) {
    const self = this
    props || (props = {})
    opts || (opts = {})
    props = plainCopy(props)

    const insertManyOpts = self.getOpt('insertManyOpts', opts)

    return self.getClient().then(function (client) {
      return new Promise(function (resolve, reject) {
        const collection = client.collection(mapper.table || underscore(mapper.name))
        collection.insertMany(props, insertManyOpts, function (err, cursor) {
          return err ? reject(err) : resolve(cursor)
        })
      })
    }).then(function (cursor) {
      let records = []
      let r = cursor.ops ? cursor.ops : cursor
      self._translateId(r, opts)
      records = r
      cursor.connection = undefined
      return [records, cursor]
    })
  },

  /**
   * Destroy the record with the given primary key.
   *
   * @name MongoDBAdapter#destroy
   * @method
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {Object} [opts.removeOpts] Options to pass to collection#remove.
   * @return {Promise}
   */

  /**
   * Destroy the record with the given primary key. Internal method used by
   * Adapter#destroy.
   *
   * @name MongoDBAdapter#_destroy
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to destroy.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _destroy (mapper, id, opts) {
    const self = this
    opts || (opts = {})
    const removeOpts = self.getOpt('removeOpts', opts)

    return self.getClient().then(function (client) {
      return new Promise(function (resolve, reject) {
        const mongoQuery = {}
        mongoQuery[mapper.idAttribute] = self.toObjectID(mapper, id)
        const collection = client.collection(mapper.table || underscore(mapper.name))
        collection[collection.deleteOne ? 'deleteOne' : 'remove'](mongoQuery, removeOpts, function (err, cursor) {
          return err ? reject(err) : resolve(cursor)
        })
      })
    }).then(function (cursor) {
      return [undefined, cursor]
    })
  },

  /**
   * Destroy the records that match the selection query.
   *
   * @name MongoDBAdapter#destroyAll
   * @method
   * @param {Object} mapper the mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [query.where] Filtering criteria.
   * @param {string|Array} [query.orderBy] Sorting criteria.
   * @param {string|Array} [query.sort] Same as `query.sort`.
   * @param {number} [query.limit] Limit results.
   * @param {number} [query.skip] Offset results.
   * @param {number} [query.offset] Same as `query.skip`.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {Object} [opts.removeOpts] Options to pass to collection#remove.
   * @return {Promise}
   */

  /**
   * Destroy the records that match the selection query. Internal method used by
   * Adapter#destroyAll.
   *
   * @name MongoDBAdapter#_destroyAll
   * @method
   * @private
   * @param {Object} mapper the mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _destroyAll (mapper, query, opts) {
    const self = this
    query || (query = {})
    opts || (opts = {})
    const removeOpts = self.getOpt('removeOpts', opts)
    fillIn(removeOpts, self.getQueryOptions(mapper, query))

    return self.getClient().then(function (client) {
      const mongoQuery = self.getQuery(mapper, query)
      return new Promise(function (resolve, reject) {
        const collection = client.collection(mapper.table || underscore(mapper.name))
        collection[collection.deleteMany ? 'deleteMany' : 'remove'](mongoQuery, removeOpts, function (err, cursor) {
          return err ? reject(err) : resolve(cursor)
        })
      })
    }).then(function (cursor) {
      cursor.connection = undefined
      return [undefined, cursor]
    })
  },

  /**
   * Retrieve the record with the given primary key.
   *
   * @name MongoDBAdapter#find
   * @method
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.findOneOpts] Options to pass to collection#findOne.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {string[]} [opts.with=[]] Relations to eager load.
   * @return {Promise}
   */

  /**
   * Retrieve the record with the given primary key. Internal method used by
   * Adapter#find.
   *
   * @name MongoDBAdapter#_find
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _find (mapper, id, opts) {
    const self = this
    opts || (opts = {})
    opts.with || (opts.with = [])

    const findOneOpts = self.getOpt('findOneOpts', opts)
    findOneOpts.fields || (findOneOpts.fields = {})

    return self.getClient().then(function (client) {
      return new Promise(function (resolve, reject) {
        let mongoQuery = {}
        mongoQuery[mapper.idAttribute] = self.toObjectID(mapper, id)
        client.collection(mapper.table || underscore(mapper.name)).findOne(mongoQuery, findOneOpts, function (err, record) {
          return err ? reject(err) : resolve(record)
        })
      })
    }).then(function (record) {
      if (record) {
        self._translateId(record, opts)
      }
      return [record, {}]
    })
  },

  /**
   * Retrieve the records that match the selection query.
   *
   * @name MongoDBAdapter#findAll
   * @method
   * @param {Object} mapper The mapper.
   * @param {Object} query Selection query.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.findOpts] Options to pass to collection#find.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {string[]} [opts.with=[]] Relations to eager load.
   * @return {Promise}
   */

  /**
   * Retrieve the records that match the selection query. Internal method used
   * by Adapter#findAll.
   *
   * @name MongoDBAdapter#_findAll
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} query Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _findAll (mapper, query, opts) {
    const self = this
    opts || (opts = {})

    const findOpts = self.getOpt('findOpts', opts)
    fillIn(findOpts, self.getQueryOptions(mapper, query))
    findOpts.fields || (findOpts.fields = {})
    const mongoQuery = self.getQuery(mapper, query)

    return self.getClient().then(function (client) {
      return new Promise(function (resolve, reject) {
        client.collection(mapper.table || underscore(mapper.name)).find(mongoQuery, findOpts).toArray(function (err, records) {
          return err ? reject(err) : resolve(records)
        })
      })
    }).then(function (records) {
      self._translateId(records, opts)
      return [records, {}]
    })
  },

  /**
   * Apply the given update to the record with the specified primary key.
   *
   * @name MongoDBAdapter#update
   * @method
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {Object} [opts.updateOpts] Options to pass to collection#update.
   * @return {Promise}
   */

  /**
   * Apply the given update to the record with the specified primary key.
   * Internal method used by Adapter#update.
   *
   * @name MongoDBAdapter#_update
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _update (mapper, id, props, opts) {
    const self = this
    props || (props = {})
    opts || (opts = {})
    const updateOpts = self.getOpt('updateOpts', opts)

    return self.find(mapper, id, { raw: false }).then(function (record) {
      if (!record) {
        throw new Error('Not Found')
      }
      return self.getClient().then(function (client) {
        return new Promise(function (resolve, reject) {
          const mongoQuery = {}
          mongoQuery[mapper.idAttribute] = self.toObjectID(mapper, id)
          const collection = client.collection(mapper.table || underscore(mapper.name))
          collection[collection.updateOne ? 'updateOne' : 'update'](mongoQuery, { $set: props }, updateOpts, function (err, cursor) {
            return err ? reject(err) : resolve(cursor)
          })
        })
      })
    }).then(function (cursor) {
      return self.find(mapper, id, { raw: false }).then(function (record) {
        cursor.connection = undefined
        return [record, cursor]
      })
    })
  },

  /**
   * Apply the given update to all records that match the selection query.
   *
   * @name MongoDBAdapter#updateAll
   * @method
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {Object} [opts.updateOpts] Options to pass to collection#update.
   * @return {Promise}
   */

  /**
   * Apply the given update to all records that match the selection query.
   * Internal method used by Adapter#updateAll.
   *
   * @name MongoDBAdapter#_updateAll
   * @method
   * @private
   * @param {Object} mapper The mapper.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  _updateAll (mapper, props, query, opts) {
    const self = this
    props || (props = {})
    query || (query = {})
    opts || (opts = {})
    let ids
    const updateOpts = self.getOpt('updateOpts', opts)
    updateOpts.multi = true

    return Promise.all([
      self.findAll(mapper, query, { raw: false }),
      self.getClient()
    ]).then(function (results) {
      let [records, client] = results
      const queryOptions = self.getQueryOptions(mapper, query)
      const mongoQuery = self.getQuery(mapper, query)

      queryOptions.$set = props
      ids = records.map(function (record) {
        return self.toObjectID(mapper, record[mapper.idAttribute])
      })

      return new Promise(function (resolve, reject) {
        const collection = client.collection(mapper.table || underscore(mapper.name))
        collection[collection.updateMany ? 'updateMany' : 'update'](mongoQuery, queryOptions, updateOpts, function (err, cursor) {
          return err ? reject(err) : resolve(cursor)
        })
      })
    }).then(function (cursor) {
      const query = {}
      query[mapper.idAttribute] = {
        'in': ids
      }
      return self.findAll(mapper, query, { raw: false }).then(function (records) {
        cursor.connection = undefined
        return [records, cursor]
      })
    })
  },

  /**
   * Return a Promise that resolves to a reference to the MongoDB client being
   * used by this adapter.
   *
   * Useful when you need to do anything custom with the MongoDB client library.
   *
   * @name MongoDBAdapter#getClient
   * @method
   * @return {Object} MongoDB client.
   */
  getClient () {
    return this.client
  },

  /**
   * Map filtering params in a selection query to MongoDB a filtering object.
   *
   * Handles the following:
   *
   * - where
   *   - and bunch of filtering operators
   *
   * @name MongoDBAdapter#getQuery
   * @method
   * @return {Object}
   */
  getQuery (mapper, query) {
    query = plainCopy(query || {})
    query.where || (query.where = {})

    forOwn(query, function (config, keyword) {
      if (reserved.indexOf(keyword) === -1) {
        if (isObject(config)) {
          query.where[keyword] = config
        } else {
          query.where[keyword] = {
            '==': config
          }
        }
        delete query[keyword]
      }
    })

    let mongoQuery = {}

    if (Object.keys(query.where).length !== 0) {
      forOwn(query.where, function (criteria, field) {
        if (!isObject(criteria)) {
          query.where[field] = {
            '==': criteria
          }
        }
        forOwn(criteria, function (v, op) {
          if (op === '==' || op === '===' || op === 'contains') {
            mongoQuery[field] = v
          } else if (op === '!=' || op === '!==' || op === 'notContains') {
            mongoQuery[field] = mongoQuery[field] || {}
            mongoQuery[field].$ne = v
          } else if (op === '>') {
            mongoQuery[field] = mongoQuery[field] || {}
            mongoQuery[field].$gt = v
          } else if (op === '>=') {
            mongoQuery[field] = mongoQuery[field] || {}
            mongoQuery[field].$gte = v
          } else if (op === '<') {
            mongoQuery[field] = mongoQuery[field] || {}
            mongoQuery[field].$lt = v
          } else if (op === '<=') {
            mongoQuery[field] = mongoQuery[field] || {}
            mongoQuery[field].$lte = v
          } else if (op === 'in') {
            mongoQuery[field] = mongoQuery[field] || {}
            mongoQuery[field].$in = v
          } else if (op === 'notIn') {
            mongoQuery[field] = mongoQuery[field] || {}
            mongoQuery[field].$nin = v
          } else if (op === '|==' || op === '|===' || op === '|contains') {
            mongoQuery.$or = mongoQuery.$or || []
            let orEqQuery = {}
            orEqQuery[field] = v
            mongoQuery.$or.push(orEqQuery)
          } else if (op === '|!=' || op === '|!==' || op === '|notContains') {
            mongoQuery.$or = mongoQuery.$or || []
            let orNeQuery = {}
            orNeQuery[field] = {
              '$ne': v
            }
            mongoQuery.$or.push(orNeQuery)
          } else if (op === '|>') {
            mongoQuery.$or = mongoQuery.$or || []
            let orGtQuery = {}
            orGtQuery[field] = {
              '$gt': v
            }
            mongoQuery.$or.push(orGtQuery)
          } else if (op === '|>=') {
            mongoQuery.$or = mongoQuery.$or || []
            let orGteQuery = {}
            orGteQuery[field] = {
              '$gte': v
            }
            mongoQuery.$or.push(orGteQuery)
          } else if (op === '|<') {
            mongoQuery.$or = mongoQuery.$or || []
            let orLtQuery = {}
            orLtQuery[field] = {
              '$lt': v
            }
            mongoQuery.$or.push(orLtQuery)
          } else if (op === '|<=') {
            mongoQuery.$or = mongoQuery.$or || []
            let orLteQuery = {}
            orLteQuery[field] = {
              '$lte': v
            }
            mongoQuery.$or.push(orLteQuery)
          } else if (op === '|in') {
            mongoQuery.$or = mongoQuery.$or || []
            let orInQuery = {}
            orInQuery[field] = {
              '$in': v
            }
            mongoQuery.$or.push(orInQuery)
          } else if (op === '|notIn') {
            mongoQuery.$or = mongoQuery.$or || []
            let orNinQuery = {}
            orNinQuery[field] = {
              '$nin': v
            }
            mongoQuery.$or.push(orNinQuery)
          }
        })
      })
    }

    return mongoQuery
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
   * @name MongoDBAdapter#getQueryOptions
   * @method
   * @return {Object}
   */
  getQueryOptions (mapper, query) {
    query = plainCopy(query || {})
    query.orderBy = query.orderBy || query.sort
    query.skip = query.skip || query.offset

    let queryOptions = {}

    if (query.orderBy) {
      if (isString(query.orderBy)) {
        query.orderBy = [
          [query.orderBy, 'asc']
        ]
      }
      for (var i = 0; i < query.orderBy.length; i++) {
        if (isString(query.orderBy[i])) {
          query.orderBy[i] = [query.orderBy[i], 'asc']
        }
      }
      queryOptions.sort = query.orderBy
    }

    if (query.skip) {
      queryOptions.skip = +query.skip
    }

    if (query.limit) {
      queryOptions.limit = +query.limit
    }

    return queryOptions
  },

  /**
   * Turn an _id into an ObjectID if it isn't already an ObjectID.
   *
   * @name MongoDBAdapter#toObjectID
   * @method
   * @return {*}
   */
  toObjectID (mapper, id) {
    if (id !== undefined && mapper.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id) && !(id instanceof ObjectID)) {
      return new ObjectID(id)
    }
    return id
  },

  /**
   * Return the foreignKey from the given record for the provided relationship.
   *
   * @name MongoDBAdapter#makeBelongsToForeignKey
   * @method
   * @return {*}
   */
  makeBelongsToForeignKey (mapper, def, record) {
    return this.toObjectID(def.getRelation(), Adapter.prototype.makeBelongsToForeignKey.call(this, mapper, def, record))
  },

  /**
   * Return the localKeys from the given record for the provided relationship.
   *
   * Override with care.
   *
   * @name MongoDBAdapter#makeHasManyLocalKeys
   * @method
   * @return {*}
   */
  makeHasManyLocalKeys (mapper, def, record) {
    const self = this
    const relatedMapper = def.getRelation()
    const localKeys = Adapter.prototype.makeHasManyLocalKeys.call(self, mapper, def, record)
    return localKeys.map(function (key) {
      return self.toObjectID(relatedMapper, key)
    })
  },

  /**
   * Not supported.
   *
   * @name MongoDBAdapter#updateMany
   * @method
   */
  updateMany () {
    throw new Error('not supported!')
  }
})

module.exports = MongoDBAdapter
