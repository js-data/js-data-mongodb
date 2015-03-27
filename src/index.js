import { MongoClient } from 'mongodb';
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

class DSMongoDBAdapter {
  constructor(uri) {
    this.client = new DSUtils.Promise((resolve, reject) => {
      MongoClient.connect(uri, (err, db) => err ? reject(err) : resolve(db));
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

  find(resourceConfig, id, options) {
    options = options || {};
    return this.getClient().then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        let params = {};
        params[resourceConfig.idAttribute] = id;
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).findOne(params, options, (err, r) => {
          if (err) {
            reject(err);
          } else if (!r) {
            reject(new Error('Not Found!'));
          } else {
            resolve(r);
          }
        });
      });
    });
  }

  findAll(resourceConfig, params, options) {
    options = options ? copy(options) : {};
    deepMixIn(options, this.getQueryOptions(resourceConfig, params));
    let query = this.getQuery(resourceConfig, params);
    return this.getClient().then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).find(query, options).toArray((err, r) => {
          if (err) {
            reject(err);
          } else {
            resolve(r);
          }
        });
      });
    });
  }

  create(resourceConfig, attrs, options) {
    options = options || {};
    attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
    return this.getClient().then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).insert(attrs, options, (err, r) => {
          if (err) {
            reject(err);
          } else {
            resolve(r[0]);
          }
        });
      });
    });
  }

  update(resourceConfig, id, attrs, options) {
    attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
    options = options || {};
    return this.find(resourceConfig, id, options).then(() => {
      return this.getClient().then(client => {
        return new DSUtils.Promise((resolve, reject) => {
          let params = {};
          params[resourceConfig.idAttribute] = id;
          client.collection(resourceConfig.table || underscore(resourceConfig.name)).update(params, { $set: attrs }, options, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }).then(() => this.find(resourceConfig, id, options));
      });
    });
  }

  updateAll(resourceConfig, attrs, params, options) {
    let ids = [];
    attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
    options = options ? copy(options) : {};
    let _options = copy(options);
    _options.multi = true;
    return this.getClient().then(client => {
      let queryOptions = this.getQueryOptions(resourceConfig, params);
      queryOptions.$set = attrs;
      let query = this.getQuery(resourceConfig, params);
      return this.findAll(resourceConfig, params, options).then(items => {
        ids = map(items, item => item[resourceConfig.idAttribute]);
        return new DSUtils.Promise((resolve, reject) => {
          client.collection(resourceConfig.table || underscore(resourceConfig.name)).update(query, queryOptions, _options, err => {
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
    options = options || {};
    return this.getClient().then(client => {
      return new DSUtils.Promise((resolve, reject) => {
        let params = {};
        params[resourceConfig.idAttribute] = id;
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).remove(params, options, err => {
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
    options = options ? copy(options) : {};
    return this.getClient().then(client => {
      deepMixIn(options, this.getQueryOptions(resourceConfig, params));
      let query = this.getQuery(resourceConfig, params);
      return new DSUtils.Promise((resolve, reject) => {
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).remove(query, options, err => {
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
