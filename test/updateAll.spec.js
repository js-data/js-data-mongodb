describe('DSMongoDBAdapter#updateAll', function () {
  it('should update all items', function (done) {
    var id, id2;
    adapter.create(User, { name: 'John', age: 20 })
      .then(function (user) {
        id = user._id;
        return adapter.create(User, { name: 'John', age: 30 });
      }).then(function (user) {
        id2 = user._id;
        return adapter.findAll(User, {
          name: 'John'
        });
      }).then(function (users) {
        users.sort(function (a, b) {
          return a.age - b.age;
        });
        assert.deepEqual(users, [{ _id: id, name: 'John', age: 20 }, { _id: id2, name: 'John', age: 30 }]);
        return adapter.updateAll(User, {
          name: 'Johnny'
        }, {
          name: 'John'
        });
      }).then(function (users) {
        users.sort(function (a, b) {
          return a.age - b.age;
        });
        assert.deepEqual(users, [{ _id: id, name: 'Johnny', age: 20 }, { _id: id2, name: 'Johnny', age: 30 }]);
        return adapter.findAll(User, {
          name: 'John'
        });
      }).then(function (users) {
        assert.deepEqual(users, []);
        assert.equal(users.length, 0);
        return adapter.findAll(User, {
          name: 'Johnny'
        });
      }).then(function (users) {
        users.sort(function (a, b) {
          return a.age - b.age;
        });
        assert.deepEqual(users, [{ _id: id, name: 'Johnny', age: 20 }, { _id: id2, name: 'Johnny', age: 30 }]);
        return adapter.destroyAll(User);
      }).then(function (destroyedUser) {
        assert.isFalse(!!destroyedUser);
        done();
      }).catch(done);
  });
});
