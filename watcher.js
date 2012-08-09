var fs        =  require('fs')
  , events    =  require('events')
  , util      =  require('util')
  , minDuration = 1000
  , lastChange 
  , watchers  =  { }
  ;

function watch(file, eventName, update) {
  var fullPath = file.fullPath;

  if (watchers[fullPath]) return;
  
  watchers[fullPath] = true;

  fs.watch(fullPath, { persistent: true }, function (event) {
    if (event !== eventName) return;

    // Avoid duplicate fires in cases when two change events are raised for one actual change
    var now = new Date();
    if (!lastChange || now - lastChange > minDuration) {
      update(file);
      lastChange = now;
    }
  });
}

function Watcher (templateFiles, partialFiles, templateDirectories) {
  this.templateFiles       =  templateFiles;
  this.partialFiles        =  partialFiles;
  this.templateDirectories =  templateDirectories;
}

util.inherits(Watcher, events.EventEmitter);

Watcher.prototype.watchTemplatesAndPartials = function () {

  var self = this;

  function keepWarm(file, process) {
    watch(file, 'change', function (file) {
      fs.readFile(file.fullPath,function (err, content) {
        if (err) cb(err);
        else process(file, content.toString());
      });
    });
  }

  function watchTemplates(watchingAll) {
    self.templateFiles.forEach(function (file) {
      keepWarm(file, function (err, plate) {
        self.emit('templateChanged', file, plate);
        self.emit('fileChanged', file, plate);
      });
    });
  }

  function watchPartials() {
    self.partialFiles.forEach(function (file) {
      keepWarm(file, function (err, partial) {
        self.emit('partialChanged', file, partial);
        self.emit('fileChanged', file, partial);
      });
    });
  }

  function watchDirectories() {
    self.templateDirectories.forEach(function (directory) {
      watch(directory, 'rename', function (file) {
        self.emit('directoryChanged', directory);
      });
    });
  }

  watchTemplates();
  watchPartials();
  watchDirectories();
};

module.exports = {
  create: function (templateFiles, partialFiles, templateDirectories) {
    var watcher = new Watcher(templateFiles, partialFiles, templateDirectories);
    watcher.watchTemplatesAndPartials();
    return watcher;
  }
};

