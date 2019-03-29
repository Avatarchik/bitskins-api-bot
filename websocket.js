var express = require('express');
var Pusher = require('pusher-client');

var pusher = new Pusher('c0eef4118084f8164bec65e6253bf195', {
    encrypted: true,
    wsPort: 443,
    wssPort: 443,
    host: 'notifier.bitskins.com'
});

pusher.connection.bind('connected', function() {
    // connected to realtime updates 
    console.log(" -- connected to websocket");
});

pusher.connection.bind('disconnected', function() {
    // not connected to realtime updates
    console.log(" -- disconnected from websocket");
});

var events_channel = pusher.subscribe("inventory_changes"); // use the relevant channel, see docs below

events_channel.bind("listed", function(data) {
    // use the relevant event type, see docs below
    // print out any data received for the given event type
    console.log(" -- got data: " + JSON.stringify(data));
});


var app = express();

app.use(function(req, res, next) {
  req.rawBody = "";
  req.setEncoding("utf8");

  req.on("data", function(chunk) {
    req.rawBody += chunk;
  });

  req.on("end", function() {
    next();
  });
});

app.post("/webhook", function(req, res){
  var webhook = pusher.webhook(req);
  console.log("data:", webhook.getData());
  console.log("events:", webhook.getEvents());
  console.log("time:", webhook.getTime());
  console.log("valid:", webhook.isValid());
  res.send("OK");
});

app.listen(3000);