<img src="https://raw.githubusercontent.com/js-data/js-data/master/js-data.png" alt="js-data logo" title="js-data" align="right" width="64" height="64" />

## js-data-mongodb [![npm version](https://img.shields.io/npm/v/js-data-mongodb.svg?style=flat-square)](https://www.npmjs.org/package/js-data-mongodb) [![Circle CI](https://img.shields.io/circleci/project/js-data/js-data-mongodb/master.svg?style=flat-square)](https://circleci.com/gh/js-data/js-data-mongodb/tree/master) [![npm downloads](https://img.shields.io/npm/dm/js-data-mongodb.svg?style=flat-square)](https://www.npmjs.org/package/js-data-mongodb) [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/js-data/js-data-mongodb/blob/master/LICENSE)

MongoDB adapter for [js-data](http://www.js-data.io/).

### API Documentation
[DSMongoDBAdapter](http://www.js-data.io/docs/dsmongodbadapter)

### Project Status

__Latest Release:__ [![Latest Release](https://img.shields.io/github/release/js-data/js-data-mongodb.svg?style=flat-square)](https://github.com/js-data/js-data-mongodb/releases)

__Status:__

[![Dependency Status](https://img.shields.io/gemnasium/js-data/js-data-mongodb.svg?style=flat-square)](https://gemnasium.com/js-data/js-data-mongodb) [![Codacity](https://img.shields.io/codacy/1f45ede49dfb4bdea68f46ca55631968.svg?style=flat-square)](https://www.codacy.com/public/jasondobry/js-data-mongodb/dashboard)

__Supported Platforms:__

[![node version](https://img.shields.io/badge/Node-0.10%2B-green.svg?style=flat-square)](https://github.com/js-data/js-data)

### Quick Start
`npm install --save js-data js-data-mongodb`.

```js
var JSData = require('js-data');
var DSMongoDBAdapter = require('js-data-mongodb');

var store = new JSData.DS();
var adapter = new DSMongoDBAdapter('mongodb://localhost:27017');

// "store" will now use the MongoDB adapter for all async operations
store.registerAdapter('mongodb', adapter, { default: true });

var User = store.defineResource({
  // Why couldn't Mongo just use "id"?
  idAttribute: '_id',

  // map this resource to a collection, default is Resource#name
  table: 'users'
});
```

### Changelog
[CHANGELOG.md](https://github.com/js-data/js-data-mongodb/blob/master/CHANGELOG.md)

### Community
- [Gitter Channel](https://gitter.im/js-data/js-data) - Better than IRC!
- [Announcements](http://www.js-data.io/blog)
- [Mailing List](https://groups.io/org/groupsio/jsdata) - Ask your questions!
- [Issues](https://github.com/js-data/js-data-mongodb/issues) - Found a bug? Feature request? Submit an issue!
- [GitHub](https://github.com/js-data/js-data-mongodb) - View the source code for js-data.
- [Contributing Guide](https://github.com/js-data/js-data-mongodb/blob/master/CONTRIBUTING.md)

### Contributing

First, support is handled via the [Mailing List](https://groups.io/org/groupsio/jsdata). Ask your questions there.

When submitting issues on GitHub, please include as much detail as possible to make debugging quick and easy.

- good - Your versions of js-data, js-data-mongodb, etc., relevant console logs/error, code examples that revealed the issue
- better - A [plnkr](http://plnkr.co/), [fiddle](http://jsfiddle.net/), or [bin](http://jsbin.com/?html,output) that demonstrates the issue
- best - A Pull Request that fixes the issue, including test coverage for the issue and the fix

[Github Issues](https://github.com/js-data/js-data-mongodb/issues).

#### Pull Requests

1. Contribute to the issue that is the reason you'll be developing in the first place
1. Fork js-data-mongodb
1. `git clone https://github.com/<you>/js-data-mongodb.git`
1. `cd js-data-mongodb; npm install; bower install;`
1. `grunt go` (builds and starts a watch)
1. (in another terminal) `grunt karma:dev` (runs the tests)
1. Write your code, including relevant documentation and tests
1. Submit a PR and we'll review

### License

The MIT License (MIT)

Copyright (c) 2014-2015 Jason Dobry

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
