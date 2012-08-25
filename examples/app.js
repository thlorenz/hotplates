var hotplates  =  require('../hotplates')
  , preheat    =  require('../preheat')
  , handlebars =  require('handlebars')
  , path       =  require('path')
  , fs         =  require('fs')
  , exec       =  require('child_process').exec
  ;

preheat(
    { amd: true
    , handlebarsPath: '../node_modules/handlebars'
    , target: path.join(__dirname, 'preheated.js')
    }
  , function (err, data) {
      if (err) console.error(err);
      else console.log('preheated templates');
    }
  );

hotplates
  .on('templateCompiled', function (fileInfo, name) { 
    console.log('Compiled: \t[ %s ] as [ %s ]', fileInfo.path, name); 
  })
  .on('partialRegistered', function (fileInfo, name) { 
    console.log('Registered:\t[ %s ] as [ %s ]', fileInfo.path, name); 
  })
  .heat(
    { templates:
      { root: path.join(__dirname, 'templates')
      , directoryFilter: '!partials' 
      }
    , partials:
      { root: path.join(__dirname, 'templates', 'partials') }
    }
  , renderSite);


function renderSite(err) {
  if (err) console.log('There was an error when heating your plates', err);
  
  var ctx = 
    { site: 
      { title: 'Willie Slater\'s HotPlater'
      , header: 
        { title: 'Willie Slater makes your HotPlater'
        , subtitle: 'Instructions on how to maintain your hotplates oven' 
        }
      }
    , oven:
        { filter:
          { handle: { how: 'very carefully' }
          }
        , top:
          { burners: { degrees: 250 } 
          , dials:   { maxDegress: 500 }
          }
        }
    };

  var rendered = handlebars.templates['index'](ctx);
  fs.writeFileSync('./index.html', rendered);

  exec('open ' + './index.html');
}
