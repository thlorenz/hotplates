var fs           =  require('fs')
  , EventEmitter =  require('events').EventEmitter
  , watchers     =  { }
  , isWindows    =  process.platform === 'win32'
  ;

function watch(file, update) {
  var fullPath = file.fullPath;

  if (watchers[fullPath]) return;
  
  watchers[fullPath] = true;

  if (isWindows) {
    // slower, but oh well
    fs.watch(fullPath, function (event) {
      if (event === 'change') update(fullPath);
    });
  } else {
    fs.watchFile(fullPath, { persistent: true, interval: 100 }, function (event) {
      if (event === 'change') update(file);
    });
  }
}

function Watcher (templateFiles, partialFiles) {
  this.templateFiles = templateFiles;
  this.partialFiles = partialFiles;
}

Watcher.prototype.watchTemplatesAndPartials = function () {

  function keepWarm(file, process) {
    watch(file, function (file) {
      fs.readFile(file.fullPath,function (err, plate) {
        if (err) cb(err);
        else process(file, plate);
      });
    });
  }

  function watchTemplates(watchingAll) {
    this.templateFiles.forEach(function (file) {
        // TODO: emit
      keepWarm(file, processTemplate);
    });
  }

  function watchPartials() {
    this.partialFiles.forEach(function (file) {
        // TODO: emit
      keepWarm(file, processPartial);
    });
  }

  watchTemplates();
  watchPartials();
  
  // TODO: Watch all template folders for added/removed files
};

module.exports = {
  create: function (templateFiles, partialFiles) {
    var watcher = new Watcher(templateFiles, partialFiles);
    watcher.watchTemplatesAndPartials();
    return watcher;
  }
};

