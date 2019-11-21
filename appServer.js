const express = require('express');
const app = express();
const path = require('path');

app.use('/', express.static(__dirname +  '/'));

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

const hostname = '0.0.0.0';
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, hostname, () => {
  console.log(`API is running on port ${ PORT }`);
});
