const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const bson = require('bson')
const ObjectID = bson.ObjectID
const JSData = require('js-data')
const underscore = require('mout/string/underscore')
const { DSUtils } = JSData

const reserved = [
  'orderBy',
  'sort',
  'limit',
  'offset',
  'skip',
  'where'
]

function Defaults () {}

Defaults.prototype.translateId = true
Defaults.prototype.mongoDriverOpts = { ignoreUndefined: true }

const addHiddenPropsToTarget = function (target, props) {
  DSUtils.forOwn(props, function (value, key) {
    props[key] = {
      writable: true,
      value
    }
  })
  Object.defineProperties(target, props)
}

const fillIn = function (dest, src) {
  DSUtils.forOwn(src, function (value, key) {
    if (!dest.hasOwnProperty(key) || dest[key] === undefined) {
      dest[key] = value
    }
  })
}

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

/**
 * MongoDBAdapter class.
 *
 * @example
 * import {DS} from 'js-data'
 * import MongoDBAdapter from 'js-data-mongodb'
 * const store = new DS()
 * const adapter = new MongoDBAdapter({
 *   uri: 'mongodb://localhost:27017'
 * })
 * store.registerAdapter('mongodb', adapter, { 'default': true })
 *
 * @class MongoDBAdapter
 * @param {Object} [opts] Configuration opts.
 * @param {string} [opts.uri=''] MongoDB URI.
 */
export default function MongoDBAdapter (opts) {
  const self = this
  if (typeof opts === 'string') {
    opts = { uri: opts }
  }
  opts.uri || (opts.uri = 'mongodb://localhost:27017')
  self.defaults = new Defaults()
  DSUtils.deepMixIn(self.defaults, opts)
  fillIn(self, opts)

  /**
   * A Promise that resolves to a reference to the MongoDB client being used by
   * this adapter.
   *
   * @name MongoDBAdapter#client
   * @type {Object}
   */
  self.client = new DSUtils.Promise(function (resolve, reject) {
    MongoClient.connect(opts.uri, opts.mongoDriverOpts, function (err, db) {
      return err ? reject(err) : resolve(db)
    })
  })
}

addHiddenPropsToTarget(MongoDBAdapter.prototype, {
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

    DSUtils.forOwn(query, function (v, k) {
      if (reserved.indexOf(k) === -1) {
        if (DSUtils.isObject(v)) {
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

    if (Object.keys(query.where).length) {
      DSUtils.forOwn(query.where, function (criteria, field) {
        if (!DSUtils.isObject(criteria)) {
          query.where[field] = {
            '==': criteria
          }
        }
        DSUtils.forOwn(criteria, function (v, op) {
          if (op === '==' || op === '===') {
            mongoQuery[field] = v
          } else if (op === '!=' || op === '!==') {
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
          } else if (op === '|==' || op === '|===') {
            mongoQuery.$or = mongoQuery.$or || []
            let orEqQuery = {}
            orEqQuery[field] = v
            mongoQuery.$or.push(orEqQuery)
          } else if (op === '|!=' || op === '|!==') {
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
  getQueryOptions (Resource, query) {
    query = query || {}
    query.orderBy = query.orderBy || query.sort
    query.skip = query.skip || query.offset

    let queryOptions = {}

    if (query.orderBy) {
      if (DSUtils.isString(query.orderBy)) {
        query.orderBy = [
          [query.orderBy, 'asc']
        ]
      }
      for (var i = 0; i < query.orderBy.length; i++) {
        if (DSUtils.isString(query.orderBy[i])) {
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
   * TODO
   *
   * @name MongoDBAdapter#translateId
   * @method
   * @return {*}
   */
  translateId (r, opts) {
    opts || (opts = {})
    if (typeof opts.translateId === 'boolean' ? opts.translateId : this.defaults.translateId) {
      if (DSUtils.isArray(r)) {
        r.forEach(function (_r) {
          const __id = _r._id ? _r._id.toString() : _r._id
          _r._id = typeof __id === 'string' ? __id : _r._id
        })
      } else if (DSUtils.isObject(r)) {
        const __id = r._id ? r._id.toString() : r._id
        r._id = typeof __id === 'string' ? __id : r._id
      }
    }
    return r
  },

  /**
   * TODO
   *
   * @name MongoDBAdapter#origify
   * @method
   * @return {Object}
   */
  origify (opts) {
    opts = opts || {}
    if (typeof opts.orig === 'function') {
      return opts.orig()
    }
    return opts
  },

  /**
   * TODO
   *
   * @name MongoDBAdapter#makeHasManyForeignKey
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
   * TODO
   *
   * If the foreignKeys in your database are saved as ObjectIDs, then override
   * this method and change it to something like:
   *
   * ```
   * return this.toObjectID(Resource, this.constructor.prototype.makeHasManyForeignKey.call(this, Resource, def, record))
   * ```
   *
   * There may be other reasons why you may want to override this method, like
   * when the id of the parent doesn't exactly match up to the key on the child.
   *
   * @name MongoDBAdapter#makeHasManyForeignKey
   * @method
   * @return {*}
   */
  makeHasManyForeignKey (Resource, def, record) {
    return DSUtils.get(record, Resource.idAttribute)
  },

  /**
   * TODO
   *
   * @name MongoDBAdapter#loadHasMany
   * @method
   * @return {Promise}
   */
  loadHasMany (Resource, def, records, __options) {
    const self = this
    let singular = false

    if (DSUtils.isObject(records) && !DSUtils.isArray(records)) {
      singular = true
      records = [records]
    }
    const IDs = records.map(function (record) {
      return self.makeHasManyForeignKey(Resource, def, record)
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
    return self.findAll(Resource.getResource(def.relation), query, __options).then(function (relatedItems) {
      records.forEach(function (record) {
        let attached = []
        // avoid unneccesary iteration when we only have one record
        if (singular) {
          attached = relatedItems
        } else {
          relatedItems.forEach(function (relatedItem) {
            if (DSUtils.get(relatedItem, def.foreignKey) === record[Resource.idAttribute]) {
              attached.push(relatedItem)
            }
          })
        }
        DSUtils.set(record, def.localField, attached)
      })
    })
  },

  /**
   * TODO
   *
   * @name MongoDBAdapter#loadHasOne
   * @method
   * @return {Promise}
   */
  loadHasOne (Resource, def, records, __options) {
    if (DSUtils.isObject(records) && !DSUtils.isArray(records)) {
      records = [records]
    }
    return this.loadHasMany(Resource, def, records, __options).then(function () {
      records.forEach(function (record) {
        const relatedData = DSUtils.get(record, def.localField)
        if (DSUtils.isArray(relatedData) && relatedData.length) {
          DSUtils.set(record, def.localField, relatedData[0])
        }
      })
    })
  },

  /**
   * TODO
   *
   * @name MongoDBAdapter#makeBelongsToForeignKey
   * @method
   * @return {*}
   */
  makeBelongsToForeignKey (Resource, def, record) {
    return this.toObjectID(Resource.getResource(def.relation), DSUtils.get(record, def.localKey))
  },

  /**
   * TODO
   *
   * @name MongoDBAdapter#loadBelongsTo
   * @method
   * @return {Promise}
   */
  loadBelongsTo (Resource, def, records, __options) {
    const self = this
    const relationDef = Resource.getResource(def.relation)

    if (DSUtils.isObject(records) && !DSUtils.isArray(records)) {
      const record = records
      return self.find(relationDef, self.makeBelongsToForeignKey(Resource, def, record), __options).then(function (relatedItem) {
        DSUtils.set(record, def.localField, relatedItem)
      })
    } else {
      const keys = records.map(function (record) {
        return self.makeBelongsToForeignKey(Resource, def, record)
      }).filter(function (key) {
        return key
      })
      return self.findAll(relationDef, {
        where: {
          [relationDef.idAttribute]: {
            'in': keys
          }
        }
      }, __options).then(function (relatedItems) {
        records.forEach(function (record) {
          relatedItems.forEach(function (relatedItem) {
            if (relatedItem[relationDef.idAttribute] === record[def.localKey]) {
              DSUtils.set(record, def.localField, relatedItem)
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
   * @param {Object} Resource The Resource.
   * @param {(string|number)} id Primary key of the record to retrieve.
   * @param {Object} [opts] Configuration options.
   * @param {string[]} [opts.with=[]] TODO
   * @return {Promise}
   */
  find (Resource, id, options) {
    const self = this
    let instance
    options = self.origify(options)
    options.with || (options.with = [])
    return self.getClient().then(function (client) {
      return new DSUtils.Promise(function (resolve, reject) {
        let mongoQuery = {}
        mongoQuery[Resource.idAttribute] = self.toObjectID(Resource, id)
        options.fields = options.fields || {}
        client.collection(Resource.table || underscore(Resource.name)).findOne(mongoQuery, options, function (err, r) {
          if (err) {
            reject(err)
          } else if (!r) {
            reject(new Error('Not Found!'))
          } else {
            resolve(self.translateId(r, options))
          }
        })
      })
    }).then(function (_instance) {
      instance = _instance
      let tasks = []
      const relationList = Resource.relationList || []

      relationList.forEach(function (def) {
        let relationName = def.relation
        let relationDef = Resource.getResource(relationName)
        let containedName = null
        if (options.with.indexOf(relationName) !== -1) {
          containedName = relationName
        } else if (options.with.indexOf(def.localField) !== -1) {
          containedName = def.localField
        }
        if (containedName) {
          let __options = DSUtils.deepMixIn({}, options.orig ? options.orig() : options)
          __options.with = options.with.slice()
          __options = DSUtils._(relationDef, __options)
          DSUtils.remove(__options.with, containedName)
          __options.with.forEach(function (relation, i) {
            if (relation && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.') {
              __options.with[i] = relation.substr(containedName.length + 1)
            } else {
              __options.with[i] = ''
            }
          })

          let task

          if (def.foreignKey && (def.type === 'hasOne' || def.type === 'hasMany')) {
            if (def.type === 'hasOne') {
              task = self.loadHasOne(Resource, def, instance, __options)
            } else {
              task = self.loadHasMany(Resource, def, instance, __options)
            }
          } else if (def.type === 'hasMany' && def.localKeys) {
            let localKeys = []
            let itemKeys = instance[def.localKeys] || []
            itemKeys = DSUtils.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys)
            localKeys = localKeys.concat(itemKeys || [])
            task = self.findAll(Resource.getResource(relationName), {
              where: {
                [relationDef.idAttribute]: {
                  'in': unique(localKeys).filter((x) => x).map((x) => self.toObjectID(relationDef, x))
                }
              }
            }, __options).then(function (relatedItems) {
              DSUtils.set(instance, def.localField, relatedItems)
              return relatedItems
            })
          } else if (def.type === 'belongsTo' || (def.type === 'hasOne' && def.localKey)) {
            task = self.loadBelongsTo(Resource, def, instance, __options)
          }

          if (task) {
            tasks.push(task)
          }
        }
      })

      return DSUtils.Promise.all(tasks)
    }).then(function () {
      return instance
    })
  },

  /**
   * Retrieve the records that match the selection query.
   *
   * @name MongoDBAdapter#findAll
   * @method
   * @param {Object} Resource The Resource.
   * @param {Object} query Selection query.
   * @param {Object} [opts] Configuration options.
   * @param {string[]} [opts.with=[]] TODO
   * @return {Promise}
   */
  findAll (Resource, query, options) {
    const self = this
    let items = null
    options = self.origify(options ? DSUtils.copy(options) : {})
    options.with = options.with || []
    DSUtils.deepMixIn(options, self.getQueryOptions(Resource, query))
    const mongoQuery = self.getQuery(Resource, query)
    return self.getClient().then(function (client) {
      return new DSUtils.Promise(function (resolve, reject) {
        options.fields = options.fields || {}
        client.collection(Resource.table || underscore(Resource.name)).find(mongoQuery, options).toArray((err, r) => {
          if (err) {
            reject(err)
          } else {
            resolve(self.translateId(r, options))
          }
        })
      })
    }).then(function (_items) {
      items = _items
      let tasks = []
      const relationList = Resource.relationList || []
      relationList.forEach(function (def) {
        let relationName = def.relation
        let relationDef = Resource.getResource(relationName)
        let containedName = null
        if (options.with.indexOf(relationName) !== -1) {
          containedName = relationName
        } else if (options.with.indexOf(def.localField) !== -1) {
          containedName = def.localField
        }
        if (containedName) {
          let __options = DSUtils.deepMixIn({}, options.orig ? options.orig() : options)
          __options.with = options.with.slice()
          __options = DSUtils._(relationDef, __options)
          DSUtils.remove(__options.with, containedName)
          __options.with.forEach(function (relation, i) {
            if (relation && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.') {
              __options.with[i] = relation.substr(containedName.length + 1)
            } else {
              __options.with[i] = ''
            }
          })

          let task

          if (def.foreignKey && (def.type === 'hasOne' || def.type === 'hasMany')) {
            if (def.type === 'hasMany') {
              task = self.loadHasMany(Resource, def, items, __options)
            } else {
              task = self.loadHasOne(Resource, def, items, __options)
            }
          } else if (def.type === 'hasMany' && def.localKeys) {
            let localKeys = []
            items.forEach(function (item) {
              let itemKeys = item[def.localKeys] || []
              itemKeys = DSUtils.isArray(itemKeys) ? itemKeys : Object.keys(itemKeys)
              localKeys = localKeys.concat(itemKeys || [])
            })
            task = self.findAll(Resource.getResource(relationName), {
              where: {
                [relationDef.idAttribute]: {
                  'in': unique(localKeys).filter((x) => x).map((x) => self.toObjectID(relationDef, x))
                }
              }
            }, __options).then(function (relatedItems) {
              items.forEach(function (item) {
                let attached = []
                let itemKeys = item[def.localKeys] || []
                itemKeys = DSUtils.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys)
                relatedItems.forEach(function (relatedItem) {
                  if (itemKeys && itemKeys.indexOf(relatedItem[relationDef.idAttribute]) !== -1) {
                    attached.push(relatedItem)
                  }
                })
                DSUtils.set(item, def.localField, attached)
              })
              return relatedItems
            })
          } else if (def.type === 'belongsTo' || (def.type === 'hasOne' && def.localKey)) {
            task = self.loadBelongsTo(Resource, def, items, __options)
          }

          if (task) {
            tasks.push(task)
          }
        }
      })
      return DSUtils.Promise.all(tasks)
    }).then(function () {
      return items
    })
  },

  /**
   * Create a new record.
   *
   * @name MongoDBAdapter#create
   * @method
   * @param {Object} Resource The Resource.
   * @param {Object} props The record to be created.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  create (Resource, props, opts) {
    const self = this
    props = DSUtils.removeCircular(DSUtils.omit(props, Resource.relationFields || []))
    opts = self.origify(opts)

    return self.getClient().then(function (client) {
      return new DSUtils.Promise(function (resolve, reject) {
        const collection = client.collection(Resource.table || underscore(Resource.name))
        const method = collection.insertOne ? DSUtils.isArray(props) ? 'insertMany' : 'insertOne' : 'insert'
        collection[method](props, opts, function (err, r) {
          if (err) {
            reject(err)
          } else {
            r = r.ops ? r.ops : r
            self.translateId(r, opts)
            resolve(DSUtils.isArray(props) ? r : r[0])
          }
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
   * @return {Promise}
   */
  destroy (Resource, id, opts) {
    const self = this
    opts = self.origify(opts)

    return self.getClient().then(function (client) {
      return new DSUtils.Promise(function (resolve, reject) {
        const mongoQuery = {}
        mongoQuery[Resource.idAttribute] = self.toObjectID(Resource, id)
        const collection = client.collection(Resource.table || underscore(Resource.name))
        collection[collection.deleteOne ? 'deleteOne' : 'remove'](mongoQuery, opts, function (err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
  },

  /**
   * Destroy the records that match the selection query.
   *
   * @name MongoDBAdapter#destroyAll
   * @method
   * @param {Object} Resource the Resource.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  destroyAll (Resource, query, opts) {
    const self = this
    opts = self.origify(opts ? DSUtils.copy(opts) : {})

    return self.getClient().then(function (client) {
      DSUtils.deepMixIn(opts, self.getQueryOptions(Resource, query))
      const mongoQuery = self.getQuery(Resource, query)
      return new DSUtils.Promise(function (resolve, reject) {
        const collection = client.collection(Resource.table || underscore(Resource.name))
        collection[collection.deleteMany ? 'deleteMany' : 'remove'](mongoQuery, opts, function (err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
  },

  /**
   * Apply the given update to the record with the specified primary key.
   *
   * @name MongoDBAdapter#update
   * @method
   * @param {Object} Resource The Resource.
   * @param {(string|number)} id The primary key of the record to be updated.
   * @param {Object} props The update to apply to the record.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  update (Resource, id, props, opts) {
    const self = this
    props = DSUtils.removeCircular(DSUtils.omit(props, Resource.relationFields || []))
    opts = self.origify(opts)

    return self.find(Resource, id, opts).then(function () {
      return self.getClient()
    }).then(function (client) {
      return new DSUtils.Promise(function (resolve, reject) {
        const mongoQuery = {}
        mongoQuery[Resource.idAttribute] = self.toObjectID(Resource, id)
        const collection = client.collection(Resource.table || underscore(Resource.name))
        collection[collection.updateOne ? 'updateOne' : 'update'](mongoQuery, { $set: props }, opts, function (err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }).then(function () {
      return self.find(Resource, id, opts)
    })
  },

  /**
   * Apply the given update to all records that match the selection query.
   *
   * @name MongoDBAdapter#updateAll
   * @method
   * @param {Object} Resource The Resource.
   * @param {Object} props The update to apply to the selected records.
   * @param {Object} [query] Selection query.
   * @param {Object} [opts] Configuration options.
   * @return {Promise}
   */
  updateAll (Resource, props, query, opts) {
    const self = this
    let ids = []
    props = DSUtils.removeCircular(DSUtils.omit(props, Resource.relationFields || []))
    opts = self.origify(opts ? DSUtils.copy(opts) : {})
    const mongoOptions = DSUtils.copy(opts)
    mongoOptions.multi = true

    return self.getClient().then(function (client) {
      const queryOptions = self.getQueryOptions(Resource, query)
      queryOptions.$set = props
      const mongoQuery = self.getQuery(Resource, query)

      return self.findAll(Resource, query, opts).then(function (items) {
        ids = items.map(function (item) {
          return self.toObjectID(Resource, item[Resource.idAttribute])
        })

        return new DSUtils.Promise(function (resolve, reject) {
          const collection = client.collection(Resource.table || underscore(Resource.name))
          collection[collection.updateMany ? 'updateMany' : 'update'](mongoQuery, queryOptions, mongoOptions, function (err) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      }).then(function () {
        const query = {}
        query[Resource.idAttribute] = {
          'in': ids
        }
        return self.findAll(Resource, query, opts)
      })
    })
  }
})
