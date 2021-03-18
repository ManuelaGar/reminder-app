/*jshint esversion: 6 */

require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const router = require('./router.js');
const job = require('./job.js');

let port = process.env.PORT;
if (port == null || port == '') {
  port = 3000;
}

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/', router.router);
app.jobs = job.reminderJob();

app.listen(port, () => {
  console.log('Server started successfullly.');
});
