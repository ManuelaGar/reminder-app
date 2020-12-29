const bodyParser = require('body-parser');
const ejs = require('ejs');
const express = require('express');
const messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
const moment = require('moment');
const mongoose = require('mongoose');

const router = express.Router();

mongoose.connect(process.env.MONGODB_ATLAS, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

const reminderSchema = {
  name: String,
  code: String,
  number: String,
  time: String,
  creationDate: Date,
  nextExecution: Date
}

const Reminder = mongoose.model('Reminder', reminderSchema);

router.get('/', function(req, res) {
  res.render('home', {
    time: moment().format('HH:mm')
  });
});

router.get('/contact', function(req, res) {
  res.render('contact');
});

router.get('/how', function(req, res) {
  res.render('how');
});

router.get('/delete', function(req, res) {
  res.render('delete');
});

router.get('/update', function(req, res) {
  res.render('update', {
    time: moment().format('HH:mm')
  });
});

router.post('/book', function(req, res) {
  // Check if user has provided input for all form fields
  if (!req.body.name || !req.body.number || !req.body.time || !req.body.code ||
    req.body.name == '' || req.body.number == '' || req.body.time == '' || req.body.code == '') {
    // If not, show an error
    res.render('error', {
      error: 'Por favor llena todos los campos!',
      name: req.body.name,
      number: req.body.number,
      code: req.body.code,
      time: req.body.time
    });
    return;
  }

  // Check if phone number is valid
  completeNumber = req.body.code + req.body.number;
  messagebird.lookup.read(completeNumber, process.env.COUNTRY_CODE, function(err, response) {
    console.log(response);

    if (err && err.errors[0].code == 21) {
      // This error code indicates that the phone number has an unknown format
      res.render('error', {
        error: 'Debes ingresar un número telefónico válido!',
        name: req.body.name,
        number: req.body.number,
        code: req.body.code,
        time: req.body.time
      });
      return;
    } else
    if (err) {
      console.log(err);
      // Some other error occurred
      res.render('error', {
        error: 'Se produjo un error al verificar tu número de teléfono.',
        name: req.body.name,
        number: req.body.number,
        code: req.body.code,
        time: req.body.time
      });
    } else
    if (response.type != 'mobile') {
      // The number lookup was successful but it is not a mobile number
      res.render('error', {
        error: 'Ingresaste un número válido, pero no es un número de celular. Por favor ingresa un número móvil para que podamos contactarte.',
        name: req.body.name,
        number: req.body.number,
        code: req.body.code,
        time: req.body.time
      });
    } else {
      // Everything OK

      const now = new Date();
      const reminderString = moment().format('Y-MM-DD') + ' ' + req.body.time;
      let reminderDate = new Date(reminderString);

      if (now >= reminderDate) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      Reminder.findOneAndUpdate({
        number: req.body.number,
        code: req.body.code
      }, {
        name: req.body.name,
        code: req.body.code,
        number: req.body.number,
        time: req.body.time,
        creationDate: now,
        nextExecution: reminderDate,
      }, {
        new: true,
        upsert: true
      }, (err, foundUser) => {
        if (err) {
          console.log(err);
        } else {
          res.render('confirm', foundUser);
        }
      });
    }
  });
});

router.post('/delete', (req, res) => {
  Reminder.findOneAndDelete({
    number: req.body.number,
    code: req.body.code
  }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      res.render('confirm_delete', foundUser);
    }
  });
});

router.post('/update', (req, res) => {
  const now = new Date();
  const reminderString = moment().format('Y-MM-DD') + ' ' + req.body.time;
  let reminderDate = new Date(reminderString);

  if (now >= reminderDate) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  Reminder.findOneAndUpdate({
    number: req.body.number,
    code: req.body.code
  }, {
    time: req.body.time,
    nextExecution: reminderDate,
  }, {
    new: true
  }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      res.render('confirm', foundUser);
    }
  });
})

module.exports = {
  router: router,
  Reminder: Reminder
};
