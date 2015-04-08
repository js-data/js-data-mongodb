describe('DSMongoDBAdapter#destroy', function () {
  it('should destroy a user from MongoDB', function () {
    var id;
    return adapter.create(User, { name: 'John' })
      .then(function (user) {
        id = user._id;
        return adapter.destroy(User, user._id);
      })
      .then(function (user) {
        assert.isFalse(!!user);
        return adapter.find(User, id).catch(function (err) {
          assert.equal(err.message, 'Not Found!');
        });
      });
  });
});
