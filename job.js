const cronJob = require('cron').CronJob;
const mongoose = require('mongoose');
const axios = require('axios');
const router = require('./router.js');

exports.reminderJob = function() {
  new cronJob('*/5 * * * *', () => {
    const now = new Date();
    router.Reminder.find({nextExecution: { $lt: now }}, (err, foundUsers) => {
      console.log(foundUsers);
      foundUsers.forEach((user) => {
        const completeNumber = user.code + user.number;
        const nextExecution = user.nextExecution.setDate(user.nextExecution.getDate() + 1);

        const data = JSON.stringify({"name": user.name,"number": completeNumber});
        var config = {
          method: 'post',
          url: 'https://flows.messagebird.com/flows/95aa582f-a145-4cc7-81e0-99fc5e340262/invoke',
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
