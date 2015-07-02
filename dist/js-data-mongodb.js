module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var mongodb = __webpack_require__(1);
	var MongoClient = mongodb.MongoClient;
	var bson = __webpack_require__(2);
	var ObjectID = bson.ObjectID;
	var JSData = __webpack_require__(3);
	var underscore = __webpack_require__(4);
	var map = __webpack_require__(5);
	var DSUtils = JSData.DSUtils;
	var keys = DSUtils.keys;
	var omit = DSUtils.omit;
	var isEmpty = DSUtils.isEmpty;
	var deepMixIn = DSUtils.deepMixIn;
	var forEach = DSUtils.forEach;
	var contains = DSUtils.contains;
	var isObject = DSUtils.isObject;
	var isString = DSUtils.isString;
	var copy = DSUtils.copy;
	var forOwn = DSUtils.forOwn;
	var removeCircular = DSUtils.removeCircular;

	var reserved = ['orderBy', 'sort', 'limit', 'offset', 'skip', 'where'];

	var Defaults = function Defaults() {
	  _classCallCheck(this, Defaults);
	};

	Defaults.prototype.translateId = true;

	var DSMongoDBAdapter = (function () {
	  function DSMongoDBAdapter(uri) {
	    _classCallCheck(this, DSMongoDBAdapter);

	    if (typeof uri === 'string') {
	      uri = { uri: uri };
	    }
	    this.defaults = new Defaults();
	    deepMixIn(this.defaults, uri);
	    this.client = new DSUtils.Promise(function (resolve, reject) {
	      MongoClient.connect(uri.uri, function (err, db) {
	        return err ? reject(err) : resolve(db);
	      });
	    });
	  }

	  _createClass(DSMongoDBAdapter, [{
	    key: 'getClient',
	    value: function getClient() {
	      return this.client;
	    }
	  }, {
	    key: 'getQuery',
	    value: function getQuery(resourceConfig, params) {
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
	    }
	  }, {
	    key: 'getQueryOptions',
	    value: function getQueryOptions(resourceConfig, params) {
	      params = params || {};
	      params.orderBy = params.orderBy || params.sort;
	      params.skip = params.skip || params.offset;

	      var queryOptions = {};

	      if (params.orderBy) {
	        if (isString(params.orderBy)) {
	          params.orderBy = [[params.orderBy, 'asc']];
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
	  }, {
	    key: 'translateId',
	    value: function translateId(r, options) {
	      options = options || {};
	      if (typeof options.translateId === 'boolean' ? options.translateId : this.defaults.translateId) {
	        if (Array.isArray(r)) {
	          r.forEach(function (_r) {
	            var __id = _r._id ? _r._id.toString() : _r._id;
	            _r._id = typeof __id === 'string' ? __id : _r._id;
	          });
	        } else if (DSUtils.isObject(r)) {
	          var __id = r._id ? r._id.toString() : r._id;
	          r._id = typeof __id === 'string' ? __id : r._id;
	        }
	      }
	      return r;
	    }
	  }, {
	    key: 'origify',
	    value: function origify(options) {
	      options = options || {};
	      if (typeof options.orig === 'function') {
	        return options.orig();
	      }
	      return options;
	    }
	  }, {
	    key: 'find',
	    value: function find(resourceConfig, id, options) {
	      var _this = this;

	      options = this.origify(options);
	      return this.getClient().then(function (client) {
	        return new DSUtils.Promise(function (resolve, reject) {
	          var params = {};
	          params[resourceConfig.idAttribute] = id;
	          if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
	            params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id);
	          }
	          options.fields = options.fields || {};
	          client.collection(resourceConfig.table || underscore(resourceConfig.name)).findOne(params, options, function (err, r) {
	            if (err) {
	              reject(err);
	            } else if (!r) {
	              reject(new Error('Not Found!'));
	            } else {
	              resolve(_this.translateId(r, options));
	            }
	          });
	        });
	      });
	    }
	  }, {
	    key: 'findAll',
	    value: function findAll(resourceConfig, params, options) {
	      var _this2 = this;

	      options = this.origify(options ? copy(options) : {});
	      deepMixIn(options, this.getQueryOptions(resourceConfig, params));
	      var query = this.getQuery(resourceConfig, params);
	      return this.getClient().then(function (client) {
	        return new DSUtils.Promise(function (resolve, reject) {
	          options.fields = options.fields || {};
	          client.collection(resourceConfig.table || underscore(resourceConfig.name)).find(query, options).toArray(function (err, r) {
	            if (err) {
	              reject(err);
	            } else {
	              resolve(_this2.translateId(r, options));
	            }
	          });
	        });
	      });
	    }
	  }, {
	    key: 'create',
	    value: function create(resourceConfig, attrs, options) {
	      var _this3 = this;

	      options = this.origify(options);
	      attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
	      return this.getClient().then(function (client) {
	        return new DSUtils.Promise(function (resolve, reject) {
	          var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	          var method = collection.insertOne ? DSUtils.isArray(attrs) ? 'insertMany' : 'insertOne' : 'insert';
	          collection[method](attrs, options, function (err, r) {
	            if (err) {
	              reject(err);
	            } else {
	              r = r.ops ? r.ops : r;
	              _this3.translateId(r, options);
	              resolve(DSUtils.isArray(attrs) ? r : r[0]);
	            }
	          });
	        });
	      });
	    }
	  }, {
	    key: 'update',
	    value: function update(resourceConfig, id, attrs, options) {
	      var _this4 = this;

	      attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
	      options = this.origify(options);
	      return this.find(resourceConfig, id, options).then(function () {
	        return _this4.getClient();
	      }).then(function (client) {
	        return new DSUtils.Promise(function (resolve, reject) {
	          var params = {};
	          params[resourceConfig.idAttribute] = id;
	          if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
	            params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id);
	          }
	          var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	          collection[collection.updateOne ? 'updateOne' : 'update'](params, { $set: attrs }, options, function (err) {
	            if (err) {
	              reject(err);
	            } else {
	              resolve();
	            }
	          });
	        });
	      }).then(function () {
	        return _this4.find(resourceConfig, id, options);
	      });
	    }
	  }, {
	    key: 'updateAll',
	    value: function updateAll(resourceConfig, attrs, params, options) {
	      var _this5 = this;

	      var ids = [];
	      attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
	      options = this.origify(options ? copy(options) : {});
	      var _options = copy(options);
	      _options.multi = true;
	      return this.getClient().then(function (client) {
	        var queryOptions = _this5.getQueryOptions(resourceConfig, params);
	        queryOptions.$set = attrs;
	        var query = _this5.getQuery(resourceConfig, params);
	        return _this5.findAll(resourceConfig, params, options).then(function (items) {
	          ids = map(items, function (item) {
	            var id = item[resourceConfig.idAttribute];
	            if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
	              return ObjectID.createFromHexString(id);
	            }
	            return id;
	          });
	          return new DSUtils.Promise(function (resolve, reject) {
	            var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	            collection[collection.updateMany ? 'updateMany' : 'update'](query, queryOptions, _options, function (err) {
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
	          return _this5.findAll(resourceConfig, _params, options);
	        });
	      });
	    }
	  }, {
	    key: 'destroy',
	    value: function destroy(resourceConfig, id, options) {
	      options = this.origify(options);
	      return this.getClient().then(function (client) {
	        return new DSUtils.Promise(function (resolve, reject) {
	          var params = {};
	          params[resourceConfig.idAttribute] = id;
	          if (resourceConfig.idAttribute === '_id' && typeof id === 'string' && ObjectID.isValid(id)) {
	            params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id);
	          }
	          var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	          collection[collection.deleteOne ? 'deleteOne' : 'remove'](params, options, function (err) {
	            if (err) {
	              reject(err);
	            } else {
	              resolve();
	            }
	          });
	        });
	      });
	    }
	  }, {
	    key: 'destroyAll',
	    value: function destroyAll(resourceConfig, params, options) {
	      var _this6 = this;

	      options = this.origify(options ? copy(options) : {});
	      return this.getClient().then(function (client) {
	        deepMixIn(options, _this6.getQueryOptions(resourceConfig, params));
	        var query = _this6.getQuery(resourceConfig, params);
	        return new DSUtils.Promise(function (resolve, reject) {
	          var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	          collection[collection.deleteMany ? 'deleteMany' : 'remove'](query, options, function (err) {
	            if (err) {
	              reject(err);
	            } else {
	              resolve();
	            }
	          });
	        });
	      });
	    }
	  }]);

	  return DSMongoDBAdapter;
	})();

	exports['default'] = DSMongoDBAdapter;
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("mongodb");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("bson");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("js-data");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("mout/string/underscore");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("mout/array/map");

/***/ }
/******/ ]);