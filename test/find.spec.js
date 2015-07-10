var Promise = require('bluebird');
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
  it('should find a user with relations', function () {
    var id, id2, _user, _post, _comments;
    return adapter.create(User, { name: 'John' })
      .then(function (user) {
        _user = user;
        id = user._id;
        assert.equal(user.name, 'John');
        assert.isDefined(user._id);
        return adapter.find(User, user._id);
      })
      .then(function (user) {
        assert.equal(user.name, 'John');
        assert.isDefined(user._id);
        assert.equal(JSON.stringify(user), JSON.stringify({ _id: id, name: 'John' }));
        return adapter.create(Post, {
          content: 'test',
          userId: user._id
        });
      })
      .then(function (post) {
        _post = post;
        id2 = post._id;
        assert.equal(post.content, 'test');
        assert.isDefined(post._id);
        assert.isDefined(post.userId);
        return Promise.all([
          adapter.create(Comment, {
            content: 'test2',
            postId: post._id,
            userId: _user._id
          }),
          adapter.create(Comment, {
            content: 'test3',
            postId: post._id,
            userId: _user._id
          })
        ]);
      })
      .then(function (comments) {
        _comments = comments;
        _comments.sort(function (a, b) {
          return a.content > b.content;
        });
        return adapter.find(Post, _post._id, { with: ['user', 'comment'] });
      })
      .then(function (post) {
        post.comments.sort(function (a, b) {
          return a.content > b.content;
        });
        assert.equal(post.user._id, _user._id);
        assert.equal(post.user.name, _user.name);
        assert.deepEqual(JSON.parse(JSON.stringify(post.comments)), JSON.parse(JSON.stringify(_comments)));
        return adapter.destroyAll(Comment);
      })
      .then(function () {
        return adapter.destroy(Post, id2);
      })
      .then(function () {
        return adapter.destroy(User, id);
      })
      .then(function (user) {
        assert.isFalse(!!user);
        return adapter.find(User, id);
      })
      .then(function () {
        throw new Error('Should not have reached here!');
      })
      .catch(function (err) {
        assert.equal(err.message, 'Not Found!');
      });
  });
});
