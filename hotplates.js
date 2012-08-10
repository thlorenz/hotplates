var fs         =  require('fs')
  , path       =  require('path')
  , util       =  require('util')
  , events     =  require('events')
  , readdirp   =  require('readdirp')
  , handlebars =  require('handlebars')
  , watcher    =  require('./watcher')
  ;

function folderParts (folder) {
  var trimmed = folder.trim();

  if (trimmed === '') return [];

  var prefRemoved = trimmed
      .replace(/^\.\//,'')  // remove './' prefix
      .replace(/^\//, '')   // remove '/' prefix 
    ;

    return prefRemoved.split('/');
}

function namespace(folder, root) {

    var parts = folderParts(folder)
      , parent = root;

    for (var i = 0; i < parts.length; i++) {
        if (typeof parent[ parts[i] ] == 'undefined') {
            parent[ parts[i] ] = { };
        }
        parent = parent[ parts[i] ];
    }
    return { root: parent, path: parts.join('.') };
}

function plateNameFrom(filename) {
  return filename.substr(0, filename.length - path.extname(filename).length);
}

function HotPlates () {
  this.oven               =  { };
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
      done(null);
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
  var plateName           =  plateNameFrom(file.name)
    , namespaced          =  namespace(file.parentDir, this.oven)
    , namespacedPlateName =  namespaced.path + '.' + plateName;

  namespaced.root[plateName] = handlebars.compile(plate);
  this.emit('templateCompiled', file, namespacedPlateName);
};

HotPlates.prototype.processPartial = function (file, partial) {
  var plateName   =  plateNameFrom(file.name)
    , namespaces  =  folderParts(file.parentDir)
    , partialName =  namespaces.length === 0 ? plateName : namespaces.concat(plateName).join('.')
    ;
  
  handlebars.registerPartial(partialName, partial);
  this.emit('partialRegistered', file, partialName);
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
    else processPartials(opts.partials, thenWatch);
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

  processTemplates(opts.templates, thenProcessPartials);
};

HotPlates.prototype.burn = function () {
  var self = this;

  Object.keys(self.oven).forEach(function (key) {
    delete self.oven[key];
  });
  Object.keys(handlebars.partials).forEach(function (key) {
    delete handlebars.partials[key]; 
  });
  Object.keys(self.watchedDirectories).forEach(function (key) {
    delete self.watchedDirectories[key]; 
  });

  self.templateFiles = [];
  self.partialFiles = [];

  return module.exports;
};

var hp = new HotPlates();

module.exports = {
    heat :  function () { hp.heat.apply(hp, arguments); return this; }
  , burn :  function () { hp.burn.apply(hp, arguments); return this; }
  , on   :  function () { hp.on.apply(hp, arguments); return this; }
  , oven :  hp.oven
};
