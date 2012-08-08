var fs                 =  require('fs')
  , path               =  require('path')
  , readdirp           =  require('readdirp')
  , handlebars         =  require('handlebars')
  , watcher            =  require('./watcher')
  , oven               =  { }
  , templateFiles      =  [ ]
  , partialFiles       =  [ ]
  , watchedDirectories =  { }
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

function namespace(folder) {

    var parts = folderParts(folder)
      , parent = oven;

    for (var i = 0; i < parts.length; i++) {
        if (typeof parent[ parts[i] ] == 'undefined') {
            parent[ parts[i] ] = { };
        }
        parent = parent[ parts[i] ];
    }
    return parent;
}

function plateNameFrom(filename) {
  return filename.substr(0, filename.length - path.extname(filename).length);
}

function process(opts, watch, processFile, done) {

  function gatherWatchedDirectories (directories) {
    directories.forEach(function (directory) {
      if (!watchedDirectories[directory.fullPath])
        watchedDirectories[directory.fullPath] = directory;
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
} 
function processTemplate(file, plate) {
  var plateName = plateNameFrom(file.name)
    , attachTo = namespace(file.parentDir);

  attachTo[plateName] = handlebars.compile(plate);
}

function processPartial(file, partial) {
  var plateName   =  plateNameFrom(file.name)
    , namespaces  =  folderParts(file.parentDir)
    , partialName =  namespaces.length === 0 ? plateName : namespaces.concat(plateName).join('.')
    ;
  
  handlebars.registerPartial(partialName, partial);
}

function heat(opts, hot) {
  var watch = opts.watch;

  function processTemplates (opts, done) {
    process 
      ( opts
      , watch
      , function(file, plate) { processTemplate(file, plate); templateFiles.push(file); }
      , done
      );
  }

  function processPartials (opts, done) {
    process 
      ( opts
      , watch
      , function(file, plate) { processPartial(file, plate); partialFiles.push(file); }
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
      var watchedDirectoriesValues = Object.keys(watchedDirectories)
        .map(function (key) { return watchedDirectories[key]; });

      watcher
        .create(templateFiles, partialFiles, watchedDirectoriesValues)
        .on('templateChanged', processTemplate)
        .on('partialChanged',  processPartial)
        ;
      
      hot();
    }
  }

  if (!opts.templates && !opts.partials) 
    throw new Error('Need to either define "templates" or "partials" options.');

  processTemplates(opts.templates, thenProcessPartials);
}

function burn() {
  Object.keys(oven).forEach(function (key) {
    delete oven[key];
  });
  Object.keys(handlebars.partials).forEach(function (key) {
    delete handlebars.partials[key]; 
  });
  Object.keys(watchedDirectories).forEach(function (key) {
    delete watchedDirectories[key]; 
  });

  templateFiles = [];
  partialFiles = [];
  createdWatcher = null;

  return module.exports;
}

module.exports = {
    heat :  heat
  , burn :  burn
  , oven :  oven
};
