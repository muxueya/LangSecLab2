// Routes for signup and login/logout
const express = require('express')
const router = express.Router()
const mongo = require('../db')
const passport = require('passport')
require('../passport')


// Middleware requiring the user to be authenticated
function validatePassword(req, res, next) {
  let pass = req.body.password;
  let name = req.body.username;

  // FIX (ReDoS): use plain string inclusion check instead of regex match.
  // Previously `pass.match(name)` used the username as a regex pattern, enabling
  // an attacker to register with a ReDoS pattern (e.g. ^(a+)+$) as their username
  // and cause catastrophic backtracking that blocks the Node.js event loop.
  if (pass.toLowerCase().includes(name.toLowerCase())) {
    req.flash('error', 'Do not include name in password.')
    req.flash('message', 'Do not include name in password.')
    return res.redirect('/register')
  }

  next()
}

function validatePlate(req, res, next) {
  let plate = req.body.plate;

  if(plate.length != 6) {
    req.flash('error', 'License plates are conformed of 6 characters')
    return res.redirect('/register')
  }

  const validChars = /^[ABCDE\d]+$/; // regex pattern that matches A, B, C, D, E or digits
  if(!validChars.test(plate))
  {
    req.flash('error', 'License plates should be a compound of A,B,C,D,E letters or digits');
    return res.redirect('/register')
  }

  next()
}

router
  // POST signup via passport local strategy
  .post('/signup', validatePlate, validatePassword, passport.authenticate('local-register', {
    successRedirect: '/',
    failureRedirect: '/register',
    failureFlash: true,
    successFlash: 'Account created!'
  }))

  // POST login via passport local strategy
  .post('/login', passport.authenticate('local', {
    successRedirect: 'back',
    failureRedirect: 'back',
    failureFlash: true
  }))

  // GET Logout and redirect
  .get('/logout', (req, res) => {
    req.logout()
    // If the previous page is one of these, redirect to home
    if(req.header("Referer") === 'http://localhost:3000/other/admins'
    || req.header("Referer") === 'http://localhost:3000/settings'
    ) {
      res.redirect('/')
    // Else return to the previous page
    }else {
      res.redirect('back')
    }
  })

// Export these routes to be used in app.js
module.exports = router
