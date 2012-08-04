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
  , readdirpOpts = []
  , heatOpts = { 
        templates: {
          root            :  'some plates root'
        , directoryFilter :  'some plates directoryFilter'
        }
      , partials: {
          root            :  'some partials root'
        , directoryfilter :  'some partials directoryfilter'
        }
      }
  ;

function resolve (stubOpts) {
  return proxyquire.resolve('../hotplates', __dirname, { 
      fs         :  fsStub
    , handlebars :  hbStub
    , readdirp   :  function (opts, cb) {
        readdirpOpts.push(opts);
        cb(stubOpts.rdp.err, stubOpts.rdp); 
      }
    });
}

describe('when looking for plates and partials', function () {
  before(function (done) {
    resolve( { rdp: { files: [], err: null } } ).heat(heatOpts, done);
  })

  it('passes correct templates opts to readdirp', function () {
    var templateOpts = readdirpOpts.shift();
    assert.equal(templateOpts.root            ,  heatOpts.templates.root);
    assert.equal(templateOpts.directoryFilter ,  heatOpts.templates.directoryFilter);
    assert.equal(templateOpts.fileFilter[0]   ,  '*.hbs');
    assert.equal(templateOpts.fileFilter[1]   ,  '*.handlebars');
  })

  it('passes correct partials opts to readdirp', function () {
    var partialOpts = readdirpOpts.shift();
    assert.equal(partialOpts.root            ,  heatOpts.partials.root);
    assert.equal(partialOpts.directoryFilter ,  heatOpts.partials.directoryFilter);
    assert.equal(partialOpts.fileFilter[0]   ,  '*.hbs');
    assert.equal(partialOpts.fileFilter[1]   ,  '*.handlebars');
  })
})

describe('storing templates', function () {

  describe('when plates are found in plates path', function () {

    var plateuno         =  'plateuno.hbs'
      , plateunoFullPath =  '/path/plateuno.hbs'
      , platedos         =  'platedos.hbs'
      , platedosFullPath =  '/path/platedos.hbs'
      , contuno          =  'contuno'
      , contdos          =  'contdos'
      , memuno           =  'memuno'
      , memdos           =  'memdos'
      , platesFiles      =  [
          { name      :  plateuno
          , parentDir :  ''
          , fullPath  :  plateunoFullPath
          }
        , { name      :  platedos
          , parentDir :  ''
          , fullPath  :  platedosFullPath
          }
        ]
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

      hbs = resolve({ rdp: { files: platesFiles } })
    })

    it('returns no error', function (done) {
      hbs.heat(heatOpts, function (err) {
        assert.equal(err, null);
        done();
      })
    })
  
    it('adds handledbar for each plate under its name', function (done) {
      hbs.heat(heatOpts, function (err) {
        assert.equal(Object.keys(hbs.thermos).length, 2);
        assert.equal(hbs.thermos['plateuno'], memuno);
        assert.equal(hbs.thermos['platedos'], memdos);
        done();
      })
    })

    describe('when plates where found in absolute subfolder', function () {
      before(function () {
        platesFiles.forEach(function (file) {
          file.parentDir = '/sub/subsub';
        });
        hbs = resolve({ rdp: { files: platesFiles } })
      })
      
      it('adds handledbar for each plate under its name at namespace reflecting subfolders', function (done) {
        hbs.heat(heatOpts, function (err) {
          assert.equal(Object.keys(hbs.thermos).length, 1);
          assert.equal(hbs.thermos.sub.subsub.plateuno, memuno);
          assert.equal(hbs.thermos.sub.subsub.platedos, memdos);
          done();
        })
      })
    })

    describe('when plates where found in relative subfolder', function () {
      before(function () {
        platesFiles.forEach(function (file) {
          file.parentDir = 'sub/subsub';
        });
        hbs = resolve({ rdp: { files: platesFiles } })
      })
      
      it('adds handledbar for each plate under its name at namespace reflecting subfolders', function (done) {
        hbs.heat(heatOpts, function (err) {
          assert.equal(Object.keys(hbs.thermos).length, 1);
          assert.equal(hbs.thermos.sub.subsub.plateuno, memuno);
          assert.equal(hbs.thermos.sub.subsub.platedos, memdos);
          done();
        })
      })
    })
  })

  describe('when no plates are found in plates path', function () {

    before(function () {
      hbs = resolve({ rdp: { files: [ ] } })
    });

    it('returns no error', function (done) {
      hbs.heat(heatOpts, function (err) {
        assert.equal(err, null);
        done();
      })
    })
  
    it('adds no handledbar', function (done) {
      hbs.heat(heatOpts, function (err) {
        assert.equal(Object.keys(hbs.thermos).length, 0);
        done();
      })
    })
  })
})
