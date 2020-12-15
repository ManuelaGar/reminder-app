# Daily WhatsApp Medication Reminders

## Why build WhatsApp medication reminders?

Setting a daily alarm as a reminder to take your medication is quick and easy. The problem, however, is that it is just as easy to stop them and forget taking your medication.

Forgetting to take your medication is annoying and costly  to your health in the long run. Timely WhatsApp reminders act as a simple and discrete nudges, which can go a long way in helping you take your medication correctly.

## Getting Started

This application is based on a MessageBird example website of a fictitious online beauty salon called *BeautyBird*. To reduce the growing number of no-shows, BeautyBird now collects appointment bookings through a form on their website and schedules timely SMS reminders to be sent out three hours before the selected date and time.

To look at the full sample application or run it on your computer, go to the [MessageBird Developer Guides GitHub repository](https://github.com/messagebirdguides/reminders-guide) and clone it or download the source code as a ZIP archive. You will need Node and npm to run the example, which you can easily [install from npmjs.com](https://www.npmjs.com/get-npm).

````bash
npm install
````

## Configuring the MessageBird SDK

The SDK is loaded with the following `require()` statement in `index.js`:

````javascript
// Load and initialize MesageBird SDK
var messagebird = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
````

The MessageBird API key needs to be provided as a parameter.

 **Pro-tip:** Hardcoding your credentials in the code is a risky practice that should never be used in production applications. A better method, also recommended by the [Twelve-Factor App Definition](https://12factor.net/), is to use environment variables. We've added [dotenv](https://www.npmjs.com/package/dotenv) to the sample application, so you can supply your API key in a file named `.env`, too:

````env
MESSAGEBIRD_API_KEY=YOUR-API-KEY
````

API keys can be created or retrieved from the [API access (REST) tab](https://dashboard.messagebird.com/en/developers/access) in the _Developers_ section of your MessageBird account.

## Collecting User Input

In order to send SMS messages to users, you need to collect their phone number as part of the booking process. We have created a sample form that asks the user for their name, number and time for the daily reminder. For HTML forms it's recommended to use `type="tel"` for the phone number input. You can see the template for the complete form in the file `views/home.handlebars` and the route that drives it is defined as `app.get('/')` in `index.js`.

## Storing Appointments & Scheduling Reminders

The user's input is sent to the route `app.post('/book')` defined in `index.js`. The implementation covers the following steps:

### Step 1: Check their input

Validate that the user has entered a value for every field in the form.


### Step 2: Check their phone number

Check whether the phone number is correct. This can be done with the [MessageBird Lookup API](https://developers.messagebird.com/docs/lookup#lookup-request), which takes a phone number entered by a user, validates the format and returns information about the number, such as whether it is a mobile or fixed line number. This API doesn't enforce a specific format for the number but rather understands a variety of different variants for writing a phone number, for example using different separator characters between digits, giving your users the flexibility to enter their number in various ways. In the SDK, you can call `messagebird.lookup.read()`:

````javascript
// Check if phone number is valid
messagebird.lookup.read(req.body.number, process.env.COUNTRY_CODE, function (err, response) {
    // ...
````

The function takes three arguments; the phone number, a country code and a callback function. Providing a default country code enables users to supply their number in a local format, without the country code.

To add a country code, add the following line to you `.env` file, replacing NL with your own ISO country code:
````env
COUNTRY_CODE=NL
````

In the callback function, we handle four different cases:
* An error (code 21) occurred, which means MessageBird was unable to parse the phone number.
* Another error code occurred, which means something else went wrong in the API.
* No error occurred, but the value of the response's `type` attribute is something other than `mobile`.
* Everything is OK, which means a mobile number was provided successfully.

````javascript
    if (err && err.errors[0].code == 21) {
            // This error code indicates that the phone number has an unknown format
            res.render('error', {
                error : "You need to enter a valid phone number!",
                name : req.body.name,
                number: req.body.number,
                time : req.body.time
            });
            return;
        } else
        if (err) {
            // Some other error occurred
            res.render('error', {
                error : "Something went wrong while checking your phone number!",
                name : req.body.name,
                number: req.body.number,
                time : req.body.time
            });
        } else
        if (response.type != "mobile") {
            // The number lookup was successful but it is not a mobile number
            res.render('error', {
                error : "You have entered a valid phone number, but it's not a mobile number! Provide a mobile number so we can contact you via SMS.",
                name : req.body.name,
                number: req.body.number,
                time : req.body.time
            });
        } else {
            // Everything OK
````

The implementation for the following steps is contained within the last `else` block.

### Step 3: Schedule the reminder

Using *moment*, we can easily specify the time for our reminder:

````javascript
// Take time and split it in hours and minutes
const timeArray = req.body.time.split(':');
const hour = timeArray[0];
const minutes = timeArray[1];

// Create a pattern for the cron job to execute the task everyday at the same time
const pattern = '0 ' + minutes + ' ' + hour + ' * * *';
````

Then it's time to call MessageBird's API:

````javascript
// Send scheduled message using WhatsApp
new cronJob(pattern, () => {
  messagebird.conversations.start({
    'to': '573216439960',
    'channelId': 'd04e88f144ec44cc8b813bc65b38a3d8', // Sandbox channelId
    'type': 'text',
    'content': {
      'text': 'Hola ' + req.body.name + ', recuerda tomarte tu pastilla anticonceptiva.'
    }
  }, function(err, response) {
    if (err) {
      // Request has failed
      console.log(err);
      res.send("Ocurrió un error al enviar tu mensaje!");
    }
    // Request was successful
    console.log(response);
  });

}, null, true, 'America/Bogota').start();
    // ...
````

## Testing the Application

Now, let's run the following command from your console:

````bash
node index.js
````

Then, point your browser at http://localhost:3000/ to see the form and schedule your appointment! If you've used a live API key, a message will arrive to your phone at the set time!
