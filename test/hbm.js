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
  , hbm
  ;

describe('memoizing templates', function () {
  before(function () {
    hbm = proxyquire.resolve('../hbm', __dirname, { fs: fsStub, handlebars: hbStub } );
  })

  describe('when no plates are found in plates path', function () {
    before(function () {
      fsStub.readdir = function (p, cb) { cb(null, [ 'notplate', 'neither.js' ]); }
    })    

    it('memoize registers no handledbars', function (done) {
      hbm.memoize({ root: root, templates: platesPath }, function (err) {
        assert.equal(err, null);
        assert.equal(Object.keys(hbm.handledbars).length, 0);
        done();
      });
    })
  })

  describe('when plates are found in plates path', function () {
    var plateuno =  'plateuno.hbs'
      , platedos =  'platedos.hbs'
      , contuno  =  'contuno'
      , contdos  =  'contdos'
      , memuno   =  'memuno'
      , memdos   =  'memdos';

    before(function () {
      fsStub.readdir =  function (p, cb) { 
        if (p == path.join(root, platesPath)) cb(null, [ plateuno, platedos  ]);
        else cb(new Error('No setup for this path ' + p));
      }

      fsStub.readFile = function (p, cb) { 
        var content;
        if (path.basename(p) == plateuno) { 
          cb(null, contentuno);
        } else if (path.basename(p) == platedos) {
          cb(null, contentdos);
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
   
    it('adds adds handled bar for each plate under its name', function (done) {
      hbm.memoize({ root: root, templates: platesPath }, function (err) {
        assert.equal(err, null);
        assert.equal(hbm.handled['plateuno'], memuno);
        assert.equal(hbm.handled['platedos'], memdos);
        done();
      })
    })

  })
})
