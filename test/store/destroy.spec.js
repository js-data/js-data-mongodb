describe('DS#destroy', function () {
  it('should destroy a user from MongoDB and eject it from the store', function () {
    var id;
    return User.create({name: 'John'}, {cacheResponse: true})
      .then(function (user) {
        id = user._id;
        assert.equal(user.name, 'John');
        assert.isDefined(user._id);
        assert.isTrue(user === User.get(user._id));
        return User.destroy(user._id);
      })
      .then(function () {
        assert.isUndefined(User.get(id));
        return User.find(id, {bypassCache: true}).catch(function (err) {
          assert.equal(err.message, 'Not Found!');
        });
      });
  });
});
