const cronJob = require('cron').CronJob;
const {
  https
} = require('follow-redirects');
const fs = require('fs');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require(__dirname + '/app.js');

exports.reminderJob = function() {
  new cronJob('*/5 * * * *', () => {
    //TODO: FIND EN BD
    const now = new Date();
    console.log(now);
    console.log('pasaron 5 min');
    // const data = JSON.stringify({"name":"exampleValue1","number":"exampleValue2"});
    // var config = {
    //   method: 'post',
    //   url: 'https://flows.messagebird.com/flows/95aa582f-a145-4cc7-81e0-99fc5e340262/invoke',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   data : data
    // };
    //
    // axios(config)
    //   .then(function (response) {
    //     console.log(JSON.stringify(response.data));
    //   })
    //   .catch(function (error) {
    //     console.log(error);
    //   });

  }, null, true, 'America/Bogota').start();
}
