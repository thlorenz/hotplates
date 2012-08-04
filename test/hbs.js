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
  , readdirpOpts
  ;

function resolve (stubOpts) {
  return proxyquire.resolve('../hbs', __dirname, { 
      fs         :  fsStub
    , handlebars :  hbStub
    , readdirp   :  function (opts, cb) {
        readdirpOpts = opts;
        cb(stubOpts.rdp.err, stubOpts.rdp); 
      }
    });
}

describe('storing templates', function () {

  describe('when looking for plates', function () {
    it('passes correct opts to readdirp', function (done) {
      var opts = { 
            templatesPath: 'some plates path'
          , directories: 'some plates direcories'
          }
        , hbs = resolve( { rdp: { files: [], err: null } } );

      hbs.store(opts, function (err) {
        assert.equal(readdirpOpts.root, opts.templatesPath);
        assert.equal(readdirpOpts.directoryFilter, opts.directories);
        assert.equal(readdirpOpts.fileFilter[0], '*.hbs');
        assert.equal(readdirpOpts.fileFilter[1], '*.handlebars');
        done();
      });
    })

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
        hbs.store({ }, function (err) {
          assert.equal(err, null);
          done();
        })
      })
    
      it('adds handledbar for each plate under its name', function (done) {
        hbs.store({ }, function (err) {
          assert.equal(Object.keys(hbs.handledbars).length, 2);
          assert.equal(hbs.handledbars['plateuno'], memuno);
          assert.equal(hbs.handledbars['platedos'], memdos);
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
          hbs.store({ }, function (err) {
            assert.equal(Object.keys(hbs.handledbars).length, 1);
            assert.equal(hbs.handledbars.sub.subsub.plateuno, memuno);
            assert.equal(hbs.handledbars.sub.subsub.platedos, memdos);
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
          hbs.store({ }, function (err) {
            assert.equal(Object.keys(hbs.handledbars).length, 1);
            assert.equal(hbs.handledbars.sub.subsub.plateuno, memuno);
            assert.equal(hbs.handledbars.sub.subsub.platedos, memdos);
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
        hbs.store({ }, function (err) {
          assert.equal(err, null);
          done();
        })
      })
    
      it('adds no handledbar', function (done) {
        hbs.store({ }, function (err) {
          assert.equal(Object.keys(hbs.handledbars).length, 0);
          done();
        })
      })
    })
  })
})
