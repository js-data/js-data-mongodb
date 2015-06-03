describe('DSMongoDBAdapter#find', function () {
  it('should find a user by its bson ObjectId hex string', function () {
    var id;

    return adapter.findAll(User, {
      name: 'John'
    }).then(function (users) {
      assert.equal(users.length, 0);
      return adapter.create(User, {name: 'John'});
    }).then(function (user) {
      id = user._id;
      return adapter.find(User, id.toString());
    }).then(function (user) {
      assert.deepEqual(user, {_id: id, name: 'John'});
      return adapter.destroy(User, id);
    }).then(function (destroyedUser) {
      assert.isFalse(!!destroyedUser);
    });
  });

  it('should not convert id if it is not a valid bson ObjectId hex string', function () {
    var id;

    return adapter.findAll(User, {
      name: 'John'
    }).then(function (users) {
      assert.equal(users.length, 0);
      return adapter.create(User, {_id: '1', name: 'John'});
    }).then(function (user) {
      id = user._id;
      assert.equal(typeof id, 'string');
      return adapter.find(User, id);
    }).then(function (user) {
      assert.deepEqual(user, {_id: id, name: 'John'});
      return adapter.destroy(User, id);
    }).then(function (destroyedUser) {
      assert.isFalse(!!destroyedUser);
    });
  });
});
