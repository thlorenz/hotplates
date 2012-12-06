/*jshint asi:true*/
/*global describe before beforeEach it */

var proxyquire =  require('proxyquire')
  , should     =  require('should')
  , events     =  require('events')
  , hpStub     =  new events.EventEmitter()
  , fsStub     =  {}
  , hbStub     =  {} 
  , opts       =  { target: 'some file' }
  , fileuno = 'fileuno'
  , nameuno = 'uno'
  , contuno = '<p> {{ unocont }} </p>'
  , filedos = 'filedos'
  , namedos = 'dos'
  , contdos = '<p> {{ unodos }} </p>'
  ;

describe('preheating templates and partials', function () {
  var preheated
    , written
    , precompileds
    ;

  function reset() {
    preheated    =  null;
    written      =  null
    precompileds =  [];
  }

  function shouldIncludePrecompiledTemplate(data, name, content) {
    data.should.include('templates[\'' + name + '\']');
    data.should.include('precompiled ' + content);
  }

  function shouldIncludePrecompiledPartial(data, name, content) {
    data.should.include('Handlebars.registerPartial(\'' + name);
    data.should.include('precompiled ' + content);
  }

  before(function () {
    var preheat = proxyquire('../preheat', {
        './hotplates' :  hpStub
      , handlebars    :  hbStub
      , fs            :  fsStub
    });

    hbStub.precompile = function (data) { 
      precompileds.push(data); 
      return 'precompiled ' + data; 
    };

    fsStub.writeFile  = function (target, data, cb) { 
      written = { target: target, data: data }; 
      cb(null); 
    }

    preheat(opts, function (err, data) {
      preheated = data;  
    });

  })

  it('does not preheat initially', function () {
    should.not.exist(preheated);
  })

  describe('when hotplates compiled a template uno', function () {

    before(function () {
      reset();
      hpStub.emit('burned');
      hpStub.emit('templateCompiled', fileuno, nameuno, contuno);
    })

    it('precompiles template uno', function () {
      precompileds.should.have.length(1);
      precompileds[0].should.equal(contuno);
    })

    it('writes the result of the precompilation to specified target file', function () {
      written.target.should.equal(opts.target); 
      shouldIncludePrecompiledTemplate(written.data, nameuno, contuno);
    })

    it('calls back with the result of the precompilation', function () {
      shouldIncludePrecompiledTemplate(preheated, nameuno, contuno);
    })

    describe('and then compiled a template dos', function () {

      before(function () {
        reset();
        hpStub.emit('templateCompiled', filedos, namedos, contdos);
      })

      it('precompiles template uno and dos', function () {
        precompileds.should.have.length(2);
        precompileds[0].should.equal(contuno);
        precompileds[1].should.equal(contdos);
      })

      it('writes the result of the precompilation to specified target file including uno and dos', function () {
        written.target.should.equal(opts.target); 
        shouldIncludePrecompiledTemplate(written.data, nameuno, contuno);
        shouldIncludePrecompiledTemplate(written.data, namedos, contdos);
      })

      it('calls back with the result of the precompilation including uno and dos', function () {
        shouldIncludePrecompiledTemplate(preheated, nameuno, contuno);
        shouldIncludePrecompiledTemplate(preheated, namedos, contdos);
      })
    })
  })

  describe('when hotplates compiled a partial uno', function () {

    before(function () {
      reset();
      hpStub.emit('burned');
      hpStub.emit('partialRegistered', fileuno, nameuno, contuno);
    })

    it('precompiles partial uno', function () {
      precompileds.should.have.length(1);
      precompileds[0].should.equal(contuno);
    })

    it('writes the result of the precompilation to specified target file', function () {
      written.target.should.equal(opts.target); 
      shouldIncludePrecompiledPartial(written.data, nameuno, contuno);
    })

    it('calls back with the result of the precompilation', function () {
      shouldIncludePrecompiledPartial(preheated, nameuno, contuno);
    })
  })

  describe('when batch heat started and hotplates compiled a template uno', function () {

    before(function () {
      reset();
      hpStub.emit('burned');
      hpStub.emit('batchStarted');
      hpStub.emit('templateCompiled', fileuno, nameuno, contuno);
    })

    it('does not immediately precompile template uno', function () {
      precompileds.should.have.length(0);
    })

    it('does not immeidately write the result of the precompilation to specified target file', function () {
      should.not.exist(written);
    })

    it('does not call back with the result of the precompilation', function () {
      should.not.exist(preheated);
    })

    describe('and then compiled a template dos', function () {

      before(function () {
        reset();
        hpStub.emit('templateCompiled', filedos, namedos, contdos);
      })

      it('does not immediately precompile template uno or dos', function () {
        precompileds.should.have.length(0);
      })

      it('does not immeidately write the result of the precompilation to specified target file', function () {
        should.not.exist(written);
      })

      it('does not call back with the result of the precompilation', function () {
        should.not.exist(preheated);
      })

      describe('and then batch heat ended', function () {
        
        before(function () {
          reset();
          hpStub.emit('batchEnded');
        })

        it('precompiles template uno and dos', function () {
          precompileds.should.have.length(2);
          precompileds[0].should.equal(contuno);
          precompileds[1].should.equal(contdos);
        })

        it('writes the result of the precompilation to specified target file including uno and dos', function () {
          written.target.should.equal(opts.target); 
          shouldIncludePrecompiledTemplate(written.data, nameuno, contuno);
          shouldIncludePrecompiledTemplate(written.data, namedos, contdos);
        })

        it('calls back with the result of the precompilation including uno and dos', function () {
          shouldIncludePrecompiledTemplate(preheated, nameuno, contuno);
          shouldIncludePrecompiledTemplate(preheated, namedos, contdos);
        })
      })
    })
  })
})
