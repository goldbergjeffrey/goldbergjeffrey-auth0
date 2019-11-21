const express = require('express');
const app = express();
const path = require('path');

app.use('/', express.static(__dirname +  '/'));

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

const hostname = 'goldbergjeffrey-pizza42.herokuapp.com';
const port = 3000;

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

const server = app.listen(process.env.PORT || 3000, hostname, () => {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env); 
});
