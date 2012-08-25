var fs         =  require('fs')
  , util       =  require('util')
  , events     =  require('events')
  , readdirp   =  require('readdirp')
  , handlebars =  require('handlebars')
  , watcher    =  require('./watcher')
  , utl        =  require('./utl')
  ;

function HotPlates () {
  handlebars.templates    =  { };
  this.templateFiles      =  [ ];
  this.partialFiles       =  [ ];
  this.watchedDirectories =  { };
}

util.inherits(HotPlates, events.EventEmitter);

HotPlates.prototype.process = function (opts, watch, processFile, done) {
  var self = this;

  function gatherWatchedDirectories (directories) {
    directories.forEach(function (directory) {
      if (!self.watchedDirectories[directory.fullPath])
        self.watchedDirectories[directory.fullPath] = directory;
    });
  }

  function processHandlebarFiles (handlebarFiles, cb) {
    var tasks = handlebarFiles.length;

    if (tasks === 0) {
      cb(null);
      return;
    }
    
    handlebarFiles
      .forEach(function (file) {
        fs.readFile(file.fullPath, function (err, plate) {
          if (err) done(err);
          else {
            processFile(file, plate.toString());
            if (--tasks === 0) cb(null);
          }
        });
      });
  }

  if (!opts) done(null);
  else {

    if (!opts.fileFilter) opts.fileFilter = [ '*.hbs', '*.handlebars' ];

    readdirp(opts, function (err, entries) {

      if (err) done(err);
      else {
        if (watch) gatherWatchedDirectories(entries.directories);
        processHandlebarFiles(entries.files, done);
      }
    });
  }
};

HotPlates.prototype.processTemplate = function (file, plate) {
  var plateName    =  utl.plateNameFrom(file.name)
    , namespaces   =  utl.folderParts(file.parentDir)
    , fullName =  namespaces.length ===  0 ? plateName : namespaces.concat(plateName).join('.')
    ;

  handlebars.templates[fullName] = handlebars.compile(plate);

  this.emit('templateCompiled', file, fullName, plate);
};

HotPlates.prototype.processPartial = function (file, partial) {
  var plateName      =  utl.plateNameFrom(file.name)
    , namespaces     =  utl.folderParts(file.parentDir)
    , partialName    =  namespaces.length ===  0 ? plateName : namespaces.concat(plateName).join('.')
    ;
  
  handlebars.registerPartial(partialName, partial);

  this.emit('partialRegistered', file, partialName, partial);
};

HotPlates.prototype.heat = function (opts, hot) {
  var watch = opts.watch
    , self = this;

  function processTemplates (opts, done) {
    self.process 
      ( opts
      , watch
      , function(file, plate) { self.processTemplate(file, plate); self.templateFiles.push(file); }
      , done
      );
  }

  function processPartials (opts, done) {
    self.process 
      ( opts
      , watch
      , function(file, plate) { self.processPartial(file, plate); self.partialFiles.push(file); }
      , done
      );
  }

  function thenProcessPartials (err) {
    if (err) hot(err);
    else processPartials(opts.partials, thenEmitBatchEnded);
  }

  function thenEmitBatchEnded (err) {
    if (err) hot(err);
    else { 
      self.emit('batchEnded');
      thenWatch(null);
    }
  }

  function thenWatch (err) {
    if (err) hot(err);
    else if (!opts.watch) hot();
    else { 
      var watchedDirectoriesValues = Object.keys(self.watchedDirectories)
        .map(function (key) { return self.watchedDirectories[key]; });

      watcher
        .create(self.templateFiles, self.partialFiles, watchedDirectoriesValues)
        .on('templateChanged',  function (file, plate)  { self.processTemplate(file, plate); })
        .on('partialChanged',   function (file, plate)  { self.processPartial(file, plate); })
        .on('directoryChanged', function reheatAll()    { self.heat(opts, function () { } ); })
        ;
      
      hot();
    }
  }

  if (!opts.templates && !opts.partials) 
    throw new Error('Need to either define "templates" or "partials" options.');

  this.emit('batchStarted');

  processTemplates(opts.templates, thenProcessPartials);
};

HotPlates.prototype.burn = function () {
  var self = this;

  Object.keys(handlebars.templates).forEach(function (key) {
    delete handlebars.templates[key];
  });
  Object.keys(handlebars.partials).forEach(function (key) {
    delete handlebars.partials[key];
  });
  Object.keys(self.watchedDirectories).forEach(function (key) {
    delete self.watchedDirectories[key]; 
  });

  self.templateFiles = [];
  self.partialFiles = [];

  self.emit('burned');
  return module.exports;
};

var hp = new HotPlates();

module.exports = {
    heat :  function () { hp.heat.apply(hp, arguments); return this; }
  , burn :  function () { hp.burn.apply(hp, arguments); return this; }
  , on   :  function () { hp.on.apply(hp, arguments); return this; }
};
