<img src="https://raw.githubusercontent.com/js-data/js-data/master/js-data.png" alt="js-data logo" title="js-data" align="right" width="96" height="96" />

# js-data-mongodb

[![Slack Status][sl_b]][sl_l]
[![npm version][npm_b]][npm_l]
[![Circle CI][circle_b]][circle_l]
[![npm downloads][dn_b]][dn_l]
[![Coverage Status][cov_b]][cov_l]
[![Codacy][cod_b]][cod_l]

MongoDB adapter for [js-data](http://www.js-data.io/).

## Table of contents

* [Quick start](#quick-start)
* [Documentation](#documentation)
* [API Reference](#api-reference)
* [Support](#support)
* [Community](#community)
* [Contributing](#contributing)
* [License](#license)

## Quick Start
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

### Documentation
- [Getting Started with js-data](http://www.js-data.io/docs/home)
- [js-data-mongodb](http://www.js-data.io/docs/js-data-mongodb)
- [CHANGELOG.md](https://github.com/js-data/js-data-mongodb/blob/master/CHANGELOG.md)

## API Reference
- [js-data-mongodb](http://api.js-data.io/js-data-mongodb/)

## Support

Support questions are handled via [StackOverflow][so], [Slack][sl_l], and the
[Mailing List][ml]. Ask your questions there.

When submitting bug reports on GitHub, please include as much detail as possible
to make debugging quick and easy.

## Community
- [StackOverflow Channel][so]
- [Slack Chat][sl_l] [![Slack Status][sl_b]][sl_l]
- [Announcements](http://www.js-data.io/blog)
- [Mailing List](ml)
- [Issue Tracker](https://github.com/js-data/js-data-mongodb/issues)

## Contributing

See [CONTRIBUTING.md](https://github.com/js-data/js-data-mongodb/blob/master/CONTRIBUTING.md).

## License

The MIT License (MIT)

See [LICENSE](https://github.com/js-data/js-data-mongodb/blob/master/LICENSE).

[sl_b]: http://slack.js-data.io/badge.svg
[sl_l]: http://slack.js-data.io
[npm_b]: https://img.shields.io/npm/v/js-data-mongodb.svg?style=flat
[npm_l]: https://www.npmjs.org/package/js-data-mongodb
[circle_b]: https://img.shields.io/circleci/project/js-data/js-data-mongodb/master.svg?style=flat
[circle_l]: https://circleci.com/gh/js-data/js-data-mongodb/tree/master
[dn_b]: https://img.shields.io/npm/dm/js-data-mongodb.svg?style=flat
[dn_l]: https://www.npmjs.org/package/js-data-mongodb
[cov_b]: https://img.shields.io/coveralls/js-data/js-data-mongodb/master.svg?style=flat
[cov_l]: https://coveralls.io/github/js-data/js-data-mongodb?branch=master
[cod_b]: https://img.shields.io/codacy/1f45ede49dfb4bdea68f46ca55631968.svg
[cod_l]: https://www.codacy.com/app/jasondobry/js-data-mongodb/dashboard

[ml]: https://groups.io/org/groupsio/jsdata
[so]: http://stackoverflow.com/questions/tagged/jsdata
