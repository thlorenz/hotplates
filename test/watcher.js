/*jshint asi:true*/
/*global describe before beforeEach it */

var assert     =  require('assert')
  , proxyquire =  require('proxyquire')
  , fsStub     =  { }
  ;

function resolve (stubOpts) {
  return proxyquire.resolve('../watcher', __dirname, { 
      fs :  fsStub
  });
}

describe('when i create a watcher with template and partial files', function () {
  var plateuno           =  'plateuno.hbs'
    , plateunoFullPath   =  '/path/plateuno.hbs'
    , platedos           =  'platedos.hbs'
    , platedosFullPath   =  '/path/platedos.hbs'
    , partialuno         =  'partialuno.hbs'
    , partialunoFullPath =  '/path/partialuno.hbs'
    , partialdos         =  'partialdos.hbs'
    , partialdosFullPath =  '/path/partialdos.hbs'
    , platecontuno       =  'plate cont uno'
    , platecontdos       =  'plate cont dos'
    , partialcontuno     =  'partial cont uno'
    , partialcontdos     =  'partial cont dos'
    , platesFiles        =  [
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
 
  fsStub.readFile = function (p, cb) { 
    // plates
    if (path.basename(p) === plateuno) { 
      cb(null, platecontuno);
    } else if (path.basename(p) === platedos) {
      cb(null, platecontdos);
    } else if (path.basename(p) === plateuno) { 
      cb(null, platecontuno);
    } else if (path.basename(p) === platedos) {
      cb(null, platecontdos);
    } else {
      cb(new Error('Not setup for this plate ' + p));
    }
  }
  
})

