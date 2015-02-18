describe('DSMongoDBAdapter#destroy', function () {
  it('should destroy a user from MongoDB', function (done) {
    var id;
    adapter.create(User, { name: 'John' })
      .then(function (user) {
        id = user._id;
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
