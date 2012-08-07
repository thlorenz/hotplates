var fs           =  require('fs')
  , events =  require('events')
  , util         =  require('util')
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

util.inherits(Watcher, events.EventEmitter);

Watcher.prototype.watchTemplatesAndPartials = function () {

  var self = this;

  function keepWarm(file, process) {
    watch(file, function (file) {
      fs.readFile(file.fullPath,function (err, content) {
        if (err) cb(err);
        else process(file, content);
      });
    });
  }

  function watchTemplates(watchingAll) {
    self.templateFiles.forEach(function (file) {
      keepWarm(file, function (err, plate) {
        self.emit('templateChanged', file, plate);
      });
    });
  }

  function watchPartials() {
    self.partialFiles.forEach(function (file) {
      keepWarm(file, function (err, partial) {
        self.emit('partialChanged', file, partial);
      });
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

