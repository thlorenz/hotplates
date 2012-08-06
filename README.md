# hotplates [![Build Status](https://secure.travis-ci.org/thlorenz/hotplates.png)](http://travis-ci.org/thlorenz/hotplates)

Registers partials, compiles handlebars templates and shoves them into the oven so you can serve them hot later.

Oh, and they are namespaced in reflection of the folder structure.

# Examples

Assuming your handlebars templates folder looks as follows:

templates
├── index.hbs
└── partials
....├── oven
....│   ├── filter
....│   │   ├── collector.hbs
....│   │   └── handle.hbs
....│   ├── index.hbs
....│   ├── rack
....│   │   └── grille.hbs
....│   └── top
....│       ├── burners.hbs
....│       └── dials.hbs
....└── site
........├── content.hbs
........├── footer.hbs
........└── header.hbs
 

1. Heat your templates and pass continuation function:

```javascript
hotplates.heat(
    { templates:
      { root: path.join(__dirname, 'templates')
      , directoryFilter: '!partials' 
      }
    , partials:
      { root: path.join(__dirname, 'templates', 'partials') }
    }
  , renderSite);
```

This registers the following partials with handlebars:

  site.content          
  site.footer           
  site.header           
  oven.index            
  oven.filter.collector 
  oven.filter.handle    
  oven.rack.grille      
  oven.top.burners      
  oven.top.dials        

They are now accessible under that name in other templates and partials.

It also compiles *index* and makes it accessible via `hotplates.oven.index`

2. In the continuation function start your server, etc. (in this example we'll open index page in the browser):

```javascript
function renderSite(err) {
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


  var rendered = hotplates.oven.index(ctx);
  fs.writeFileSync('./index.html', rendered);

  exec('open ' + './index.html');
}
```

Full example [here](https://github.com/thlorenz/hotplates/tree/master/examples).

# Installation

`npm install hotplates`

# API

## Heating templates

***heat(opts, hot)***

Heats your templates according to the given opts and calls back when they are hot.

At that point compiled templates are available in the oven and partials where registered with handlebars.

Typical opts:
```javascript
{ templates:
  { root: path.join(__dirname, 'templates') // tell hotplates where your templates are
  , directoryFilter: '!partials'            // don't compile partials
  }
, partials:
  { root: path.join(__dirname, 'templates', 'partials') } // register all my partials
}
```

Additional options can be given to `templates` and `partials`, most commonly you could change the fileFilter which defaults to `['*.hbs', '*.handlebars']`.

Since hotplates resolves templates and partials using [readdirp](https://github.com/thlorenz/readdirp),
refer to its [options documentation](https://github.com/thlorenz/readdirp#options).

## The oven

***hotplates.oven***

After you heated your templates, they are shoved into the oven, namespaced according to the path they where found in.

E.g., a template found at 'site/reader/book' will be stored as a compiled `Function` under `hotplates.oven.site.reader.book`.

## Registered Partials

Partials are registered in a similar fashion, but not shoved into the oven as they are registered with handlebars instead. 

However the namespacing schema for them is exactly the same.

Assuming the partial root was 'templates/partials', a partial found in 'templates/partials/book/page' 
will be accessible in other templates and partials under the name `book.page`.

## Burning templates

***burn()***

In order to remove all templates from the oven and unregister all partials, you can burn them.

This is useful in cases where you want to make sure that no obsolete templates or partials are sticking around.

## Reheat

Automatic reheating of templates and partials.

Useful especially while developing, to immediately update site with edited templates.

On its way - watch that space!

# Tests

Reading the [tests](https://github.com/thlorenz/hotplates/blob/master/test/hotplates.js) 
will make you more familiar with hotplates' api.
