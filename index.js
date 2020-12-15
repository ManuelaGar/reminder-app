const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const moment = require('moment');
const ejs = require("ejs");
const cronJob = require('cron').CronJob;
const {
  https
} = require('follow-redirects');
const fs = require('fs');
const mongoose = require("mongoose");

require('dotenv').config();

var messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_ATLAS, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ReminderDatabase = [];

const reminderSchema = {
  name: String,
  number: String,
  time: String,
}

const Reminder = mongoose.model("Reminder", reminderSchema);

app.get('/', function(req, res) {
  res.render('home', {
    time: moment().format('HH:mm')
  });
});

app.get('/contact', function(req, res) {
  res.render('contact');
});

app.get('/how', function(req, res) {
  res.render('how');
});

// Process an incoming booking
app.post('/book', function(req, res) {

  // Check if user has provided input for all form fields
  if (!req.body.name || !req.body.number || !req.body.time ||
    req.body.name == '' || req.body.number == '' || req.body.time == '') {
    // If not, show an error
    res.render('error', {
      error: "Por favor llena todos los campos!",
      name: req.body.name,
      number: req.body.number,
      time: req.body.time
    });
    return;
  }

  // Check if phone number is valid
  messagebird.lookup.read(req.body.number, process.env.COUNTRY_CODE, function(err, response) {
    console.log(err);
    console.log(response);

    if (err && err.errors[0].code == 21) {
      // This error code indicates that the phone number has an unknown format
      res.render('error', {
        error: "Debes ingresar un número telefónico válido!",
        name: req.body.name,
        number: req.body.number,
        time: req.body.time
      });
      return;
    } else
    if (err) {
      console.log(err);
      // Some other error occurred
      res.render('error', {
        error: "Se produjo un error al verificar tu número de teléfono",
        name: req.body.name,
        number: req.body.number,
        time: req.body.time
      });
    } else
    if (response.type != "mobile") {
      // The number lookup was successful but it is not a mobile number
      res.render('error', {
        error: "Ingresaste un número válido, pero no es un número de celular. Por favor ingresa un número móvil para que podamos contactarte.",
        name: req.body.name,
        number: req.body.number,
        time: req.body.time
      });
    } else {
      // Everything OK

      const timeArray = req.body.time.split(':');
      const hour = timeArray[0];
      const minutes = timeArray[1];
      const pattern = '0 ' + minutes + ' ' + hour + ' * * *';

      const reminder = new Reminder({
        name: req.body.name,
        number: req.body.number,
        time: req.body.time,
      });

      reminder.save((err) => {
        if (!err) {
          res.render('confirm', {
            name: req.body.name,
            number: req.body.number,
            time: req.body.time,
          });
        }
      });

      new cronJob(pattern, () => {
        const options = {
          'method': 'POST',
          'hostname': 'flows.messagebird.com',
          'path': process.env.MESSAGEBIRD_FLOW_PATH,
          'headers': {
            'Content-Type': 'application/json'
          },
          'maxRedirects': 20
        };

        const request = https.request(options, (response) => {
          const chunks = [];

          response.on("data", function(chunk) {
            chunks.push(chunk);
          });

          response.on("end", function(chunk) {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
          });

          response.on("error", function(error) {
            console.error(error);
          });
        });

        const postData = JSON.stringify({
          "name": req.body.name,
          "number": req.body.number
        });
        request.write(postData);
        request.end();

      }, null, true, 'America/Bogota').start();
    }
  });
});

app.listen(port, () => {
  console.log("Server started successfullly.");
});
