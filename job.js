const cronJob = require('cron').CronJob;
const mongoose = require('mongoose');
const axios = require('axios');
const router = require('./router.js');

exports.reminderJob = function() {
  new cronJob('*/5 * * * *', () => {
    const now = new Date();
    router.Reminder.find({nextExecution: { $lt: now }}, (err, foundUsers) => {
      foundUsers.forEach((user) => {
        const completeNumber = user.code + user.number;
        const nextExecution = user.nextExecution.setDate(user.nextExecution.getDate() + 1);

        const data = JSON.stringify({"name": user.name,"fullNumber": completeNumber, "pillCount": user.pillCount, "code": user.code, "number": user.number });
        var config = {
          method: 'post',
          url: process.env.MESSAGEBIRD_FLOW,
          headers: {
            'Content-Type': 'application/json'
          },
          data : data
        };

        axios(config)
          .then(function (response) {
            console.log(JSON.stringify(response.data));
            router.Reminder.findOneAndUpdate({
                number: user.number,
                code: user.code
              }, {
                nextExecution: nextExecution,
              }, {
                new: true,
              }, (err, foundUser) => {
                if (err) {
                  console.log(err);
                }
              });
          })
          .catch(function (error) {
            console.log(error);
          });
      });
    });
  }, null, true, 'America/Bogota').start();
}
