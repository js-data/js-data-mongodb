##### 1.0.0-alpha.4 - 06 March 2016

Fixed JSDoc

##### 1.0.0-alpha.3 - 06 March 2016

###### Backwards compatible API changes
- Upgraded to latest js-data-adapter-tests, making appropriate changes

###### Other
- Extracted common adapter functionality into js-data-adapter
- Extracted common js-data repo utility scripts into js-data-repo-tools

##### 1.0.0-alpha.2 - 27 February 2016

###### Backwards compatible bug fixes
- Fixed use of options

##### 1.0.0-alpha.1 - 26 February 2016

###### Breaking API changes
- Now depends on js-data 3.x

###### Backwards compatible API changes
- Added createMany and updateMany methods
- Added lifecycle methods
- Added insertOpts, insertManyOpts, updateOpts, removeOpts, findOpts, and findOneOpts options

##### 0.7.0 - 19 February 2016

###### Backwards compatible API changes
- Decomposed eager loading functionality into overridable methods for greater flexibility
  - New methods: loadHasMany, loadBelongsTo, loadHasOne, makeBelongsToForeignKey, makeHasManyForeignKey, toObjectID
  - Example use case: Override makeBelongsToForeignKey because your foreignKeys are saved as ObjectIDs, but the default is to assume they are plain a string/number

###### Backwards compatible bug fixes
- #12 - eager loading relations doesn't check for ObjectID

###### Other
- Added some JSDoc comments
- Cleaned up some code style

##### 0.6.0 - 18 February 2016

- Upgraded dependencies
- Now using js-data-adapter-tests

##### 0.5.1 - 10 July 2015

###### Backwards compatible bug fixes
- Fix for loading relations in find() and findAll()

##### 0.5.0 - 10 July 2015

Upgraded dependencies

###### Backwards compatible API changes
- #4 - Add support for loading relations in find()
- #5 - Add support for loading relations in findAll()

##### 0.4.0 - 02 July 2015

Stable Version 0.4.0

Upgraded dependencies

##### 0.3.0 - 02 June 2015

###### Backwards compatible bug fixes
- #9 is really fixed now
- Upgraded dependencies

##### 0.2.3 - 07 April 2015

###### Backwards compatible bug fixes
- #Added better support for ObjectIds

##### 0.2.2 - 26 March 2015

###### Backwards compatible bug fixes
- Fix dependency

##### 0.2.1 - 26 March 2015

###### Backwards compatible bug fixes
- #2 - Should not be saving relations (duplicating data)
- #3 - Need to use removeCircular

##### 0.2.0 - 10 March 2015

###### Other
- #1 - Convert to ES6.

##### 0.1.0 - 18 February 2015

- Initial Release

##### 0.0.1 - 05 February 2015

- Initial Commit
