describe('MongoDBAdapter#update', function () {
  var adapter

  beforeEach(function () {
    adapter = this.$$adapter
    // User = this.$$user
  })

  it('should not support updateMany', function () {
    return assert.throws(adapter.updateMany)
  })
})
