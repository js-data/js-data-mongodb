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

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var MongoClient = __webpack_require__(1).MongoClient;

	var ObjectID = __webpack_require__(2).ObjectID;

	var JSData = _interopRequire(__webpack_require__(3));

	var underscore = _interopRequire(__webpack_require__(4));

	var keys = _interopRequire(__webpack_require__(5));

	var omit = _interopRequire(__webpack_require__(6));

	var map = _interopRequire(__webpack_require__(7));

	var isEmpty = _interopRequire(__webpack_require__(8));

	var DSUtils = JSData.DSUtils;
	var deepMixIn = DSUtils.deepMixIn;
	var forEach = DSUtils.forEach;
	var contains = DSUtils.contains;
	var isObject = DSUtils.isObject;
	var isString = DSUtils.isString;
	var copy = DSUtils.copy;
	var forOwn = DSUtils.forOwn;
	var removeCircular = DSUtils.removeCircular;

	var reserved = ["orderBy", "sort", "limit", "offset", "skip", "where"];

	var DSMongoDBAdapter = (function () {
	  function DSMongoDBAdapter(uri) {
	    _classCallCheck(this, DSMongoDBAdapter);

	    this.client = new DSUtils.Promise(function (resolve, reject) {
	      MongoClient.connect(uri, function (err, db) {
	        return err ? reject(err) : resolve(db);
	      });
	    });
	  }

	  _createClass(DSMongoDBAdapter, {
	    getClient: {
	      value: function getClient() {
	        return this.client;
	      }
	    },
	    getQuery: {
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
	                "==": v
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
	                "==": criteria
	              };
	            }
	            forOwn(criteria, function (v, op) {
	              if (op === "==" || op === "===") {
	                query[field] = v;
	              } else if (op === "!=" || op === "!==") {
	                query[field] = query[field] || {};
	                query[field].$ne = v;
	              } else if (op === ">") {
	                query[field] = query[field] || {};
	                query[field].$gt = v;
	              } else if (op === ">=") {
	                query[field] = query[field] || {};
	                query[field].$gte = v;
	              } else if (op === "<") {
	                query[field] = query[field] || {};
	                query[field].$lt = v;
	              } else if (op === "<=") {
	                query[field] = query[field] || {};
	                query[field].$lte = v;
	              } else if (op === "in") {
	                query[field] = query[field] || {};
	                query[field].$in = v;
	              } else if (op === "notIn") {
	                query[field] = query[field] || {};
	                query[field].$nin = v;
	              } else if (op === "|==" || op === "|===") {
	                query.$or = query.$or || [];
	                var orEqQuery = {};
	                orEqQuery[field] = v;
	                query.$or.push(orEqQuery);
	              } else if (op === "|!=" || op === "|!==") {
	                query.$or = query.$or || [];
	                var orNeQuery = {};
	                orNeQuery[field] = {
	                  $ne: v
	                };
	                query.$or.push(orNeQuery);
	              } else if (op === "|>") {
	                query.$or = query.$or || [];
	                var orGtQuery = {};
	                orGtQuery[field] = {
	                  $gt: v
	                };
	                query.$or.push(orGtQuery);
	              } else if (op === "|>=") {
	                query.$or = query.$or || [];
	                var orGteQuery = {};
	                orGteQuery[field] = {
	                  $gte: v
	                };
	                query.$or.push(orGteQuery);
	              } else if (op === "|<") {
	                query.$or = query.$or || [];
	                var orLtQuery = {};
	                orLtQuery[field] = {
	                  $lt: v
	                };
	                query.$or.push(orLtQuery);
	              } else if (op === "|<=") {
	                query.$or = query.$or || [];
	                var orLteQuery = {};
	                orLteQuery[field] = {
	                  $lte: v
	                };
	                query.$or.push(orLteQuery);
	              } else if (op === "|in") {
	                query.$or = query.$or || [];
	                var orInQuery = {};
	                orInQuery[field] = {
	                  $in: v
	                };
	                query.$or.push(orInQuery);
	              } else if (op === "|notIn") {
	                query.$or = query.$or || [];
	                var orNinQuery = {};
	                orNinQuery[field] = {
	                  $nin: v
	                };
	                query.$or.push(orNinQuery);
	              }
	            });
	          });
	        }

	        return query;
	      }
	    },
	    getQueryOptions: {
	      value: function getQueryOptions(resourceConfig, params) {
	        params = params || {};
	        params.orderBy = params.orderBy || params.sort;
	        params.skip = params.skip || params.offset;

	        var queryOptions = {};

	        if (params.orderBy) {
	          if (isString(params.orderBy)) {
	            params.orderBy = [[params.orderBy, "asc"]];
	          }
	          for (var i = 0; i < params.orderBy.length; i++) {
	            if (isString(params.orderBy[i])) {
	              params.orderBy[i] = [params.orderBy[i], "asc"];
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
	    },
	    find: {
	      value: function find(resourceConfig, id, options) {
	        options = options || {};
	        return this.getClient().then(function (client) {
	          return new DSUtils.Promise(function (resolve, reject) {
	            var params = {};
	            params[resourceConfig.idAttribute] = id;
	            if (resourceConfig.idAttribute === "_id" && typeof id === "string" && ObjectID.isValid(id)) {
	              params[resourceConfig.idAttribute] = ObjectID.createFromHexString(id);
	            }
	            client.collection(resourceConfig.table || underscore(resourceConfig.name)).findOne(params, options, function (err, r) {
	              if (err) {
	                reject(err);
	              } else if (!r) {
	                reject(new Error("Not Found!"));
	              } else {
	                r._id = r._id.valueOf();
	                resolve(r);
	              }
	            });
	          });
	        });
	      }
	    },
	    findAll: {
	      value: function findAll(resourceConfig, params, options) {
	        options = options ? copy(options) : {};
	        deepMixIn(options, this.getQueryOptions(resourceConfig, params));
	        var query = this.getQuery(resourceConfig, params);
	        return this.getClient().then(function (client) {
	          return new DSUtils.Promise(function (resolve, reject) {
	            client.collection(resourceConfig.table || underscore(resourceConfig.name)).find(query, options).toArray(function (err, r) {
	              if (err) {
	                reject(err);
	              } else {
	                r.forEach(function (_r) {
	                  _r._id = _r._id.valueOf();
	                });
	                resolve(r);
	              }
	            });
	          });
	        });
	      }
	    },
	    create: {
	      value: function create(resourceConfig, attrs, options) {
	        options = options || {};
	        attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
	        return this.getClient().then(function (client) {
	          return new DSUtils.Promise(function (resolve, reject) {
	            var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	            var method = collection.insertOne ? DSUtils.isArray(attrs) ? "insertMany" : "insertOne" : "insert";
	            collection[method](attrs, options, function (err, r) {
	              if (err) {
	                reject(err);
	              } else {
	                r = r.ops ? r.ops : r;
	                r.forEach(function (_r) {
	                  _r._id = _r._id.valueOf();
	                });
	                resolve(DSUtils.isArray(attrs) ? r : r[0]);
	              }
	            });
	          });
	        });
	      }
	    },
	    update: {
	      value: function update(resourceConfig, id, attrs, options) {
	        var _this = this;

	        attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
	        options = options || {};
	        return this.find(resourceConfig, id, options).then(function () {
	          return _this.getClient().then(function (client) {
	            return new DSUtils.Promise(function (resolve, reject) {
	              var params = {};
	              params[resourceConfig.idAttribute] = id;
	              var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	              collection[collection.updateOne ? "updateOne" : "update"](params, { $set: attrs }, options, function (err) {
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
	      }
	    },
	    updateAll: {
	      value: function updateAll(resourceConfig, attrs, params, options) {
	        var _this = this;

	        var ids = [];
	        attrs = removeCircular(omit(attrs, resourceConfig.relationFields || []));
	        options = options ? copy(options) : {};
	        var _options = copy(options);
	        _options.multi = true;
	        return this.getClient().then(function (client) {
	          var queryOptions = _this.getQueryOptions(resourceConfig, params);
	          queryOptions.$set = attrs;
	          var query = _this.getQuery(resourceConfig, params);
	          return _this.findAll(resourceConfig, params, options).then(function (items) {
	            ids = map(items, function (item) {
	              return item[resourceConfig.idAttribute];
	            });
	            return new DSUtils.Promise(function (resolve, reject) {
	              var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	              collection[collection.updateMany ? "updateMany" : "update"](query, queryOptions, _options, function (err) {
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
	              "in": ids
	            };
	            return _this.findAll(resourceConfig, _params, options);
	          });
	        });
	      }
	    },
	    destroy: {
	      value: function destroy(resourceConfig, id, options) {
	        options = options || {};
	        return this.getClient().then(function (client) {
	          return new DSUtils.Promise(function (resolve, reject) {
	            var params = {};
	            params[resourceConfig.idAttribute] = id;
	            var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	            collection[collection.deleteOne ? "deleteOne" : "remove"](params, options, function (err) {
	              if (err) {
	                reject(err);
	              } else {
	                resolve();
	              }
	            });
	          });
	        });
	      }
	    },
	    destroyAll: {
	      value: function destroyAll(resourceConfig, params, options) {
	        var _this = this;

	        options = options ? copy(options) : {};
	        return this.getClient().then(function (client) {
	          deepMixIn(options, _this.getQueryOptions(resourceConfig, params));
	          var query = _this.getQuery(resourceConfig, params);
	          return new DSUtils.Promise(function (resolve, reject) {
	            var collection = client.collection(resourceConfig.table || underscore(resourceConfig.name));
	            collection[collection.deleteMany ? "deleteMany" : "remove"](query, options, function (err) {
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
	  });

	  return DSMongoDBAdapter;
	})();

	module.exports = DSMongoDBAdapter;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("mongodb");

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("bson");

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("js-data");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("mout/string/underscore");

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("mout/object/keys");

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("mout/object/omit");

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("mout/array/map");

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("mout/lang/isEmpty");

/***/ }
/******/ ]);