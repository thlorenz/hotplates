var hotplates  =  require('../hotplates')
  , handlebars =  require('handlebars')
  , path       =  require('path')
  , fs         =  require('fs')
  , exec       =  require('child_process').exec
  ;

hotplates.heat(
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


    console.log(handlebars.partials);
    return;
  var rendered = hotplates.oven.index(ctx);
  fs.writeFileSync('./index.html', rendered);

  exec('open ' + './index.html');
}
