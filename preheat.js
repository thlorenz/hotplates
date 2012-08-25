var fs         =  require('fs')
  , handlebars =  require('handlebars')
  , hotplates  =  require('./hotplates')
  , plates  
  , partials
  , header
  , footer
  , preheated
  , target
  , batching
  ;

function preheat(opts, cb) {
  
  preheated = cb || function () { };

  plates = {};
  partials = {};

  header = opts.amd ?
    'require([\'' + opts.handlebarsPath + '/handlebars\'], function(Handlebars) {\n' :
    '(function() {\n';

  header = header + 
    '  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n';

  footer = opts.amd ?  '});' : '})();';
  target = opts.target;

  hotplates.on('templateCompiled', function (file, name, plate) {
    plates[name] = plate;
    update();
  });

  hotplates.on('partialRegistered', function (file, name, partial) {
    partials[name] = partial;
    update();
  });

  hotplates.on('burned', function () {
    plates =  {};
    partials = {};
  });

  hotplates.on('batchStarted', function () {
    batching = true;  
  });

  hotplates.on('batchEnded', function () {
    batching = false;  
    update();
  });
}

function update () {
  
  // When heating templates in batch, don't precompile them each time, but rather when the batch ended
  if (batching) return;

  var output = [];

  output.push(header);

  Object.keys(plates).forEach(function (name) {
    output.push('templates[\'' + name + '\'] = template(' + handlebars.precompile(plates[name]) + ');\n');
  });

  Object.keys(partials).forEach(function (name) {
      output.push('Handlebars.registerPartial(\'' + name + '\', ' + 
                  'template(' + handlebars.precompile(partials[name]) + '));\n');
  });

  output.push(footer);
  
  output = output.join('');


  fs.writeFile(target, output, function (err) {
    if (err) console.trace();
    preheated(err, output);
  });
}

module.exports = preheat;
