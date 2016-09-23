let ObjectID = require('bson').ObjectID

describe('MongoDBAdapter#find', function () {
  var adapter, User

  beforeEach(function () {
    adapter = this.$$adapter
    User = this.$$User
  })

  it('should find a user by its bson ObjectId hex string', function () {
    var id

    return adapter.findAll(User, {
      name: 'John'
    }).then(function (users) {
      assert.equal(users.length, 0)
      return adapter.create(User, {name: 'John'})
    }).then(function (user) {
      id = user.id
      return adapter.find(User, id.toString())
    }).then(function (user) {
      assert.objectsEqual(user, {id: id, name: 'John'})
    })
  })

  it('should not convert id if it is not a valid bson ObjectId hex string', function () {
    var id

    return adapter.findAll(User, {
      name: 'John'
    }).then(function (users) {
      assert.equal(users.length, 0)
      return adapter.create(User, { id: '1', name: 'John' })
    }).then(function (user) {
      id = user.id
      assert.equal(typeof id, 'string')
      return adapter.find(User, id)
    }).then(function (user) {
      assert.objectsEqual(user, { id: id, name: 'John' })
    })
  })

  it('should convert fields in records that are ObjectID bson type', function () {
    var id

    ObjectID = new ObjectID()

    return adapter.findAll(User, {
      name: 'John'
    }).then(function (users) {
      assert.equal(users.length, 0)
      return adapter.create(User, { bsonField: ObjectID })
    }).then(function (user) {
      id = user.id
      assert.equal(typeof id, 'string')
      return adapter.find(User, id)
    }).then(function (user) {
      assert.objectsEqual(user, { id: id, bsonField: ObjectID.toString() })
    })
  })

  it('should use orderBy array', function () {
    var id

    return adapter.findAll(User, {
      name: 'John'
    }).then(function (users) {
      assert.equal(users.length, 0)
      return adapter.create(User, { id: '1', name: 'John' })
    }).then(function (user) {
      id = user.id
      assert.equal(typeof id, 'string')
      return adapter.findAll(User, {where: {id: id}, orderBy: ['name', 'asc']})
    }).then(function (userList) {
      assert.objectsEqual(userList, [{ id: id, name: 'John' }])
    })
  })

  it('should use orderBy string', function () {
    var id

    return adapter.findAll(User, {
      name: 'John'
    }).then(function (users) {
      assert.equal(users.length, 0)
      return adapter.create(User, { id: '1', name: 'John' })
    }).then(function (user) {
      id = user.id
      assert.equal(typeof id, 'string')
      return adapter.findAll(User, {where: {id: id}, orderBy: 'name'})
    }).then(function (userList) {
      assert.objectsEqual(userList, [{ id: id, name: 'John' }])
    })
  })

  it('should allow use of node-mongodb-native via adapter.client', function () {
    adapter.client.then((db) => {
      assert.ok(db.collection('user'))
    })
    .catch((err) => {
      throw new Error(err)
    })
  })
})
