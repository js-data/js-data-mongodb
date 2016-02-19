const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const bson = require('bson')
const map = require('mout/array/map')
const ObjectID = bson.ObjectID
const JSData = require('js-data')
const underscore = require('mout/string/underscore')
const unique = require('mout/array/unique')
const { DSUtils } = JSData

const reserved = [
  'orderBy',
  'sort',
  'limit',
  'offset',
  'skip',
  'where'
]

class Defaults {

}

Defaults.prototype.translateId = true

class DSMongoDBAdapter {
  constructor (opts) {
    if (typeof opts === 'string') {
      opts = { uri: opts }
    }
    opts.uri || (opts.uri = 'mongodb://localhost:27017')
    this.defaults = new Defaults()
    DSUtils.deepMixIn(this.defaults, opts)
    this.client = new DSUtils.Promise(function (resolve, reject) {
      MongoClient.connect(opts.uri, function (err, db) {
        return err ? reject(err) : resolve(db)
      })
    })
  }

  getClient () {
    return this.client
  }

  getQuery (resourceConfig, params) {
    params = params || {}
    params.where = params.where || {}

    DSUtils.forOwn(params, function (v, k) {
      if (reserved.indexOf(k) === -1) {
        if (DSUtils.isObject(v)) {
          params.where[k] = v
        } else {
          params.where[k] = {
            '==': v
          }
        }
        delete params[k]
      }
    })

    let query = {}

    if (Object.keys(params.where).length) {
      DSUtils.forOwn(params.where, function (criteria, field) {
        if (!DSUtils.isObject(criteria)) {
          params.where[field] = {
            '==': criteria
          }
        }
        DSUtils.forOwn(criteria, function (v, op) {
          if (op === '==' || op === '===') {
            query[field] = v
          } else if (op === '!=' || op === '!==') {
            query[field] = query[field] || {}
            query[field].$ne = v
          } else if (op === '>') {
            query[field] = query[field] || {}
            query[field].$gt = v
          } else if (op === '>=') {
            query[field] = query[field] || {}
            query[field].$gte = v
          } else if (op === '<') {
            query[field] = query[field] || {}
            query[field].$lt = v
          } else if (op === '<=') {
            query[field] = query[field] || {}
            query[field].$lte = v
          } else if (op === 'in') {
            query[field] = query[field] || {}
            query[field].$in = v
          } else if (op === 'notIn') {
            query[field] = query[field] || {}
            query[field].$nin = v
          } else if (op === '|==' || op === '|===') {
            query.$or = query.$or || []
            let orEqQuery = {}
            orEqQuery[field] = v
            query.$or.push(orEqQuery)
          } else if (op === '|!=' || op === '|!==') {
            query.$or = query.$or || []
            let orNeQuery = {}
            orNeQuery[field] = {
              '$ne': v
            }
            query.$or.push(orNeQuery)
          } else if (op === '|>') {
            query.$or = query.$or || []
            let orGtQuery = {}
            orGtQuery[field] = {
              '$gt': v
            }
            query.$or.push(orGtQuery)
          } else if (op === '|>=') {
            query.$or = query.$or || []
            let orGteQuery = {}
            orGteQuery[field] = {
              '$gte': v
            }
            query.$or.push(orGteQuery)
          } else if (op === '|<') {
            query.$or = query.$or || []
            let orLtQuery = {}
            orLtQuery[field] = {
              '$lt': v
            }
            query.$or.push(orLtQuery)
          } else if (op === '|<=') {
            query.$or = query.$or || []
            let orLteQuery = {}
            orLteQuery[field] = {
              '$lte': v
            }
            query.$or.push(orLteQuery)
          } else if (op === '|in') {
            query.$or = query.$or || []
            let orInQuery = {}
            orInQuery[field] = {
              '$in': v
            }
            query.$or.push(orInQuery)
          } else if (op === '|notIn') {
            query.$or = query.$or || []
            let orNinQuery = {}
            orNinQuery[field] = {
              '$nin': v
            }
            query.$or.push(orNinQuery)
          }
        })
      })
    }

    return query
  }

  getQueryOptions (resourceConfig, params) {
    params = params || {}
    params.orderBy = params.orderBy || params.sort
    params.skip = params.skip || params.offset

    let queryOptions = {}

    if (params.orderBy) {
      if (DSUtils.isString(params.orderBy)) {
        params.orderBy = [
          [params.orderBy, 'asc']
        ]
      }
      for (var i = 0; i < params.orderBy.length; i++) {
        if (DSUtils.isString(params.orderBy[i])) {
          params.orderBy[i] = [params.orderBy[i], 'asc']
        }
      }
      queryOptions.sort = params.orderBy
    }

    if (params.skip) {
      queryOptions.skip = +params.skip
    }

    if (params.limit) {
      queryOptions.limit = +params.limit
    }

    return queryOptions
  }

  translateId (r, options) {
    options = options || {}
    if (typeof options.translateId === 'boolean' ? options.translateId : this.defaults.translateId) {
      if (Array.isArray(r)) {
        r.forEach((_r) => {
          let __id = _r._id ? _r._id.toString() : _r._id
          _r._id = typeof __id === 'string' ? __id : _r._id
        })
      } else if (DSUtils.isObject(r)) {
        let __id = r._id ? r._id.toString() : r._id
        r._id = typeof __id === 'string' ? __id : r._id
      }
    }
    return r
  }

  origify (options) {
    options = options || {}
    if (typeof options.orig === 'function') {
      return options.orig()
    }
    return options
  }

  find (resourceConfig, id, options) {
    let instance
    options = this.origify(options)
    options.with = options.with || []
    return this.getClient().then((client) => {
      return new DSUtils.Promise((resolve, reject) => {
        let params = {}
        params[resourceConfig.idAttribute] = id
        if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
          params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id)
        }
        options.fields = options.fields || {}
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).findOne(params, options, (err, r) => {
          if (err) {
            reject(err)
          } else if (!r) {
            reject(new Error('Not Found!'))
          } else {
            resolve(this.translateId(r, options))
          }
        })
      })
    }).then((_instance) => {
      instance = _instance
      let tasks = []

      DSUtils.forEach(resourceConfig.relationList, (def) => {
        let relationName = def.relation
        let relationDef = resourceConfig.getResource(relationName)
        let containedName = null
        if (DSUtils.contains(options.with, relationName)) {
          containedName = relationName
        } else if (DSUtils.contains(options.with, def.localField)) {
          containedName = def.localField
        }
        if (containedName) {
          let __options = DSUtils.deepMixIn({}, options.orig ? options.orig() : options)
          __options.with = options.with.slice()
          __options = DSUtils._(relationDef, __options)
          DSUtils.remove(__options.with, containedName)
          DSUtils.forEach(__options.with, (relation, i) => {
            if (relation && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.') {
              __options.with[i] = relation.substr(containedName.length + 1)
            } else {
              __options.with[i] = ''
            }
          })

          let task

          if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
            task = this.findAll(resourceConfig.getResource(relationName), {
              where: {
                [def.foreignKey]: {
                  '==': instance[resourceConfig.idAttribute]
                }
              }
            }, __options).then((relatedItems) => {
              if (def.type === 'hasOne' && relatedItems.length) {
                DSUtils.set(instance, def.localField, relatedItems[0])
              } else {
                DSUtils.set(instance, def.localField, relatedItems)
              }
              return relatedItems
            })
          } else if (def.type === 'hasMany' && def.localKeys) {
            let localKeys = []
            let itemKeys = instance[def.localKeys] || []
            itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys)
            localKeys = localKeys.concat(itemKeys || [])
            task = this.findAll(resourceConfig.getResource(relationName), {
              where: {
                [relationDef.idAttribute]: {
                  'in': map(DSUtils.filter(unique(localKeys), (x) => x), (x) => new ObjectID(x))
                }
              }
            }, __options).then((relatedItems) => {
              DSUtils.set(instance, def.localField, relatedItems)
              return relatedItems
            })
          } else if (def.type === 'belongsTo' || (def.type === 'hasOne' && def.localKey)) {
            task = this.find(resourceConfig.getResource(relationName), DSUtils.get(instance, def.localKey), __options).then((relatedItem) => {
              DSUtils.set(instance, def.localField, relatedItem)
              return relatedItem
            })
          }

          if (task) {
            tasks.push(task)
          }
        }
      })

      return DSUtils.Promise.all(tasks)
    }).then(() => instance)
  }

  findAll (resourceConfig, params, options) {
    let items = null
    options = this.origify(options ? DSUtils.copy(options) : {})
    options.with = options.with || []
    DSUtils.deepMixIn(options, this.getQueryOptions(resourceConfig, params))
    let query = this.getQuery(resourceConfig, params)
    return this.getClient().then((client) => {
      return new DSUtils.Promise((resolve, reject) => {
        options.fields = options.fields || {}
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).find(query, options).toArray((err, r) => {
          if (err) {
            reject(err)
          } else {
            resolve(this.translateId(r, options))
          }
        })
      })
    }).then((_items) => {
      items = _items
      let tasks = []
      DSUtils.forEach(resourceConfig.relationList, (def) => {
        let relationName = def.relation
        let relationDef = resourceConfig.getResource(relationName)
        let containedName = null
        if (DSUtils.contains(options.with, relationName)) {
          containedName = relationName
        } else if (DSUtils.contains(options.with, def.localField)) {
          containedName = def.localField
        }
        if (containedName) {
          let __options = DSUtils.deepMixIn({}, options.orig ? options.orig() : options)
          __options.with = options.with.slice()
          __options = DSUtils._(relationDef, __options)
          DSUtils.remove(__options.with, containedName)
          DSUtils.forEach(__options.with, (relation, i) => {
            if (relation && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.') {
              __options.with[i] = relation.substr(containedName.length + 1)
            } else {
              __options.with[i] = ''
            }
          })

          let task

          if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
            task = this.findAll(resourceConfig.getResource(relationName), {
              where: {
                [def.foreignKey]: {
                  'in': DSUtils.filter(map(items, (item) => DSUtils.get(item, resourceConfig.idAttribute)), (x) => x)
                }
              }
            }, __options).then((relatedItems) => {
              DSUtils.forEach(items, (item) => {
                let attached = []
                DSUtils.forEach(relatedItems, (relatedItem) => {
                  if (DSUtils.get(relatedItem, def.foreignKey) === item[resourceConfig.idAttribute]) {
                    attached.push(relatedItem)
                  }
                })
                if (def.type === 'hasOne' && attached.length) {
                  DSUtils.set(item, def.localField, attached[0])
                } else {
                  DSUtils.set(item, def.localField, attached)
                }
              })
              return relatedItems
            })
          } else if (def.type === 'hasMany' && def.localKeys) {
            let localKeys = []
            DSUtils.forEach(items, (item) => {
              let itemKeys = item[def.localKeys] || []
              itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys)
              localKeys = localKeys.concat(itemKeys || [])
            })
            task = this.findAll(resourceConfig.getResource(relationName), {
              where: {
                [relationDef.idAttribute]: {
                  'in': map(DSUtils.filter(unique(localKeys), (x) => x), (x) => new ObjectID(x))
                }
              }
            }, __options).then((relatedItems) => {
              DSUtils.forEach(items, (item) => {
                let attached = []
                let itemKeys = item[def.localKeys] || []
                itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys)
                DSUtils.forEach(relatedItems, (relatedItem) => {
                  if (itemKeys && DSUtils.contains(itemKeys, relatedItem[relationDef.idAttribute])) {
                    attached.push(relatedItem)
                  }
                })
                DSUtils.set(item, def.localField, attached)
              })
              return relatedItems
            })
          } else if (def.type === 'belongsTo' || (def.type === 'hasOne' && def.localKey)) {
            task = this.findAll(resourceConfig.getResource(relationName), {
              where: {
                [relationDef.idAttribute]: {
                  'in': map(DSUtils.filter(map(items, (item) => DSUtils.get(item, def.localKey)), (x) => x), (x) => new ObjectID(x))
                }
              }
            }, __options).then((relatedItems) => {
              DSUtils.forEach(items, (item) => {
                DSUtils.forEach(relatedItems, (relatedItem) => {
                  if (relatedItem[relationDef.idAttribute] === item[def.localKey]) {
                    DSUtils.set(item, def.localField, relatedItem)
                  }
                })
              })
              return relatedItems
            })
          }

          if (task) {
            tasks.push(task)
          }
        }
      })
      return DSUtils.Promise.all(tasks)
    }).then(() => items)
  }

  create (resourceConfig, attrs, options) {
    options = this.origify(options)
    attrs = DSUtils.removeCircular(DSUtils.omit(attrs, resourceConfig.relationFields || []))
    return this.getClient().then((client) => {
      return new DSUtils.Promise((resolve, reject) => {
        let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name))
        let method = collection.insertOne ? DSUtils.isArray(attrs) ? 'insertMany' : 'insertOne' : 'insert'
        collection[method](attrs, options, (err, r) => {
          if (err) {
            reject(err)
          } else {
            r = r.ops ? r.ops : r
            this.translateId(r, options)
            resolve(DSUtils.isArray(attrs) ? r : r[0])
          }
        })
      })
    })
  }

  update (resourceConfig, id, attrs, options) {
    attrs = DSUtils.removeCircular(DSUtils.omit(attrs, resourceConfig.relationFields || []))
    options = this.origify(options)
    return this.find(resourceConfig, id, options).then(() => {
      return this.getClient()
    }).then((client) => {
      return new DSUtils.Promise((resolve, reject) => {
        let params = {}
        params[resourceConfig.idAttribute] = id
        if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
          params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id)
        }
        let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name))
        collection[collection.updateOne ? 'updateOne' : 'update'](params, {$set: attrs}, options, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }).then(() => this.find(resourceConfig, id, options))
  }

  updateAll (resourceConfig, attrs, params, options) {
    let ids = []
    attrs = DSUtils.removeCircular(DSUtils.omit(attrs, resourceConfig.relationFields || []))
    options = this.origify(options ? DSUtils.copy(options) : {})
    let _options = DSUtils.copy(options)
    _options.multi = true
    return this.getClient().then((client) => {
      let queryOptions = this.getQueryOptions(resourceConfig, params)
      queryOptions.$set = attrs
      let query = this.getQuery(resourceConfig, params)
      return this.findAll(resourceConfig, params, options).then((items) => {
        ids = map(items, (item) => {
          let id = item[resourceConfig.idAttribute]
          if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
            return ObjectID.createFromHexString(id)
          }
          return id
        })
        return new DSUtils.Promise((resolve, reject) => {
          let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name))
          collection[collection.updateMany ? 'updateMany' : 'update'](query, queryOptions, _options, (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      }).then(() => {
        let _params = {}
        _params[resourceConfig.idAttribute] = {
          'in': ids
        }
        return this.findAll(resourceConfig, _params, options)
      })
    })
  }

  destroy (resourceConfig, id, options) {
    options = this.origify(options)
    return this.getClient().then((client) => {
      return new DSUtils.Promise((resolve, reject) => {
        let params = {}
        params[resourceConfig.idAttribute] = id
        if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
          params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id)
        }
        let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name))
        collection[collection.deleteOne ? 'deleteOne' : 'remove'](params, options, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
  }

  destroyAll (resourceConfig, params, options) {
    options = this.origify(options ? DSUtils.copy(options) : {})
    return this.getClient().then((client) => {
      DSUtils.deepMixIn(options, this.getQueryOptions(resourceConfig, params))
      let query = this.getQuery(resourceConfig, params)
      return new DSUtils.Promise((resolve, reject) => {
        let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name))
        collection[collection.deleteMany ? 'deleteMany' : 'remove'](query, options, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
  }
}

module.exports = DSMongoDBAdapter
