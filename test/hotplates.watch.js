/*jshint asi:true*/
/*global describe before beforeEach it */

var proxyquire   =  require('proxyquire')
  , handlebars   =  require('handlebars')
  , path         =  require('path')
  , should       =  require('should')
  , fsStub       =  { }
  , hbStub       =  { }
  , watcherStub  =  { }
  , platesOpts = {
      root            :  'some plates root'
    , directoryFilter :  'some plates directoryFilter'
    }
  , partialsOpts = {
      root            :  'some partials root'
    , directoryfilter :  'some partials directoryfilter'
    }
  , sut
  ;

function resolve (stubOpts) {
  return proxyquire.resolve('../hotplates', __dirname, { 
      fs         :  fsStub
    , handlebars :  hbStub
    , readdirp   :  function (opts, cb) {
        cb(stubOpts.rdp.err, stubOpts.rdp); 
      }
    , './watcher': watcherStub
    });
}


describe('watching', function () {
  var plateuno         =  'plateuno.hbs'
    , plateunoFullPath =  '/path/plateuno.hbs'
    , platedos         =  'platedos.hbs'
    , platedosFullPath =  '/path/platedos.hbs'
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
    
    , plateDirectories = [
        { name      :  'platediruno'
        , parentDir :  ''
        , fullPath  :  'platedirunoFullPath'
        }
      , { name      :  'platedirdos'
        , parentDir :  ''
        , fullPath  :  'platedirdosFullPath'
        }
      , { name      :  'platedirdos'
        , parentDir :  ''
        , fullPath  :  'platedirdosFullPath'
        }
      ]
    , error
    , compiledTemplates
    , registeredPartials
    , watcherCreateArgs
    ;

  before(function () {

    compiledTemplates = [];
    registeredPartials = [];
    watcherCreateArgs = null;

    fsStub.readFile = function (p, cb) { cb(null, p + '-content'); }

    hbStub.compile = function (content) { compiledTemplates.push(content); }

    hbStub.registerPartial = function (name, content) { 
      registeredPartials.push({ name: name, content: content });  
    }
    watcherStub.create = function () { watcherCreateArgs = arguments; }
  }) 

  describe('watch is on and i heat templates only', function () {
    before(function (done) {
      sut = resolve({ rdp: { files: platesFiles, directories: plateDirectories } });
      sut.heat({ templates : platesOpts, watch: true }, function (err) {
        error = err;
        done();
      });
    }) 
    
    it('creates watcher with given templates', function () {
      var plates = watcherCreateArgs['0'];
      plates.should.have.lengthOf(platesFiles.length);
      plates[0].name.should.equal(platesFiles[0].name);
      plates[1].name.should.equal(platesFiles[1].name);
    })

    it('creates watcher with empty partials', function () {
      watcherCreateArgs['1'].should.be.empty;
    })

    it('creates watcher with unique template folders', function () {
      var directories = watcherCreateArgs['2'];
      directories.should.have.lengthOf(plateDirectories.length - 1); // on duplicate contained
      directories[0].name.should.equal(plateDirectories[0].name);
      directories[1].name.should.equal(plateDirectories[1].name);
    })
  }) 

  describe('watch is off and i heat templates only', function () {
    before(function (done) {
      watcherCreateArgs = null;
      sut = resolve({ rdp: { files: platesFiles, directories: plateDirectories } });
      sut.heat({ templates : platesOpts }, function (err) {
        error = err;
        done();
      });
    }) 
    
    it('creates no watcher', function () {
      should.not.exist(watcherCreateArgs);
    })
  }) 


  describe('watch is on and i heat partials only', function () {
    before(function (done) {
      sut = resolve({ rdp: { files: platesFiles, directories: plateDirectories } });
      sut.heat({ partials : platesOpts, watch: true }, function (err) {
        error = err;
        done();
      });
    }) 
    
    it('creates watcher with empty templates', function () {
      watcherCreateArgs['0'].should.be.empty;
    })

    it('creates watcher with given partials', function () {
      var partials = watcherCreateArgs['1'];
      partials.should.have.lengthOf(platesFiles.length);
      partials[0].name.should.equal(platesFiles[0].name);
      partials[1].name.should.equal(platesFiles[1].name);
    })

    it('creates watcher with unique partial folders', function () {
      var directories = watcherCreateArgs['2'];
      directories.should.have.lengthOf(plateDirectories.length - 1); // on duplicate contained
      directories[0].name.should.equal(plateDirectories[0].name);
      directories[1].name.should.equal(plateDirectories[1].name);
    })
  }) 
})
