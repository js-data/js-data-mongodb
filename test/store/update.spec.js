describe('DS#update', function () {
  it('should update a user in MongoDB and inject the updated item into the store', function () {
    var id;
    return User.create({name: 'John'}, {cacheResponse: true})
      .then(function (user) {
        id = user._id;
        assert.equal(user.name, 'John');
        assert.isDefined(user._id);
        assert.isTrue(user === User.get(user._id));
        return User.find(user._id, {bypassCache: true, cacheResponse: true});
      })
      .then(function (foundUser) {
        assert.equal(foundUser.name, 'John');
        assert.isTrue(foundUser === User.get(id));
        assert.isDefined(foundUser._id);
        return User.update(foundUser._id, {name: 'Johnny'}, {cacheResponse: true});
      })
      .then(function (updatedUser) {
        assert.equal(updatedUser.name, 'Johnny');
        assert.isTrue(updatedUser === User.get(id));
        assert.isDefined(updatedUser._id);
        return User.find(updatedUser._id, {bypassCache: true, cacheResponse: true});
      })
      .then(function (foundUser) {
        assert.equal(foundUser.name, 'Johnny');
        assert.isTrue(foundUser === User.get(id));
        assert.isDefined(foundUser._id);
        return User.destroy(foundUser._id);
      })
      .then(function () {
        return User.find(id, {bypassCache: true}).catch(function (err) {
          assert.equal(err.message, 'Not Found!');
          assert.isUndefined(User.get(id));
        });
      });
  });
});
