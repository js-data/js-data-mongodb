describe('DSMongoDBAdapter#create', function () {
  it('should create a user in MongoDB', function (done) {
    var id;
    adapter.create(User, { name: 'John' }).then(function (user) {
      id = user._id;
      assert.equal(user.name, 'John');
      assert.isDefined(user._id);
      return adapter.find(User, user._id);
    })
      .then(function (user) {
        assert.equal(user.name, 'John');
        assert.isDefined(user._id);
        assert.deepEqual(user, { _id: id, name: 'John' });
        return adapter.destroy(User, user._id);
      })
      .then(function (user) {
        assert.isFalse(!!user);
        return adapter.find(User, id);
      })
      .then(function () {
        done('Should not have reached here!');
      })
      .catch(function (err) {
        assert.equal(err.message, 'Not Found!');
        done();
      });
  });
});
