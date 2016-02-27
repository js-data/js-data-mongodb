import {MongoClient} from 'mongodb'
import {ObjectID} from 'bson'
import {utils} from 'js-data'
import underscore from 'mout/string/underscore'

const {
  addHiddenPropsToTarget,
  fillIn,
  forEachRelation,
  forOwn,
  get,
  isArray,
  isObject,
  isString,
  isUndefined,
  resolve
} = utils

const reserved = [
  'orderBy',
  'sort',
  'limit',
  'offset',
  'skip',
  'where'
]

function unique (array) {
  const seen = {}
  const final = []
  array.forEach(function (item) {
    if (item in seen) {
      return
    }
    final.push(item)
    seen[item] = 0
  })
  return final
}

const noop = function (...args) {
  const self = this
  const opts = args[args.length - 1]
  self.dbg(opts.op, ...args)
  return resolve()
}

const noop2 = function (...args) {
  const self = this
  const opts = args[args.length - 2]
  self.dbg(opts.op, ...args)
  return resolve()
}

const DEFAULTS = {
  /**
   * Whether to log debugging information.
   *
   * @name MongoDBAdapter#debug
   * @type {boolean}
   * @default false
   */
  debug: false,

  /**
   * Whether to return detailed result objects instead of just record data.
   *
   * @name MongoDBAdapter#raw
   * @type {boolean}
   * @default false
   */
  raw: false,

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
export default function MongoDBAdapter (opts) {
  const self = this
  opts || (opts = {})
  if (isString(opts)) {
    opts = { uri: opts }
  }
  fillIn(opts, DEFAULTS)
  fillIn(self, opts)

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
   * @name MongoDBAdapter#afterCreate
   * @method
   */
  afterCreate: noop2,

  /**
   * @name MongoDBAdapter#afterCreateMany
   * @method
   */
  afterCreateMany: noop2,

  /**
   * @name MongoDBAdapter#afterDestroy
   * @method
   */
  afterDestroy: noop2,

  /**
   * @name MongoDBAdapter#afterDestroyAll
   * @method
   */
  afterDestroyAll: noop2,

  /**
   * @name MongoDBAdapter#afterFind
   * @method
   */
  afterFind: noop2,

  /**
   * @name MongoDBAdapter#afterFindAll
   * @method
   */
  afterFindAll: noop2,

  /**
   * @name MongoDBAdapter#afterUpdate
   * @method
   */
  afterUpdate: noop2,

  /**
   * @name MongoDBAdapter#afterUpdateAll
   * @method
   */
  afterUpdateAll: noop2,

  /**
   * @name MongoDBAdapter#afterUpdateMany
   * @method
   */
  afterUpdateMany: noop2,

  /**
   * @name MongoDBAdapter#beforeCreate
   * @method
   */
  beforeCreate: noop,

  /**
   * @name MongoDBAdapter#beforeCreateMany
   * @method
   */
  beforeCreateMany: noop,

  /**
   * @name MongoDBAdapter#beforeDestroy
   * @method
   */
  beforeDestroy: noop,

  /**
   * @name MongoDBAdapter#beforeDestroyAll
   * @method
   */
  beforeDestroyAll: noop,

  /**
   * @name MongoDBAdapter#beforeFind
   * @method
   */
  beforeFind: noop,

  /**
   * @name MongoDBAdapter#beforeFindAll
   * @method
   */
  beforeFindAll: noop,

  /**
   * @name MongoDBAdapter#beforeUpdate
   * @method
   */
  beforeUpdate: noop,

  /**
   * @name MongoDBAdapter#beforeUpdateAll
   * @method
   */
  beforeUpdateAll: noop,

  /**
   * @name MongoDBAdapter#beforeUpdateMany
   * @method
   */
  beforeUpdateMany: noop,

  /**
   * @name MongoDBAdapter#dbg
   * @method
   */
  dbg (...args) {
    this.log('debug', ...args)
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
  getQuery (Resource, query) {
    query || (query = {})
    query.where || (query.where = {})

    forOwn(query, function (v, k) {
      if (reserved.indexOf(k) === -1) {
        if (isObject(v)) {
          query.where[k] = v
        } else {
          query.where[k] = {
            '==': v
          }
        }
        delete query[k]
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
   * Logging utility method.
   *
   * @name MongoDBAdapter#log
   * @method
   */
  log (level, ...args) {
    if (level && !args.length) {
      args.push(level)
      level = 'debug'
    }
    if (level === 'debug' && !this.debug) {
      return
    }
    const prefix = `${level.toUpperCase()}: (MongoDBAdapter)`
    if (console[level]) {
      console[level](prefix, ...args)
    } else {
      console.log(prefix, ...args)
    }
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
  getQueryOptions (Resource, query) {
    query = query || {}
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
   * Resolve the value of the specified option based on the given options and
   * this adapter's settings.
   *
   * @name MongoDBAdapter#getOpt
   * @method
   * @param {string} opt The name of the option.
   * @param {Object} [opts] Configuration options.
   * @return {*} The value of the specified option.
   */
  getOpt (opt, opts) {
    opts || (opts = {})
    return isUndefined(opts[opt]) ? this[opt] : opts[opt]
  },

  /**
   * Turn an _id into an ObjectID if it isn't already an ObjectID.
   *
   * @name MongoDBAdapter#toObjectID
   * @method
   * @return {*}
   */
  toObjectID (Resource, id) {
    if (id !== undefined && Resource.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id) && !(id instanceof ObjectID)) {
      return new ObjectID(id)
    }
    return id
  },

  /**
   * Return the foreignKey from the given record for the provided relationship.
   *
   * If the foreignKeys in your database are saved as ObjectIDs, then override
   * this method and change it to something like:
   *
   * ```
   * return this.toObjectID(mapper, this.constructor.prototype.makeHasManyForeignKey.call(this, mapper, def, record))
   * ```
   *
   * There may be other reasons why you may want to override this method, like
   * when the id of the parent doesn't exactly match up to the key on the child.
   *
   * @name MongoDBAdapter#makeHasManyForeignKey
   * @method
   * @return {*}
   */
  makeHasManyForeignKey (mapper, def, record) {
    return def.getForeignKey(record)
  },

  /**
   * Return the foreignKeys from the given record for the provided relationship.
   *
   * @name MongoDBAdapter#makeHasManyForeignKeys
   * @method
   * @return {*}
   */
  makeHasManyForeignKeys (mapper, def, record) {
    return get(record, mapper.idAttribute)
  },

  /**
   * Load a hasMany relationship.
   *
   * @name MongoDBAdapter#loadHasMany
   * @method
   * @return {Promise}
   */
  loadHasMany (mapper, def, records, __opts) {
    const self = this
    let singular = false

    if (isObject(records) && !isArray(records)) {
      singular = true
      records = [records]
    }
    const IDs = records.map(function (record) {
      return self.makeHasManyForeignKey(mapper, def, record)
    })
    const query = {}
    const criteria = query[def.foreignKey] = {}
    if (singular) {
      // more efficient query when we only have one record
      criteria['=='] = IDs[0]
    } else {
      criteria['in'] = IDs.filter(function (id) {
        return id
      })
    }
    return self.findAll(def.getRelation(), query, __opts).then(function (relatedItems) {
      records.forEach(function (record) {
        let attached = []
        // avoid unneccesary iteration when we only have one record
        if (singular) {
          attached = relatedItems
        } else {
          relatedItems.forEach(function (relatedItem) {
            if (get(relatedItem, def.foreignKey) === record[mapper.idAttribute]) {
              attached.push(relatedItem)
            }
          })
        }
        def.setLocalField(record, attached)
      })
    })
  },

  /**
   * Load a hasOne relationship.
   *
   * @name MongoDBAdapter#loadHasOne
   * @method
   * @return {Promise}
   */
  loadHasOne (mapper, def, records, __opts) {
    if (isObject(records) && !isArray(records)) {
      records = [records]
    }
    return this.loadHasMany(mapper, def, records, __opts).then(function () {
      records.forEach(function (record) {
        const relatedData = def.getLocalField(record)
        if (isArray(relatedData) && relatedData.length) {
          def.setLocalField(record, relatedData[0])
        }
      })
    })
  },

  /**
   * Return the foreignKey from the given record for the provided relationship.
   *
   * @name MongoDBAdapter#makeBelongsToForeignKey
   * @method
   * @return {*}
   */
  makeBelongsToForeignKey (mapper, def, record) {
    return this.toObjectID(def.getRelation(), def.getForeignKey(record))
  },

  /**
   * Load a belongsTo relationship.
   *
   * @name MongoDBAdapter#loadBelongsTo
   * @method
   * @return {Promise}
   */
  loadBelongsTo (mapper, def, records, __opts) {
    const self = this
    const relationDef = def.getRelation()

    if (isObject(records) && !isArray(records)) {
      const record = records
      return self.find(relationDef, self.makeBelongsToForeignKey(mapper, def, record), __opts).then(function (relatedItem) {
        def.setLocalField(record, relatedItem)
      })
    } else {
      const keys = records.map(function (record) {
        return self.makeBelongsToForeignKey(mapper, def, record)
      }).filter(function (key) {
        return key
      })
      return self.findAll(relationDef, {
        where: {
          [relationDef.idAttribute]: {
            'in': keys
          }
        }
      }, __opts).then(function (relatedItems) {
        records.forEach(function (record) {
          relatedItems.forEach(function (relatedItem) {
            if (relatedItem[relationDef.idAttribute] === record[def.foreignKey]) {
              def.setLocalField(record, relatedItem)
            }
          })
        })
      })
    }
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
  find (mapper, id, opts) {
    const self = this
    let record, op
    opts || (opts = {})
    opts.with || (opts.with = [])

    const findOneOpts = self.getOpt('findOneOpts', opts)
    findOneOpts.fields || (findOneOpts.fields = {})

    return self.getClient().then(function (client) {
      // beforeFind lifecycle hook
      op = opts.op = 'beforeFind'
      return resolve(self[op](mapper, id, opts)).then(function () {
        return new Promise(function (resolve, reject) {
          let mongoQuery = {}
          mongoQuery[mapper.idAttribute] = self.toObjectID(mapper, id)
          client.collection(mapper.table || underscore(mapper.name)).findOne(mongoQuery, findOneOpts, function (err, cursor) {
            return err ? reject(err) : resolve(cursor)
          })
        })
      })
    }).then(function (_record) {
      if (!_record) {
        return
      }
      record = _record
      self._translateId(record, opts)
      const tasks = []

      forEachRelation(mapper, opts, function (def, __opts) {
        const relatedMapper = def.getRelation()
        let task

        if (def.foreignKey && (def.type === 'hasOne' || def.type === 'hasMany')) {
          if (def.type === 'hasOne') {
            task = self.loadHasOne(mapper, def, record, __opts)
          } else {
            task = self.loadHasMany(mapper, def, record, __opts)
          }
        } else if (def.type === 'hasMany' && def.localKeys) {
          let localKeys = []
          let itemKeys = get(record, def.localKeys) || []
          itemKeys = isArray(itemKeys) ? itemKeys : Object.keys(itemKeys)
          localKeys = localKeys.concat(itemKeys)
          task = self.findAll(relatedMapper, {
            where: {
              [relatedMapper.idAttribute]: {
                'in': unique(localKeys).filter(function (x) { return x }).map(function (x) { return self.toObjectID(relatedMapper, x) })
              }
            }
          }, __opts).then(function (relatedItems) {
            def.setLocalField(record, relatedItems)
          })
        } else if (def.type === 'hasMany' && def.foreignKeys) {
          task = self.findAll(relatedMapper, {
            where: {
              [def.foreignKeys]: {
                'contains': self.makeHasManyForeignKeys(mapper, def, record)
              }
            }
          }, __opts).then(function (relatedItems) {
            def.setLocalField(record, relatedItems)
          })
        } else if (def.type === 'belongsTo') {
          task = self.loadBelongsTo(mapper, def, record, __opts)
        }
        if (task) {
          tasks.push(task)
        }
      })

      return Promise.all(tasks)
    }).then(function () {
      // afterFind lifecycle hook
      op = opts.op = 'afterFind'
      return resolve(self[op](mapper, id, opts, record)).then(function (_record) {
        // Allow for re-assignment from lifecycle hook
        record = isUndefined(_record) ? record : _record
        return self.getOpt('raw', opts) ? {
          data: record,
          found: record ? 1 : 0
        } : record
      })
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
  findAll (mapper, query, opts) {
    const self = this
    opts || (opts = {})
    opts.with || (opts.with = [])

    let records = []
    let op
    const findOpts = self.getOpt('findOpts', opts)
    fillIn(findOpts, self.getQueryOptions(mapper, query))
    findOpts.fields || (findOpts.fields = {})
    const mongoQuery = self.getQuery(mapper, query)

    return self.getClient().then(function (client) {
      // beforeFindAll lifecycle hook
      op = opts.op = 'beforeFindAll'
      return resolve(self[op](mapper, query, opts)).then(function () {
        return new Promise(function (resolve, reject) {
          client.collection(mapper.table || underscore(mapper.name)).find(mongoQuery, findOpts).toArray(function (err, cursor) {
            return err ? reject(err) : resolve(cursor)
          })
        })
      })
    }).then(function (_records) {
      records = _records
      self._translateId(records, opts)
      const tasks = []
      forEachRelation(mapper, opts, function (def, __opts) {
        const relatedMapper = def.getRelation()
        let task
        if (def.foreignKey && (def.type === 'hasOne' || def.type === 'hasMany')) {
          if (def.type === 'hasMany') {
            task = self.loadHasMany(mapper, def, records, __opts)
          } else {
            task = self.loadHasOne(mapper, def, records, __opts)
          }
        } else if (def.type === 'hasMany' && def.localKeys) {
          let localKeys = []
          records.forEach(function (item) {
            let itemKeys = item[def.localKeys] || []
            itemKeys = isArray(itemKeys) ? itemKeys : Object.keys(itemKeys)
            localKeys = localKeys.concat(itemKeys)
          })
          task = self.findAll(relatedMapper, {
            where: {
              [relatedMapper.idAttribute]: {
                'in': unique(localKeys).filter(function (x) { return x }).map(function (x) { return self.toObjectID(relatedMapper, x) })
              }
            }
          }, __opts).then(function (relatedItems) {
            records.forEach(function (item) {
              let attached = []
              let itemKeys = get(item, def.localKeys) || []
              itemKeys = isArray(itemKeys) ? itemKeys : Object.keys(itemKeys)
              relatedItems.forEach(function (relatedItem) {
                if (itemKeys && itemKeys.indexOf(relatedItem[relatedMapper.idAttribute]) !== -1) {
                  attached.push(relatedItem)
                }
              })
              def.setLocalField(item, attached)
            })
            return relatedItems
          })
        } else if (def.type === 'hasMany' && def.foreignKeys) {
          throw new Error('findAll eager load hasMany foreignKeys not supported!')
        } else if (def.type === 'belongsTo') {
          task = self.loadBelongsTo(mapper, def, records, __opts)
        }
        if (task) {
          tasks.push(task)
        }
      })
      return Promise.all(tasks)
    }).then(function () {
      // afterFindAll lifecycle hook
      op = opts.op = 'afterFindAll'
      return resolve(self[op](mapper, query, opts, records)).then(function (_records) {
        // Allow for re-assignment from lifecycle hook
        records = isUndefined(_records) ? records : _records
        return self.getOpt('raw', opts) ? {
          data: records,
          found: records.length
        } : records
      })
    })
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
   * response object.
   * @return {Promise}
   */
  create (mapper, props, opts) {
    const self = this
    let op
    props || (props = {})
    opts || (opts = {})

    const insertOpts = self.getOpt('insertOpts', opts)

    return self.getClient().then(function (client) {
      // beforeCreate lifecycle hook
      op = opts.op = 'beforeCreate'
      return resolve(self[op](mapper, props, opts)).then(function (_props) {
        // Allow for re-assignment from lifecycle hook
        _props = isUndefined(_props) ? props : _props
        return new Promise(function (resolve, reject) {
          const collection = client.collection(mapper.table || underscore(mapper.name))
          const method = collection.insertOne ? 'insertOne' : 'insert'
          collection[method](_props, insertOpts, function (err, cursor) {
            return err ? reject(err) : resolve(cursor)
          })
        })
      }).then(function (cursor) {
        let record
        let r = cursor.ops ? cursor.ops : cursor
        self._translateId(r, opts)
        record = isArray(r) ? r[0] : r

        // afterCreate lifecycle hook
        op = opts.op = 'afterCreate'
        return self[op](mapper, props, opts, record).then(function (_record) {
          // Allow for re-assignment from lifecycle hook
          record = isUndefined(_record) ? record : _record
          const result = {}
          fillIn(result, cursor)
          delete result.connection
          result.data = record
          result.created = record ? 1 : 0
          return self.getOpt('raw', opts) ? result : result.data
        })
      })
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
  createMany (mapper, props, opts) {
    const self = this
    let op
    props || (props = {})
    opts || (opts = {})

    const insertManyOpts = self.getOpt('insertManyOpts', opts)

    return self.getClient().then(function (client) {
      // beforeCreateMany lifecycle hook
      op = opts.op = 'beforeCreateMany'
      return resolve(self[op](mapper, props, opts)).then(function (_props) {
        // Allow for re-assignment from lifecycle hook
        _props = isUndefined(_props) ? props : _props
        return new Promise(function (resolve, reject) {
          const collection = client.collection(mapper.table || underscore(mapper.name))
          collection.insertMany(_props, insertManyOpts, function (err, cursor) {
            return err ? reject(err) : resolve(cursor)
          })
        })
      }).then(function (cursor) {
        let records
        let r = cursor.ops ? cursor.ops : cursor
        self._translateId(r, opts)
        records = r

        // afterCreateMany lifecycle hook
        op = opts.op = 'afterCreateMany'
        return self[op](mapper, props, opts, records).then(function (_records) {
          // Allow for re-assignment from lifecycle hook
          records = isUndefined(_records) ? records : _records
          const result = {}
          fillIn(result, cursor)
          delete result.connection
          result.data = records
          result.created = records.length
          return self.getOpt('raw', opts) ? result : result.data
        })
      })
    })
  },

  /**
   * Destroy the record with the given primary key.
   *
   * @name MongoDBAdapter#destroy
   * @method
   * @param {Object} Resource The Resource.
   * @param {(string|number)} id Primary key of the record to destroy.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {Object} [opts.removeOpts] Options to pass to collection#remove.
   * @return {Promise}
   */
  destroy (mapper, id, opts) {
    const self = this
    let op
    opts || (opts = {})
    const removeOpts = self.getOpt('removeOpts', opts)

    return self.getClient().then(function (client) {
      // beforeDestroy lifecycle hook
      op = opts.op = 'beforeDestroy'
      return resolve(self[op](mapper, id, opts)).then(function () {
        return new Promise(function (resolve, reject) {
          const mongoQuery = {}
          mongoQuery[mapper.idAttribute] = self.toObjectID(mapper, id)
          const collection = client.collection(mapper.table || underscore(mapper.name))
          collection[collection.deleteOne ? 'deleteOne' : 'remove'](mongoQuery, removeOpts, function (err, cursor) {
            return err ? reject(err) : resolve(cursor)
          })
        })
      })
    }).then(function (cursor) {
      // afterDestroy lifecycle hook
      op = opts.op = 'afterDestroy'
      return resolve(self[op](mapper, id, opts, cursor)).then(function (_cursor) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_cursor) ? cursor : _cursor
      })
    }).then(function (cursor) {
      if (cursor) {
        delete cursor.connection
      }
      return self.getOpt('raw', opts) ? cursor : undefined
    })
  },

  /**
   * Destroy the records that match the selection query.
   *
   * @name MongoDBAdapter#destroyAll
   * @method
   * @param {Object} mapper the mapper.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @param {boolean} [opts.raw=false] Whether to return a more detailed
   * response object.
   * @param {Object} [opts.removeOpts] Options to pass to collection#remove.
   * @return {Promise}
   */
  destroyAll (mapper, query, opts) {
    const self = this
    let op
    query || (query = {})
    opts || (opts = {})
    const removeOpts = self.getOpt('removeOpts', opts)
    fillIn(removeOpts, self.getQueryOptions(mapper, query))

    return self.getClient().then(function (client) {
      // beforeDestroyAll lifecycle hook
      op = opts.op = 'beforeDestroyAll'
      return resolve(self[op](mapper, query, opts)).then(function () {
        const mongoQuery = self.getQuery(mapper, query)
        return new Promise(function (resolve, reject) {
          const collection = client.collection(mapper.table || underscore(mapper.name))
          collection[collection.deleteMany ? 'deleteMany' : 'remove'](mongoQuery, removeOpts, function (err, cursor) {
            return err ? reject(err) : resolve(cursor)
          })
        })
      })
    }).then(function (cursor) {
      // afterDestroyAll lifecycle hook
      op = opts.op = 'afterDestroyAll'
      return resolve(self[op](mapper, query, opts, cursor)).then(function (_cursor) {
        // Allow for re-assignment from lifecycle hook
        return isUndefined(_cursor) ? cursor : _cursor
      })
    }).then(function (cursor) {
      if (cursor) {
        delete cursor.connection
      }
      return self.getOpt('raw', opts) ? cursor : undefined
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
  update (mapper, id, props, opts) {
    const self = this
    props || (props = {})
    opts || (opts = {})
    let op
    const updateOpts = self.getOpt('updateOpts', opts)

    return self.find(mapper, id, { raw: false }).then(function (record) {
      if (!record) {
        throw new Error('Not Found')
      }
      // beforeUpdate lifecycle hook
      op = opts.op = 'beforeUpdate'
      return resolve(self[op](mapper, id, props, opts))
    }).then(function (_props) {
      // Allow for re-assignment from lifecycle hook
      _props = isUndefined(_props) ? props : _props
      return self.getClient().then(function (client) {
        return new Promise(function (resolve, reject) {
          const mongoQuery = {}
          mongoQuery[mapper.idAttribute] = self.toObjectID(mapper, id)
          const collection = client.collection(mapper.table || underscore(mapper.name))
          collection[collection.updateOne ? 'updateOne' : 'update'](mongoQuery, { $set: _props }, updateOpts, function (err, cursor) {
            return err ? reject(err) : resolve(cursor)
          })
        })
      })
    }).then(function (cursor) {
      if (cursor) {
        delete cursor.connection
      }
      return self.find(mapper, id, { raw: false }).then(function (record) {
        // afterUpdate lifecycle hook
        op = opts.op = 'afterUpdate'
        return resolve(self[op](mapper, id, props, opts, record)).then(function (_record) {
          // Allow for re-assignment from lifecycle hook
          record = isUndefined(_record) ? record : _record
          const result = {}
          fillIn(result, cursor)
          result.data = record
          result.updated = record ? 1 : 0
          return self.getOpt('raw', opts) ? result : result.data
        })
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
  updateAll (mapper, props, query, opts) {
    const self = this
    props || (props = {})
    query || (query = {})
    opts || (opts = {})
    let op, ids
    const updateOpts = self.getOpt('updateOpts', opts)
    updateOpts.multi = true

    return self.getClient().then(function (client) {
      const queryOptions = self.getQueryOptions(mapper, query)
      queryOptions.$set = props
      const mongoQuery = self.getQuery(mapper, query)

      // beforeUpdateAll lifecycle hook
      op = opts.op = 'beforeUpdateAll'
      return resolve(self[op](mapper, props, query, opts)).then(function () {
        return self.findAll(mapper, query, { raw: false })
      }).then(function (records) {
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
        if (cursor) {
          delete cursor.connection
        }
        const query = {}
        query[mapper.idAttribute] = {
          'in': ids
        }
        return self.findAll(mapper, query, { raw: false }).then(function (records) {
          // afterUpdateAll lifecycle hook
          op = opts.op = 'afterUpdateAll'
          return self[op](mapper, props, query, opts, records).then(function (_records) {
            // Allow for re-assignment from lifecycle hook
            records = isUndefined(_records) ? records : _records
            const result = {}
            fillIn(result, cursor)
            result.data = records
            result.updated = records.length
            return self.getOpt('raw', opts) ? result : result.data
          })
        })
      })
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
