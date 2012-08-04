/*jshint asi:true*/
/*global describe before beforeEach it */

var assert     =  require('assert')
  , proxyquire =  require('proxyquire')
  , handlebars =  require('handlebars')
  , path       =  require('path')
  , fsStub     =  { }
  , hbStub     =  { }
  , root       =  'some root'
  , platesPath =  'some path'
  , hbs
  ;

describe('memoizing templates', function () {
  before(function () {
    hbs = proxyquire.resolve('../hbs', __dirname, { fs: fsStub, handlebars: hbStub } );
  })

  describe('when no plates are found in plates path', function () {
    before(function () {
      fsStub.readdir = function (p, cb) { cb(null, [ 'notplate', 'neither.js' ]); }
    })    

    it('store registers no handledbars', function (done) {
      hbs.store({ root: root, templates: platesPath }, function (err) {
        assert.equal(err, null);
        assert.equal(Object.keys(hbs.handledbars).length, 0);
        done();
      });
    })
  })

  describe('when looking for plates', function () {
    var plateuno     =  'plateuno.hbs'
      , platedos     =  'platedos.hbs'
      , contuno      =  'contuno'
      , contdos      =  'contdos'
      , memuno       =  'memuno'
      , memdos       =  'memdos'
      , platesFiles  =  [ plateuno, platedos ]
      , noPlatesFiles=  [ './somedir', 'somefile', 'some.js' ]
      , mixedFiles   =  noPlatesFiles.concat(platesFiles)
      ;

    before(function () {
      fsStub.readFile = function (p, cb) { 
        var content;
        if (path.basename(p) == plateuno) { 
          cb(null, contuno);
        } else if (path.basename(p) == platedos) {
          cb(null, contdos);
        } else {
          cb(new Error('Not setup for this plate ' + p));
        }
      }

      hbStub.compile = function(cont) {
        if (cont == contuno) return memuno;
        if(cont == contdos) return memdos;
        throw new Error('Not setup for this content ' + c);
      }
    })

    beforeEach(function () {
      hbs.reset();
    })
    
    describe('when only plates are found in plates path', function () {

      before(function () {
        fsStub.readdir =  function (p, cb) { 
          if (p === path.join(root, platesPath)) cb(null, platesFiles);
          else cb(new Error('No setup for this path ' + p));
        }
      })

      it('returns no error', function (done) {
        hbs.store({ root: root, templates: platesPath }, function (err) {
          assert.equal(err, null);
          done();
        })
      })
    
      it('adds handledbar for each plate under its name', function (done) {
        hbs.store({ root: root, templates: platesPath }, function (err) {
          assert.equal(Object.keys(hbs.handledbars).length, 2);
          assert.equal(hbs.handledbars['plateuno'], memuno);
          assert.equal(hbs.handledbars['platedos'], memdos);
          done();
        })
      })
    })

    describe('when no plates are found in plates path', function () {

      before(function () {
        fsStub.readdir =  function (p, cb) { 
          if (p === path.join(root, platesPath)) cb(null, noPlatesFiles);
          else cb(new Error('No setup for this path ' + p));
        }
      })

      it('returns no error', function (done) {
        hbs.store({ root: root, templates: platesPath }, function (err) {
          assert.equal(err, null);
          done();
        })
      })
    
      it('adds no handledbar', function (done) {
        hbs.store({ root: root, templates: platesPath }, function (err) {
          assert.equal(Object.keys(hbs.handledbars).length, 0);
          done();
        })
      })
    })

    describe('when plates and other files are found in plates path', function () {

      before(function () {
        fsStub.readdir =  function (p, cb) { 
          if (p === path.join(root, platesPath)) cb(null, mixedFiles);
          else cb(new Error('No setup for this path ' + p));
        }
      })

      it('returns no error', function (done) {
        hbs.store({ root: root, templates: platesPath }, function (err) {
          assert.equal(err, null);
          done();
        })
      })
    
      it('adds only handledbar for each plate under its name', function (done) {
        hbs.store({ root: root, templates: platesPath }, function (err) {
          assert.equal(Object.keys(hbs.handledbars).length, 2);
          assert.equal(hbs.handledbars['plateuno'], memuno);
          assert.equal(hbs.handledbars['platedos'], memdos);
          done();
        })
      })
    })
  })
})
