/*jshint asi:true*/
/*global describe before beforeEach it */

var proxyquire   =  require('proxyquire')
  , handlebars   =  require('handlebars')
  , path         =  require('path')
  , should       =  require('should')
  , fsStub       =  { }
  , hbStub       =  { }
  , root         =  'some root'
  , platesPath   =  'some path'
  , readdirpOpts =  []
  , hbs
  , platesOpts = {
      root            :  'some plates root'
    , directoryFilter :  'some plates directoryFilter'
    }
  , partialsOpts = {
      root            :  'some partials root'
    , directoryfilter :  'some partials directoryfilter'
    }
  ;

var stubOpts;

function resolve (stubOpts) {
  return proxyquire('../hotplates', { 
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
    hbStub.templates = {};
    hbStub.partials = {};
    resolve( { rdp: { files: [], err: null } } )
      .heat({ templates: platesOpts, partials: partialsOpts} , done);
  })

  it('passes correct templates opts to readdirp', function () {
    var templateOpts = readdirpOpts.shift();
    templateOpts.root            .should.equal(platesOpts.root);
    templateOpts.directoryFilter .should.equal(platesOpts.directoryFilter);
    templateOpts.fileFilter[0]   .should.equal('*.hbs');
    templateOpts.fileFilter[1]   .should.equal('*.handlebars');
  })

  it('passes correct partials opts to readdirp', function () {
    var partialOpts = readdirpOpts.shift();
    partialOpts.root            .should.equal(partialsOpts.root);
    should.not.exist(partialOpts.directoryFilter);
    partialOpts.fileFilter[0]   .should.equal('*.hbs');
    partialOpts.fileFilter[1]   .should.equal('*.handlebars');
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
    , plateFiles = [
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
    , readFiles
    , plateCompileds
    ;

  before(function () {
    readFiles = [];
    fsStub.readFile = function (p, cb) { 
      if (path.basename(p) === plateuno) { 
        readFiles.push(plateuno);
        cb(null, contuno);
      } else if (path.basename(p) === platedos) {
        readFiles.push(platedos);
        cb(null, contdos);
      } else {
        cb(new Error('Not setup for this plate ' + p));
      }
    }

    hbs = resolve({ rdp: { files: plateFiles } });

    hbStub.compile = function(cont) {
      if (cont == contuno) return memuno;
      if(cont == contdos) return memdos;
      throw new Error('Not setup for this content ' + cont);
    }
  })

  describe('when plates are found in plates path', function () {
      var batchStartedEmits = 0
        , batchEndedEmits = 0
        ;

      before(function (done) {
        plateCompileds = [];
        
        
        hbStub.registerPartial = function () { throw new Error('no partials should be found and registered'); }

        hbs
          .on('templateCompiled', function (file, name, plate) {
            plateCompileds.push({ file: file, name: name, plate: plate});  
          })
          .on('batchStarted', function () {
            batchStartedEmits++;
          })
          .on('batchEnded', function () {
            batchEndedEmits++;
          })
          .heat({ templates: platesOpts }, function (err) {
              error = err;
              done();
          });
      })

      it('returns no error', function () {
        should.not.exist(error);
      })
    
      it('adds each plate under its name to handlebars templates', function () {
        Object.keys(hbStub.templates).length.should.equal(2);
        hbStub.templates['plateuno'].should.equal(memuno);
        hbStub.templates['platedos'].should.equal(memdos);
      })

      it('emits "templateCompiled" for each plate with correct file names', function () {
        var plateFilesNames = plateFiles.map(function (pf) { return pf.name; })
          , plateCompiledsFileNames = plateCompileds.map(function (pc) { return pc.file.name; });

        plateCompileds.should.have.lengthOf(plateFiles.length);
        plateFilesNames.forEach(function (name) {
          plateCompiledsFileNames.should.include(name);
        });
      })

      it('emits "templateCompiled" for each plate with its name and template', function () {
        var uno = plateCompileds[0];
        uno.name.should.equal('plateuno');
        uno.plate.should.equal('contuno');

        var dos = plateCompileds[1];
        dos.name.should.equal('platedos');
        dos.plate.should.equal('contdos');
      })

      it('emits "batchStarted" exactly once', function () {
        batchStartedEmits.should.equal(1);
      })

      it('emits "batchEnded" exactly once', function () {
        batchEndedEmits.should.equal(1);
      })

      describe('and I burn templates and partials', function () {
        var burnedEmitted;

        before(function () {
          burnedEmitted = false;
          hbStub.templates = { plate: 'some plate' };
          hbStub.partials = { plate: 'some plate' };

          hbs.on('burned', function () { burnedEmitted = true; });
          hbs.burn();
        })  

        it('deletes all templates from handlebars', function () {
          Object.keys(hbStub.templates).should.have.length(0);
        })

        it('deletes all partials from handlebars', function () {
          Object.keys(hbStub.partials).should.have.length(0);
        })

        it('emits "burned" event ', function () {
          burnedEmitted.should.equal(true);  
        })
      })

      describe('when plates were found in absolute subfolder', function () {
        var subfolderPlatefiles;
        before(function (done) {
          subfolderPlatefiles = plateFiles.map(function (file) {
            return { name: file.name, fullPath: file.fullPath, parentDir: '/sub/subsub' };
          });


          hbs = resolve({ rdp: { files: subfolderPlatefiles } });
          hbs.heat({ templates: platesOpts }, function (err) {
              error = err;
              done();
            });
        })
        
        it('adds handledbar for each plate under its name at namespace reflecting subfolders', function () {
          Object.keys(hbStub.templates).length.should.equal(2);
          hbStub.templates['sub.subsub.plateuno'].should.equal(memuno);
          hbStub.templates['sub.subsub.platedos'].should.equal(memdos);
        })
      })

      describe('when plates were found in relative subfolder', function () {
        var subfolderPlatefiles;

        before(function (done) {
          plateCompileds = [];

          subfolderPlatefiles = plateFiles.map(function (file) {
            return { name: file.name, fullPath: file.fullPath, parentDir: 'sub/subsub' };
          });

          hbs = resolve({ rdp: { files: subfolderPlatefiles } });
          hbs
            .on('templateCompiled', function (file, name) {
              plateCompileds.push({ file: file, name: name });  
            })
            .heat({ templates: subfolderPlatefiles }, function (err) {
                error = err;
                done();
            });
        })
        
        it('adds handledbar for each plate under its name at namespace reflecting subfolders', function () {
          Object.keys(hbStub.templates).length.should.equal(2);
          hbStub.templates['sub.subsub.plateuno'].should.equal(memuno);
          hbStub.templates['sub.subsub.platedos'].should.equal(memdos);
        })

        it('emits "templateCompiled" for each template including namespaced name', function () {
          var plateFilesNames = plateFiles.map(function (pf) { return pf.name; })
            , plateCompiledsFileNames = plateCompileds.map(function (pc) { return pc.file.name; })
            , plateCompiledsNames = plateCompileds.map(function (pc) { return pc.name; });

          plateCompileds.should.have.lengthOf(plateFiles.length);
          plateFilesNames.forEach(function (name) {
            plateCompiledsFileNames.should.include(name);
          });

          plateCompiledsNames.should.include('sub.subsub.plateuno');
          plateCompiledsNames.should.include('sub.subsub.platedos');
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
      should.not.exist(error);
    })
  
    it('adds no handledbar', function () {
      Object.keys(hbStub.templates).length.should.equal(0);
    })
  })


  describe('when partials are found in partials path', function () {
    var memunoName
      , memdosName
      , partialRegistereds
      , batchStartedEmits = 0
      , batchEndedEmits = 0
      ;

    before(function (done) {
      partialRegistereds = [];

      hbStub.compile = function () { throw new Error('no plates should be found and compiled'); }

      hbStub.registerPartial = function(name, cont) {
             if (cont === contuno) memunoName = name;
        else if (cont === contdos) memdosName = name;
        else                       throw new Error('Not setup for this content ' + cont);
      }

      hbs = resolve({ rdp: { files: plateFiles } });

      hbs
        .on('partialRegistered', function (file, name, plate) {
          partialRegistereds.push({ file: file, name: name, plate: plate });  
        })
        .on('batchStarted', function () {
          batchStartedEmits++;
        })
        .on('batchEnded', function () {
          batchEndedEmits++;
        })
        .heat({ partials: partialsOpts }, function (err) {
          error = err;
          done();
        });
    })

    it('returns no error', function () {
      should.not.exist(error);
    })

    it('registers partial for each under its name', function () {
      memunoName.should.equal('plateuno');
      memdosName.should.equal('platedos');
    })
    
    it('emits "partialCompiled" for each partial including namespaced name', function () {
      var plateFilesNames = plateFiles.map(function (pf) { return pf.name; })
        , partialRegisteredsFileNames = partialRegistereds.map(function (pc) { return pc.file.name; });

      partialRegistereds.should.have.lengthOf(plateFiles.length);
      plateFilesNames.forEach(function (name) {
        partialRegisteredsFileNames.should.include(name);
      });
    })

    it('emits "partialRegistered" for each partial with its name and template', function () {
      var uno = partialRegistereds[0];
      uno.name.should.equal('plateuno');
      uno.plate.should.equal('contuno');

      var dos = partialRegistereds[1];
      dos.name.should.equal('platedos');
      dos.plate.should.equal('contdos');
    })

    it('emits "batchStarted" exactly once', function () {
      batchStartedEmits.should.equal(1);
    })

    it('emits "batchEnded" exactly once', function () {
      batchEndedEmits.should.equal(1);
    })

    describe('when partials were found in relative subfolder', function () {
      var subfolderPlatefiles;
      before(function (done) {
        partialRegistereds = [];

        subfolderPlatefiles = plateFiles.map(function (file) {
          return { name: file.name, fullPath: file.fullPath, parentDir: 'sub/subsub' };
        });

        hbs = resolve({ rdp: { files: subfolderPlatefiles } });
        hbs
          .on('partialRegistered', function (file, name) {
            partialRegistereds.push({ file: file, name: name });  
          })
          .heat({ partials: partialsOpts }, function (err) {
            error = err;
            done();
          });
      })
      
      it('registers partial for each under its name reflecting subfolders', function () {
          memunoName.should.equal('sub.subsub.plateuno');
          memdosName.should.equal('sub.subsub.platedos');
      })

      it('emits "partialRegistered" for each partial including namespaced name', function () {
        var plateFilesNames = subfolderPlatefiles.map(function (pf) { return pf.name; })
          , partialRegisteredsFileNames = partialRegistereds.map(function (pc) { return pc.file.name; })
          , partialRegisteredsNames = partialRegistereds.map(function (pc) { return pc.name; });
          
        partialRegistereds.should.have.lengthOf(subfolderPlatefiles.length);
        plateFilesNames.forEach(function (name) {
          partialRegisteredsFileNames.should.include(name);
        });

        partialRegisteredsNames.should.include('sub.subsub.plateuno');
        partialRegisteredsNames.should.include('sub.subsub.platedos');
      })
    })
  })

})
