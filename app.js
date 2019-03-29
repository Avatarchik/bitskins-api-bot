// Declaration of framework
const bodyParser = require("body-parser");
const express = require('express');
const path = require('path');
const app = express();

const port = 3000;
var httpServer = require("http").Server(app);

// Import controller
var api = require('./server/controllers/api');

// View engine setup
app.set('views', path.join(__dirname, 'server/views/pages'));
app.set('view engine', 'ejs');

//Use body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Application routes
// Get
app.get('/', api.show);

// Post
app.post('/getit',api.inventory);

module.exports = app;

app.set('port',port);

var server = httpServer.listen(app.get('port'), function() {
    console.log('http server listening on port '+ server.address().port)
});