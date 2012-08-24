var fs         =  require('fs')
  , path       =  require('path')
  , util       =  require('util')
  , events     =  require('events')
  , readdirp   =  require('readdirp')
  , handlebars =  require('handlebars')
  , watcher    =  require('./watcher')
  ;

function camelCase (name) {
  return name
    .replace(/([\-_][a-z])/g, function( $1 ){ return $1.toUpperCase(); }) // uppercase all letters after - and _
    .replace(/[\-_]/g,''); // remove all - and _
}

function folderParts (folder) {
  var trimmed = folder.trim();

  if (trimmed === '') return [];

  var prefRemoved = trimmed
      .replace(/^\.\//,'')  // remove './' prefix
      .replace(/^\//, '')   // remove '/' prefix 
    , camelCased = camelCase(prefRemoved)
    ;

  return camelCased.split('/');
}

function namespace(folder, root) {

    var parts = folderParts(folder)
      , parent = root;

    for (var i = 0; i < parts.length; i++) {
      var key = camelCase(parts[i]);
        if (typeof parent[ key ] == 'undefined') {
            parent[ key ] = { };
        }
        parent = parent[ key ];
    }
    return { root: parent, path: parts.join('.') };
}

function plateNameFrom(filename) {
  var nameWithoutExt = filename.substr(0, filename.length - path.extname(filename).length);
  return camelCase(nameWithoutExt);
}

function HotPlates () {
  this.oven               =  { };
  this.plates             =  [ ];
  this.parts              =  [ ];
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
  var plateName           =  plateNameFrom(file.name)
    , namespaced          =  namespace(file.parentDir, this.oven)
    , namespacedPlateName =  namespaced.path.length > 0 ? namespaced.path + '.' + plateName : plateName;

  namespaced.root[plateName] = handlebars.compile(plate);

  this.plates.push({ name: namespacedPlateName, value: handlebars.precompile(plate) });

  this.emit('templateCompiled', file, namespacedPlateName);
};

HotPlates.prototype.processPartial = function (file, partial) {
  var plateName      =  plateNameFrom(file.name)
    , namespaces     =  folderParts(file.parentDir)
    , partialName    =  namespaces.length ===  0 ? plateName : namespaces.concat(plateName).join('.')
    ;
  
  handlebars.registerPartial(partialName, partial);

  this.parts.push({ name: partialName, value: handlebars.precompile(partial) });
  
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
    else processPartials(opts.partials, thenPrecompile);
  }

  function thenPrecompile (err) {
    // TODO: skip if no precompilation and possibly move into separate module
    if (err) hot(err);
    else precompile(self.plates, self.parts, opts, thenWatch);
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
  Object.keys(self.watchedDirectories).forEach(function (key) {
    delete self.watchedDirectories[key]; 
  });

  self.parts = [];
  self.plates = [];
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


function precompile(plates, parts, opts, cb) {
  if (!opts.precompile) {
    cb(null);
    return;
  }
  
  console.log('precompiling');

  var output = [];
  
  if (opts.precompile.amd) {
    output.push('define([\'' + opts.precompile.handlebarPath + 'handlebars\'], function(Handlebars) {\n');
  } else {
    output.push('(function() {\n');
  }

  output.push('  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n');

  plates.forEach(function (plate) {
      output.push('templates[\'' + plate.name + '\'] = template(' + plate.value + ');\n');
  });

  parts.forEach(function (part) {
      output.push('Handlebars.registerPartial(\'' + part.name + '\', ' + 'template(' + part.value + '));\n');
  });

  if (opts.precompile.amd) {
    output.push('});');
  } else {
    output.push('})();');
  }
  
  output = output.join('');

  fs.writeFileSync(opts.precompile.target, output);
  cb(null);
}
