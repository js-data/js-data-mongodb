var Promise = require('bluebird');
describe('DSMongoDBAdapter#findAll', function () {
  it('should filter users', function () {
    var id;

    return adapter.findAll(User, {
      age: 30
    }).then(function (users) {
      assert.equal(users.length, 0);
      return adapter.create(User, { name: 'John' });
    }).then(function (user) {
      id = user._id;
      return adapter.findAll(User, {
        name: 'John'
      });
    }).then(function (users) {
      assert.equal(users.length, 1);
      assert.deepEqual(users[0], { _id: id, name: 'John' });
      return adapter.destroy(User, id);
    }).then(function (destroyedUser) {
      assert.isFalse(!!destroyedUser);
    });
  });
  it('should filter users using the "in" operator', function () {
    var id;

    return adapter.findAll(User, {
      where: {
        age: {
          'in': [30]
        }
      }
    }).then(function (users) {
      assert.equal(users.length, 0);
      return adapter.create(User, { name: 'John' });
    }).then(function (user) {
      id = user._id;
      return adapter.findAll(User, {
        name: 'John'
      });
    }).then(function (users) {
      assert.equal(users.length, 1);
      assert.deepEqual(users[0], { _id: id, name: 'John' });
      return adapter.destroy(User, id);
    }).then(function (destroyedUser) {
      assert.isFalse(!!destroyedUser);
    });
  });
  it('should load belongsTo relations', function () {
    return adapter.create(Profile, {
      email: 'foo@test.com'
    }).then(function (profile) {
      return Promise.all([
        adapter.create(User, {name: 'John', profileId: profile._id}).then(function (user) {
          return adapter.create(Post, {content: 'foo', userId: user._id});
        }),
        adapter.create(User, {name: 'Sally'}).then(function (user) {
          return adapter.create(Post, {content: 'bar', userId: user._id});
        })
      ])
    })
      .spread(function (post1, post2) {
        return Promise.all([
          adapter.create(Comment, {
            content: 'test2',
            postId: post1._id,
            userId: post1.userId
          }),
          adapter.create(Comment, {
            content: 'test3',
            postId: post2._id,
            userId: post2.userId
          })
        ]);
      })
      .then(function () {
        return adapter.findAll(Comment, {}, {'with': ['user', 'user.profile', 'post', 'post.user']});
      })
      .then(function (comments) {
        assert.isDefined(comments[0].post);
        assert.isDefined(comments[0].post.user);
        assert.isDefined(comments[0].user);
        assert.isDefined(comments[0].user.profile || comments[1].user.profile);
        assert.isDefined(comments[1].post);
        assert.isDefined(comments[1].post.user);
        assert.isDefined(comments[1].user);
      });
  });
  it('should load hasMany and belongsTo relations', function () {
    return adapter.create(Profile, {
      email: 'foo@test.com'
    }).then(function (profile) {
      return Promise.all([
        adapter.create(User, {name: 'John', profileId: profile._id}).then(function (user) {
          return adapter.create(Post, {content: 'foo', userId: user._id});
        }),
        adapter.create(User, {name: 'Sally'}).then(function (user) {
          return adapter.create(Post, {content: 'bar', userId: user._id});
        })
      ]);
    })
      .spread(function (post1, post2) {
        return Promise.all([
          adapter.create(Comment, {
            content: 'test2',
            postId: post1._id,
            userId: post1.userId
          }),
          adapter.create(Comment, {
            content: 'test3',
            postId: post2._id,
            userId: post2.userId
          })
        ]);
      })
      .then(function () {
        return adapter.findAll(Post, {}, {'with': ['user', 'comment', 'comment.user', 'comment.user.profile']});
      })
      .then(function (posts) {
        assert.isDefined(posts[0].comments);
        assert.isDefined(posts[0].comments[0].user);
        assert.isDefined(posts[0].comments[0].user.profile || posts[1].comments[0].user.profile);
        assert.isDefined(posts[0].user);
        assert.isDefined(posts[1].comments);
        assert.isDefined(posts[1].comments[0].user);
        assert.isDefined(posts[1].user);
      });
  });
});
