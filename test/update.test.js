describe('MongoDBAdapter#find', function () {
  var adapter

  // create a record to test update against
  before(function () {
    var id

    return this.$$adapter.findAll(this.$$User, {
      name: 'John'
    }).then(function (users) {
      assert.equal(users.length, 0)
      return this.$$adapter.create(this.$$User, {name: 'John'})
    }).then(function (user) {
      id = user._id
      return this.$$adapter.find(this.$$User, id.toString())
    }).then(function (user) {
      assert.objectsEqual(user, {_id: id, name: 'John'})
    })
  })

  beforeEach(function () {
    adapter = this.$$adapter
  })

  it('should not support updateMany', function () {
    return assert.throws(adapter.updateMany)
  })
})
