var MongoClient = require('mongodb').MongoClient;
var JSData = require('js-data');
var underscore = require('mout/string/underscore');
var keys = require('mout/object/keys');
var forEach = require('mout/array/forEach');
var contains = require('mout/array/contains');
var map = require('mout/array/map');
var isObject = require('mout/lang/isObject');
var isEmpty = require('mout/lang/isEmpty');
var isString = require('mout/lang/isString');
var forOwn = require('mout/object/forOwn');

var reserved = [
  'orderBy',
  'sort',
  'limit',
  'offset',
  'skip',
  'where'
];

function DSMongoDBAdapter(uri) {
  this.client = new JSData.DSUtils.Promise(function (resolve, reject) {
    MongoClient.connect(uri, function (err, db) {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

var dsRethinkDBAdapterPrototype = DSMongoDBAdapter.prototype;

dsRethinkDBAdapterPrototype.getClient = function getClient() {
  return this.client;
};

dsRethinkDBAdapterPrototype.getQuery = function getQuery(resourceConfig, params) {
  params = params || {};
  params.where = params.where || {};

  forEach(keys(params), function (k) {
    var v = params[k];
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

  var query = {};

  if (!isEmpty(params.where)) {
    forOwn(params.where, function (criteria, field) {
      if (!isObject(criteria)) {
        params.where[field] = {
          '==': criteria
        };
      }
      forOwn(criteria, function (v, op) {
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
          var orEqQuery = {};
          orEqQuery[field] = v;
          query.$or.push(orEqQuery);
        } else if (op === '|!=' || op === '|!==') {
          query.$or = query.$or || [];
          var orNeQuery = {};
          orNeQuery[field] = {
            '$ne': v
          };
          query.$or.push(orNeQuery);
        } else if (op === '|>') {
          query.$or = query.$or || [];
          var orGtQuery = {};
          orGtQuery[field] = {
            '$gt': v
          };
          query.$or.push(orGtQuery);
        } else if (op === '|>=') {
          query.$or = query.$or || [];
          var orGteQuery = {};
          orGteQuery[field] = {
            '$gte': v
          };
          query.$or.push(orGteQuery);
        } else if (op === '|<') {
          query.$or = query.$or || [];
          var orLtQuery = {};
          orLtQuery[field] = {
            '$lt': v
          };
          query.$or.push(orLtQuery);
        } else if (op === '|<=') {
          query.$or = query.$or || [];
          var orLteQuery = {};
          orLteQuery[field] = {
            '$lte': v
          };
          query.$or.push(orLteQuery);
        } else if (op === '|in') {
          query.$or = query.$or || [];
          var orInQuery = {};
          orInQuery[field] = {
            '$in': v
          };
          query.$or.push(orInQuery);
        } else if (op === '|notIn') {
          query.$or = query.$or || [];
          var orNinQuery = {};
          orNinQuery[field] = {
            '$nin': v
          };
          query.$or.push(orNinQuery);
        }
      });
    });
  }

  return query;
};

dsRethinkDBAdapterPrototype.getQueryOptions = function getQueryOptions(resourceConfig, params) {
  params = params || {};
  params.orderBy = params.orderBy || params.sort;
  params.skip = params.skip || params.offset;

  var queryOptions = {};

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
};

dsRethinkDBAdapterPrototype.find = function find(resourceConfig, id, options) {
  var _this = this;
  options = options || {};
  return _this.getClient().then(function (client) {
    return new JSData.DSUtils.Promise(function (resolve, reject) {
      var params = {};
      params[resourceConfig.idAttribute] = id;
      client.collection(resourceConfig.table || underscore(resourceConfig.name)).findOne(params, options, function (err, r) {
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
};

dsRethinkDBAdapterPrototype.findAll = function findAll(resourceConfig, params, options) {
  var _this = this;
  options = options || {};
  options = JSData.DSUtils.deepMixIn({}, options);
  JSData.DSUtils.deepMixIn(options, _this.getQueryOptions(resourceConfig, params));
  var query = _this.getQuery(resourceConfig, params);
  return _this.getClient().then(function (client) {
    return new JSData.DSUtils.Promise(function (resolve, reject) {
      client.collection(resourceConfig.table || underscore(resourceConfig.name)).find(query, options).toArray(function (err, r) {
        if (err) {
          reject(err);
        } else {
          resolve(r);
        }
      });
    });
  });
};

dsRethinkDBAdapterPrototype.create = function create(resourceConfig, attrs, options) {
  var _this = this;
  options = options || {};
  return _this.getClient().then(function (client) {
    return new JSData.DSUtils.Promise(function (resolve, reject) {
      client.collection(resourceConfig.table || underscore(resourceConfig.name)).insert(attrs, options, function (err, r) {
        if (err) {
          reject(err);
        } else {
          resolve(r[0]);
        }
      });
    });
  });
};

dsRethinkDBAdapterPrototype.update = function update(resourceConfig, id, attrs, options) {
  var _this = this;
  options = options || {};

  return _this.find(resourceConfig, id, options).then(function () {
    return _this.getClient().then(function (client) {
      return new JSData.DSUtils.Promise(function (resolve, reject) {
        var params = {};
        params[resourceConfig.idAttribute] = id;
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).update(params, { $set: attrs }, options, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }).then(function () {
          return _this.find(resourceConfig, id, options);
        });
    });
  });
};

dsRethinkDBAdapterPrototype.updateAll = function updateAll(resourceConfig, attrs, params, options) {
  var _this = this;
  var ids = [];
  options = options || {};
  var _options = JSData.DSUtils.deepMixIn({}, options);
  _options.multi = true;
  return _this.getClient().then(function (client) {
    var queryOptions = _this.getQueryOptions(resourceConfig, params);
    queryOptions.$set = attrs;
    var query = _this.getQuery(resourceConfig, params);
    return _this.findAll(resourceConfig, params, options).then(function (items) {
      ids = map(items, function (item) {
        return item[resourceConfig.idAttribute];
      });
      return new JSData.DSUtils.Promise(function (resolve, reject) {
        client.collection(resourceConfig.table || underscore(resourceConfig.name)).update(query, queryOptions, _options, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }).then(function () {
      var _params = {};
      _params[resourceConfig.idAttribute] = {
        'in': ids
      };
      return _this.findAll(resourceConfig, _params, options);
    });
  });
};

dsRethinkDBAdapterPrototype.destroy = function destroy(resourceConfig, id, options) {
  var _this = this;
  options = options || {};
  return _this.getClient().then(function (client) {
    return new JSData.DSUtils.Promise(function (resolve, reject) {
      var params = {};
      params[resourceConfig.idAttribute] = id;
      client.collection(resourceConfig.table || underscore(resourceConfig.name)).remove(params, options, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

dsRethinkDBAdapterPrototype.destroyAll = function destroyAll(resourceConfig, params, options) {
  var _this = this;
  options = options || {};
  return _this.getClient().then(function (client) {
    options = JSData.DSUtils.deepMixIn({}, options);
    JSData.DSUtils.deepMixIn(options, _this.getQueryOptions(resourceConfig, params));
    var query = _this.getQuery(resourceConfig, params);
    return new JSData.DSUtils.Promise(function (resolve, reject) {
      client.collection(resourceConfig.table || underscore(resourceConfig.name)).remove(query, options, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

module.exports = DSMongoDBAdapter;
