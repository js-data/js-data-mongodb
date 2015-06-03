import { MongoClient } from 'mongodb';
import { ObjectID } from 'bson';
import JSData from 'js-data';
import underscore from 'mout/string/underscore';
import keys from 'mout/object/keys';
import omit from 'mout/object/omit';
import map from 'mout/array/map';
import isEmpty from 'mout/lang/isEmpty';
let { DSUtils } = JSData;
let { deepMixIn, forEach, contains, isObject, isString, copy, forOwn, removeCircular } = DSUtils;

let reserved = [
  'orderBy',
  'sort',
  'limit',
  'offset',
  'skip',
  'where'
];

class Defaults {

}

Defaults.prototype.translateId = true;

class DSMongoDBAdapter {
  constructor(uri) {
    if (typeof uri === 'string') {
      uri = {uri};
    }
    this.defaults = new Defaults();
    deepMixIn(this.defaults, uri);
    this.client = new DSUtils.Promise((resolve, reject) => {
      MongoClient.connect(uri.uri, (err, db) => err ? reject(err) : resolve(db));
    });
  }

  getClient() {
    return this.client;
  }

  getQuery(resourceConfig, params) {
    params = params || {};
    params.where = params.where || {};

    forEach(keys(params), k => {
      let v = params[k];
      if (!contains(reserved, k)) {
        if (isObject(v)) {
          params.where[k] = v;
        } else {
          params.where[k] = {
            '==': v
          };
        }
        delete params[k];
      }
    });

    let query = {};

    if (!isEmpty(params.where)) {
      forOwn(params.where, (criteria, field) => {
        if (!isObject(criteria)) {
          params.where[field] = {
            '==': criteria
          };
        }
        forOwn(criteria, (v, op) => {
          if (op === '==' || op === '===') {
            query[field] = v;
          } else if (op === '!=' || op === '!==') {
            query[field] = query[field] || {};
            query[field].$ne = v;
          } else if (op === '>') {
            query[field] = query[field] || {};
            query[field].$gt = v;
          } else if (op === '>=') {
            query[field] = query[field] || {};
            query[field].$gte = v;
          } else if (op === '<') {
            query[field] = query[field] || {};
            query[field].$lt = v;
          } else if (op === '<=') {
            query[field] = query[field] || {};
            query[field].$lte = v;
          } else if (op === 'in') {
            query[field] = query[field] || {};
            query[field].$in = v;
          } else if (op === 'notIn') {
            query[field] = query[field] || {};
            query[field].$nin = v;
          } else if (op === '|==' || op === '|===') {
            query.$or = query.$or || [];
            let orEqQuery = {};
            orEqQuery[field] = v;
            query.$or.push(orEqQuery);
          } else if (op === '|!=' || op === '|!==') {
            query.$or = query.$or || [];
            let orNeQuery = {};
            orNeQuery[field] = {
              '$ne': v
            };
            query.$or.push(orNeQuery);
          } else if (op === '|>') {
            query.$or = query.$or || [];
            let orGtQuery = {};
            orGtQuery[field] = {
              '$gt': v
            };
            query.$or.push(orGtQuery);
          } else if (op === '|>=') {
            query.$or = query.$or || [];
            let orGteQuery = {};
            orGteQuery[field] = {
              '$gte': v
            };
            query.$or.push(orGteQuery);
          } else if (op === '|<') {
            query.$or = query.$or || [];
            let orLtQuery = {};
            orLtQuery[field] = {
              '$lt': v
            };
            query.$or.push(orLtQuery);
          } else if (op === '|<=') {
            query.$or = query.$or || [];
            let orLteQuery = {};
            orLteQuery[field] = {
              '$lte': v
            };
            query.$or.push(orLteQuery);
          } else if (op === '|in') {
            query.$or = query.$or || [];
            let orInQuery = {};
            orInQuery[field] = {
              '$in': v
            };
            query.$or.push(orInQuery);
          } else if (op === '|notIn') {
            query.$or = query.$or || [];
            let orNinQuery = {};
            orNinQuery[field] = {
              '$nin': v
            };
            query.$or.push(orNinQuery);
          }
        });
      });
    }

    return query;
  }

  getQueryOptions(resourceConfig, params) {
    params = params || {};
    params.orderBy = params.orderBy || params.sort;
    params.skip = params.skip || params.offset;

    let queryOptions = {};

    if (params.orderBy) {
      if (isString(params.orderBy)) {
        params.orderBy = [
          [params.orderBy, 'asc']
        ];
      }
      for (var i = 0; i < params.orderBy.length; i++) {
        if (isString(params.orderBy[i])) {
          params.orderBy[i] = [params.orderBy[i], 'asc'];
        }
      }
      queryOptions.sort = params.orderBy;
    }

    if (params.skip) {
      queryOptions.skip = params.skip;
    }

    if (params.limit) {
      queryOptions.limit = params.limit;
    }

    return queryOptions;
  }

  translateId(r, options) {
    options = options || {};
    if (typeof options.translateId === 'boolean' ? options.translateId : this.defaults.translateId) {
      if (Array.isArray(r)) {
        r.forEach(_r => {
          let __id = _r._id ? _r._id.toString() : _r._id;
          _r._id = typeof __id === 'string' ? __id : _r._id;
        });
      } else if (DSUtils.isObject(r)) {
        let __id = r._id ? r._id.toString() : r._id;
        r._id = typeof __id === 'string' ? __id : r._id;
      }
    }
    return r;
  }

  origify(options) {
    options = options || {};
    if (typeof options.orig === 'function') {
      return options.orig();
    }
    return options;
  }

  find(resourceConfig, id, options) {
    options = this.origify(options);
    return this.getClient().then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        let params = {};
        params[resourceConfig.idAttribute] = id;
        if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
          params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id);
        }
        options.fields = options.fields || {};
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).findOne(params, options, (err, r) => {
          if (err) {
            reject(err);
          } else if (!r) {
            reject(new Error('Not Found!'));
          } else {
            resolve(this.translateId(r, options));
          }
        });
      });
    });
  }

  findAll(resourceConfig, params, options) {
    options = this.origify(options ? copy(options) : {});
    deepMixIn(options, this.getQueryOptions(resourceConfig, params));
    let query = this.getQuery(resourceConfig, params);
    return this.getClient().then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        options.fields = options.fields || {};
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).find(query, options).toArray((err, r) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.translateId(r, options));
          }
        });
      });
    });
  }

  create(resourceConfig, attrs, options) {
    options = this.origify(options);
    attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
    return this.getClient().then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
        let method = collection.insertOne ? DSUtils.isArray(attrs) ? 'insertMany' : 'insertOne' : 'insert';
        collection[method](attrs, options, (err, r) => {
          if (err) {
            reject(err);
          } else {
            r = r.ops ? r.ops : r;
            this.translateId(r, options);
            resolve(DSUtils.isArray(attrs) ? r : r[0]);
          }
        });
      });
    });
  }

  update(resourceConfig, id, attrs, options) {
    attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
    options = this.origify(options);
    return this.find(resourceConfig, id, options).then(() => {
      return this.getClient();
    }).then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        let params = {};
        params[resourceConfig.idAttribute] = id;
        if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
          params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id);
        }
        let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
        collection[collection.updateOne ? 'updateOne' : 'update'](params, {$set: attrs}, options, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }).then(() => this.find(resourceConfig, id, options));
  }

  updateAll(resourceConfig, attrs, params, options) {
    let ids = [];
    attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
    options = this.origify(options ? copy(options) : {});
    let _options = copy(options);
    _options.multi = true;
    return this.getClient().then(client => {
      let queryOptions = this.getQueryOptions(resourceConfig, params);
      queryOptions.$set = attrs;
      let query = this.getQuery(resourceConfig, params);
      return this.findAll(resourceConfig, params, options).then(items => {
        ids = map(items, item => {
          let id = item[resourceConfig.idAttribute];
          if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
            return ObjectID.createFromHexString(id);
          }
          return id;
        });
        return new DSUtils.Promise((resolve, reject) => {
          let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
          collection[collection.updateMany ? 'updateMany' : 'update'](query, queryOptions, _options, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }).then(() => {
        let _params = {};
        _params[resourceConfig.idAttribute] = {
          'in': ids
        };
        return this.findAll(resourceConfig, _params, options);
      });
    });
  }

  destroy(resourceConfig, id, options) {
    options = this.origify(options);
    return this.getClient().then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        let params = {};
        params[resourceConfig.idAttribute] = id;
        if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
          params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id);
        }
        let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
        collection[collection.deleteOne ? 'deleteOne' : 'remove'](params, options, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  destroyAll(resourceConfig, params, options) {
    options = this.origify(options ? copy(options) : {});
    return this.getClient().then(client => {
      deepMixIn(options, this.getQueryOptions(resourceConfig, params));
      let query = this.getQuery(resourceConfig, params);
      return new DSUtils.Promise((resolve, reject) => {
        let collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
        collection[collection.deleteMany ? 'deleteMany' : 'remove'](query, options, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }
}

export default DSMongoDBAdapter;
