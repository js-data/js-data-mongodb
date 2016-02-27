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
* [Guides and Tutorials](#guides-and-tutorials)
* [API Reference Docs](#api-reference-docs)
* [Community](#community)
* [Support](#support)
* [Contributing](#contributing)
* [License](#license)

## Quick Start
`npm install --save js-data js-data-mongodb mongodb bson`.

```js
// Use Container instead of DataStore on the server
import {Container} from 'js-data'
import MongoDBAdapter from 'js-data-mongodb'

// Create a store to hold your Mappers
const store = new Container({
  mapperDefaults: {
    // MongoDB uses "_id" as the primary key
    idAttribute: '_id'
  }
})

// Create an instance of MongoDBAdapter with default settings
const adapter = new MongoDBAdapter()

// Mappers in "store" will use the MongoDB adapter by default
store.registerAdapter('mongodb', adapter, { default: true })

// Create a Mapper that maps to a "user" collection
store.defineMapper('user')
```

```js
async function findAllAdminUsers () {
  // Find all users where "user.role" == "admin"
  return await store.findAll('user', {
    role: 'admin'
  })
}
```

## Guides and Tutorials

[Get started at http://js-data.io](http://js-data.io)

## API Reference Docs

[Visit http://api.js-data.io](http://api.js-data.io).

## Community

[Explore the Community](http://js-data.io/docs/community).

## Support

[Find out how to Get Support](http://js-data.io/docs/support).

## Contributing

[Read the Contributing Guide](http://js-data.io/docs/contributing).

## License

The MIT License (MIT)

Copyright (c) 2014-2016 js-data-mongodb project authors

* [LICENSE](https://github.com/js-data/js-data-mongodb/blob/master/LICENSE)
* [AUTHORS](https://github.com/js-data/js-data-mongodb/blob/master/AUTHORS)
* [CONTRIBUTORS](https://github.com/js-data/js-data-mongodb/blob/master/CONTRIBUTORS)

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
