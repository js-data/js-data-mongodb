describe('DS#create', function () {
  it('should create a user in MongoDB and inject it into the store', function () {
    var id;
    return User.create({name: 'John'}, {cacheResponse: true}).then(function (user) {
      id = user._id;
      assert.equal(user.name, 'John');
      assert.isDefined(user._id);
      assert.isTrue(user === User.get(user._id));
      return User.find(user._id, {bypassCache: true, cacheResponse: true});
    })
      .then(function (user) {
        assert.equal(user.name, 'John');
        assert.isDefined(user._id);
        assert.strictEqual(user, User.get(user._id));
        return User.destroy(user._id);
      })
      .then(function () {
        return User.find(id, {bypassCache: true}).catch(function (err) {
          assert.equal(err.message, 'Not Found!');
        });
      });
  });
});
