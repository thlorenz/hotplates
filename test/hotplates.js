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
  , platesOpts = {
      root            :  'some plates root'
    , directoryFilter :  'some plates directoryFilter'
    }
  , partialsOpts = {
      root            :  'some partials root'
    , directoryfilter :  'some partials directoryfilter'
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
    resolve( { rdp: { files: [], err: null } } )
      .heat({ templates: platesOpts, partials: partialsOpts} , done);
  })

  it('passes correct templates opts to readdirp', function () {
    var templateOpts = readdirpOpts.shift();
    assert.equal(templateOpts.root            ,  platesOpts.root);
    assert.equal(templateOpts.directoryFilter ,  platesOpts.directoryFilter);
    assert.equal(templateOpts.fileFilter[0]   ,  '*.hbs');
    assert.equal(templateOpts.fileFilter[1]   ,  '*.handlebars');
  })

  it('passes correct partials opts to readdirp', function () {
    var partialOpts = readdirpOpts.shift();
    assert.equal(partialOpts.root            ,  partialsOpts.root);
    assert.equal(partialOpts.directoryFilter ,  partialsOpts.directoryFilter);
    assert.equal(partialOpts.fileFilter[0]   ,  '*.hbs');
    assert.equal(partialOpts.fileFilter[1]   ,  '*.handlebars');
  })
})

describe('compiling and registering', function () {
  var plateuno         =  'plateuno.hbs'
    , plateunoFullPath =  '/path/plateuno.hbs'
    , platedos         =  'platedos.hbs'
    , platedosFullPath =  '/path/platedos.hbs'
    , contuno          =  'contuno'
    , contdos          =  'contdos'
    , memuno           =  'memuno'
    , memdos           =  'memdos'
    , platesFiles = [
        { name      :  plateuno
        , parentDir :  ''
        , fullPath  :  plateunoFullPath
        }
      , { name      :  platedos
        , parentDir :  ''
        , fullPath  :  platedosFullPath
        }
      ]
    , error
    ;

  before(function () {
    fsStub.readFile = function (p, cb) { 
      var content;
      if (path.basename(p) === plateuno) { 
        cb(null, contuno);
      } else if (path.basename(p) === platedos) {
        cb(null, contdos);
      } else {
        cb(new Error('Not setup for this plate ' + p));
      }
    }

    hbs = resolve({ rdp: { files: platesFiles } });
  })


  describe('when plates are found in plates path', function () {
    before(function (done) {

      hbStub.compile = function(cont) {
        if (cont == contuno) return memuno;
        if(cont == contdos) return memdos;
        throw new Error('Not setup for this content ' + c);
      }

      hbStub.registerPartial = function () { throw new Error('no partials should be found and registered'); }

      hbs.heat({ templates: platesOpts }, function (err) {
          error = err;
          done();
        });
    })

    it('returns no error', function () {
      assert.equal(error, null);
    })
  
    it('adds handledbar for each plate under its name', function () {
      assert.equal(Object.keys(hbs.oven).length, 2);
      assert.equal(hbs.oven['plateuno'], memuno);
      assert.equal(hbs.oven['platedos'], memdos);
    })

    describe('when plates were found in absolute subfolder', function () {
      var subfolderPlatefiles;
      before(function (done) {
        subfolderPlatefiles = platesFiles.map(function (file) {
          return { name: file.name, fullPath: file.fullPath, parentDir: '/sub/subsub' };
        });


        hbs = resolve({ rdp: { files: subfolderPlatefiles } });
        hbs.heat({ templates: platesOpts }, function (err) {
            error = err;
            done();
          });
      })
      
      it('adds handledbar for each plate under its name at namespace reflecting subfolders', function () {
        assert.equal(Object.keys(hbs.oven).length, 1);
        assert.equal(hbs.oven.sub.subsub.plateuno, memuno);
        assert.equal(hbs.oven.sub.subsub.platedos, memdos);
      })
    })

    describe('when plates were found in relative subfolder', function () {
      var subfolderPlatefiles;

      before(function (done) {
        subfolderPlatefiles = platesFiles.map(function (file) {
          return { name: file.name, fullPath: file.fullPath, parentDir: 'sub/subsub' };
        });

        hbs = resolve({ rdp: { files: subfolderPlatefiles } });
        hbs.heat({ templates: platesOpts }, function (err) {
            error = err;
            done();
          });
      })
      
      it('adds handledbar for each plate under its name at namespace reflecting subfolders', function () {
        assert.equal(Object.keys(hbs.oven).length, 1);
        assert.equal(hbs.oven.sub.subsub.plateuno, memuno);
        assert.equal(hbs.oven.sub.subsub.platedos, memdos);
      })
    })
  })

  describe('when no plates are found in plates path', function () {
    var error;

    before(function (done) {
      hbs = resolve({ rdp: { files: [ ] } })
      hbs.heat({ templates: platesOpts }, function (err) {
          error = err;
          done();
        });
    });

    it('returns no error', function () {
      assert.equal(error, null);
    })
  
    it('adds no handledbar', function () {
      assert.equal(Object.keys(hbs.oven).length, 0);
    })
  })


  describe('when partials are found in partials path', function () {
    var memunoName
      , memdosName;

    before(function (done) {

      hbStub.compile = function () { throw new Error('no plates should be found and compiled'); }

      hbStub.registerPartial = function(name, cont) {
             if (cont === contuno) memunoName = name;
        else if (cont === contdos) memdosName = name;
        else                       throw new Error('Not setup for this content ' + c);
      }

      hbs = resolve({ rdp: { files: platesFiles } });
      hbs.heat({ partials: partialsOpts }, function (err) {
          error = err;
          done();
        });
    })

    it('returns no error', function () {
      assert.equal(error, null);
    })

    it('registers partial for each under its name', function () {
      assert.equal(memunoName, 'plateuno');
      assert.equal(memdosName, 'platedos');
    })

    describe('when partials were found in relative subfolder', function () {
      var subfolderPlatefiles;
      before(function (done) {
        subfolderPlatefiles = platesFiles.map(function (file) {
          return { name: file.name, fullPath: file.fullPath, parentDir: 'sub/subsub' };
        });

        hbs = resolve({ rdp: { files: subfolderPlatefiles } });
        hbs.heat({ partials: partialsOpts }, function (err) {
            error = err;
            done();
          });
      })
      
    it('registers partial for each under its name reflecting subfolders', function () {
        assert.equal(memunoName, 'sub.subsub.plateuno');
        assert.equal(memdosName, 'sub.subsub.platedos');
      })
    })
  })
})
