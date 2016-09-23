let ObjectID = require('bson').ObjectID

describe('MongoDBAdapter', function () {
  var adapter

  beforeEach(function () {
    adapter = this.$$adapter
    // User = this.$$user
  })

  it('should translate ID ObjectIDs', function () {
    let objectID = new ObjectID()

    const record = {
      id: objectID,
      name: 'Jim'
    }

    const opts = {
      convertMongo_id: true
    }

    return assert.equal(typeof adapter._translateId(record, opts).id, 'string')
  })

  it('should translate an array ID ObjectIDs', function () {
    let objectID1 = new ObjectID()
    let objectID2 = new ObjectID()

    const records = [{
      id: objectID1,
      name: 'Jim'
    },
      {
        id: objectID2,
        name: 'Kim'
      }
    ]

    const opts = {
      translateObjectIDs: false,
      convertMongo_id: true
    }

    assert.equal(typeof adapter._translateId(records, opts)[0].id, 'string')
    assert.equal(typeof adapter._translateId(records, opts)[1].id, 'string')
    return
  })

  it('should translate ObjectID fields to string', function () {
    let objectID1 = new ObjectID()
    let objectID2 = new ObjectID()

    const record = {
      id: objectID1,
      name: 'Jim',
      relationRecord: objectID2
    }

    const opts = {
      translateObjectIDs: true,
      translateId: true
    }

    assert.equal(typeof adapter._translateObjectIDs(record, opts).relationRecord, 'string')
    assert.equal(typeof adapter._translateObjectIDs(record, opts).id, 'string')
    return
  })
})
