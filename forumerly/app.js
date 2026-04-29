// Start file
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const helmet = require('helmet');
const RedisStore = require('connect-redis')(session)
const secrets = require('./secrets')
const stats = require("./stats")
const options = require('./options')
const locations = require("./locations")
const slots = require("./park_slots.js")
const passport = require('passport')
const moment = require('moment-timezone')
const flash = require('connect-flash')
var useragent = require('ua-parser-js')

var app = express()

var bots = ["googlebot","spider","bingbot","yandexbot","ahrefsbot","msnbot","linkedinbot","exabot","compspybot",
"yesupbot","paperlibot","tweetmemebot","semrushbot","gigabot","voilabot","adsbot-google",
"botlink","alkalinebot","araybot","undrip bot","borg-bot","boxseabot","yodaobot","admedia bot",
"ezooms.bot","confuzzledbot","coolbot","internet cruiser robot","yolinkbot","diibot","musobot",
"dragonbot","elfinbot","wikiobot","twitterbot", "twitterbot","facebot","contextad bot","hambot","iajabot","news bot",
"irobot","socialradarbot","ko_yappo_robot","skimbot","psbot","rixbot","seznambot","careerbot",
"simbot","solbot","mail.ru_bot","spiderbot","blekkobot","bitlybot","techbot","void-bot",
"vwbot_k","diffbot","friendfeedbot","archive.org_bot","woriobot","crystalsemanticsbot","wepbot",
"spbot","tweetedtimes bot","mj12bot","who.is bot","psbot","robot","jbot","bbot","bot","screaming frog", "facebookexternalhit/1.1",
         "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
]

// Global partials values for the view engine (to avoid having to define the path for each request)
app.locals.partials = {navbar: 'partials/navbar', footer: 'partials/footer', head: 'partials/head', park: 'partials/park'}

// App setup
app
  .set('view engine', 'hjs')
  .use(express.static(__dirname + '/public'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended: false}))

  // Sessions and passport setup
  .use(session({
    store: new RedisStore(options.redis),
    secret: secrets.session_secret,
    name: 'sid.fixed',      // distinct cookie name — avoids collision with vulnerable instance on port 3000
    resave: false,
    saveUninitialized: false
  }))
  // FIX (CSP / XSS): removed ajax.googleapis.com and cdnjs.cloudflare.com from
  // scriptSrc.  Those hosts allowed an attacker to load AngularJS (script gadget)
  // or exploit JSONP endpoints to bypass CSP and execute arbitrary JavaScript.
  // jQuery is now served locally (/javascript/jquery.min.js) so googleapis is
  // no longer needed.  use.fontawesome.com is retained for icon rendering only;
  // it does not host arbitrary libraries and has no JSONP endpoints.
  .use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "use.fontawesome.com"],
      objectSrc:  ["'none'"],
      frameAncestors: ["'none'"],
      baseUri:    ["'self'"]
    }
  }))
  .use(passport.initialize())
  .use(passport.session())
  .use(flash())

  // Whenever any page is loaded, set global user variable to be accessed by the view engine
  .use((req, res, next) => {
    if (req.user) {
      app.locals.user = req.user
    }
    app.locals.authenticated = req.isAuthenticated()
    next()
  })

  .get('/', (req, res) => {

    // Check for user agents
    var headers = req.headers["user-agent"];
    var agent = new useragent.UAParser(headers)

    stats.registerVisit(agent)

    stats.getStats(st => {
      locations.getLocations(locations => {
         if(req.isAuthenticated) {
            slots.getParked(req.user, (slots) => {

                  res.render('forumHome', {user: req.user, error: req.flash('error'), success: req.flash('success'), stats: st, locations:locations, slots: slots})
    })

         } else {
    res.render('forumHome', {user: req.user, error: req.flash('error'), success: req.flash('success'), stats: st, slots: [], locations:locations})

         }

      })
  })})
  .get('/register', (req, res) => {
    res.render('register', {message: req.flash('error')})
  })

  // External routing
  .use(require('./routes/user'))
  .use(require('./routes/auth'))
  .use(require('./routes/forum'))
  .use(require('./routes/park'))

  .listen(options.port, () => {
    console.log('Server now listening on port 3000...')
  })
  .on('error', (error) => {
    console.error(error)
  })
