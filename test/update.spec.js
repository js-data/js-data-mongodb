describe('DSMongoDBAdapter#update', function () {
  it('should update a user in MongoDB', function (done) {
    var id;
    adapter.create(User, { name: 'John' })
      .then(function (user) {
        id = user._id;
        assert.equal(user.name, 'John');
        assert.isDefined(user._id);
        return adapter.find(User, user._id);
      })
      .then(function (foundUser) {
        assert.equal(foundUser.name, 'John');
        assert.isDefined(foundUser._id);
        assert.deepEqual(foundUser, { _id: id, name: 'John' });
        return adapter.update(User, foundUser._id, { name: 'Johnny' });
      })
      .then(function (updatedUser) {
        assert.equal(updatedUser.name, 'Johnny');
        assert.isDefined(updatedUser._id);
        assert.deepEqual(updatedUser, { _id: id, name: 'Johnny' });
        return adapter.find(User, updatedUser._id);
      })
      .then(function (foundUser) {
        assert.equal(foundUser.name, 'Johnny');
        assert.isDefined(foundUser._id);
        assert.deepEqual(foundUser, { _id: id, name: 'Johnny' });
        return adapter.destroy(User, foundUser._id);
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
