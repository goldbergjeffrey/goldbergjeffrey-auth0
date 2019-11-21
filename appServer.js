const express = require('express');
const app = express();
const path = require('path');

app.use('/', express.static(__dirname +  '/'));

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

const hostname = '0.0.0.0';
const port = 3000;

const server = app.listen(process.env.PORT || 3000, hostname, () => {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env); 
});
