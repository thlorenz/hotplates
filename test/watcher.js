/*jshint asi:true*/
/*global describe before beforeEach it */

var assert     =  require('assert')
  , proxyquire =  require('proxyquire')
  , path       =  require('path')
  , fsStub     =  { }
  ;

function resolve () {
  return proxyquire.resolve('../watcher', __dirname, { 
      fs :  fsStub
  });
}

describe('when i create a watcher with template and partial files', function () {
  var plateuno           =  'plateuno.hbs'
    , platedos           =  'platedos.hbs'
    , plateunoFullPath   =  '/path/plateuno.hbs'
    , platedosFullPath   =  '/path/platedos.hbs'
    , platecontuno       =  'plate cont uno'
    , platecontdos       =  'plate cont dos'

    , partialuno         =  'partialuno.hbs'
    , partialdos         =  'partialdos.hbs'
    , partialunoFullPath =  '/path/partialuno.hbs'
    , partialdosFullPath =  '/path/partialdos.hbs'
    , partialcontuno     =  'partial cont uno'
    , partialcontdos     =  'partial cont dos'

    , plateFiles        =  [
        { name      :  plateuno
        , fullPath  :  plateunoFullPath
        }
      , { name      :  platedos
        , fullPath  :  platedosFullPath
        }
      ]
    , partialFiles = [
        { name      :  partialuno
        , fullPath  :  partialunoFullPath
        }
      , { name      :  partialdos
        , fullPath  :  partialdosFullPath
        }
      ]
    , watchedFiles
    , fileChanged = { }
    , changedPlate
    , changedPlateContent
    , changedPartial
    , changedPartialContent
    , sut
    ;

  before(function () {
    watchedFiles = [];

    fsStub.watchFile = function (file, opts, cb) {
      fileChanged[file] = cb;
      watchedFiles.push(file);      
    };
  
    fsStub.readFile = function (p, cb) { 
      // plates
      if (path.basename(p) === plateuno) { 
        cb(null, platecontuno);
      } else if (path.basename(p) === platedos) {
        cb(null, platecontdos);
      // partials
      } else if (path.basename(p) === partialuno) { 
        cb(null, partialcontuno);
      } else if (path.basename(p) === partialdos) {
        cb(null, partialcontdos);
      } else {
        cb(new Error('Not setup for this plate ' + p));
      }
    }

    sut = resolve().create(plateFiles, partialFiles);

    sut.on('templateChanged', function (file, content) {
      changedPlate = file;
      changedPlateContent = content;
    });

    sut.on('partialChanged', function (file, content) {
      changedPartial = file;
      changedPartialContent = content;
    });
  })

  it('watches plate files', function () {
    plateFiles.forEach(function (file) {
      watchedFiles.should.include(file.fullPath);
    });
  })

  it('watches partial files', function () {
    partialFiles.forEach(function (file) {
      watchedFiles.should.include(file.fullPath);
    });
  })

  describe('when plateuno changed', function () {

    before(function () {
      changedPlate = null;
      changedPlateContent = null;
      fileChanged[plateunoFullPath]('change');  
    })

    it('triggers template changed with file and new content', function () {
      changedPlate.name.should.equal(plateuno);  
      changedPlateContent.should.equal(platecontuno);
    })
  })

  describe('when platedos changed', function () {

    before(function () {
      changedPlate = null;
      changedPlateContent = null;
      fileChanged[platedosFullPath]('change');  
    })

    it('triggers template changed with file and new content', function () {
      changedPlate.name.should.equal(platedos);  
      changedPlateContent.should.equal(platecontdos);
    })
  })

  describe('when partialuno changed', function () {

    before(function () {
      changedPartial = null;
      changedPartialContent = null;
      fileChanged[partialunoFullPath]('change');  
    })

    it('triggers partial changed with file and new content', function () {
      changedPartial.name.should.equal(partialuno);  
      changedPartialContent.should.equal(partialcontuno);
    })
  })

  describe('when partialdos changed', function () {

    before(function () {
      changedPartial = null;
      changedPartialContent = null;
      fileChanged[partialdosFullPath]('change');  
    })

    it('triggers partial changed with file and new content', function () {
      changedPartial.name.should.equal(partialdos);  
      changedPartialContent.should.equal(partialcontdos);
    })
  })
})

