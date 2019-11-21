const express = require("express");
const jwt = require("express-jwt");
const jwtAuthz = require('express-jwt-authz');
const jwks = require("jwks-rsa");
const cors = require("cors");
const request = require("request");
const bodyParser = require("body-parser");

const AUTH0_CLIENT_ID='jpremUKrjbLQzEb87zhFgcWJifs0CaeM'; 
const AUTH0_DOMAIN='randomqliks.auth0.com'; 
const AUTH0_CALLBACK_URL='http://localhost:3000/callback';
const AUTH0_AUDIENCE = "https://goldbergjeffrey-pizza42";

console.log(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`);

const app = express();
app.use(cors());
app.use(bodyParser.json())

const authCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit:true,
        jwksRequestsPerMinute:5,
        jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    audience: AUTH0_AUDIENCE,
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});

const checkScopes = jwtAuthz([ 'read:messages' ]);

app.get("/api/public", function(req,res)
{
    res.json({message:"The public api is working and you don't need to be authenticated"});
});

app.get("/api/private", authCheck, function(req,res)
{
    console.log("in the private api call")
    res.json({message:"Hello from the private endpoint. You are seeing this because you are authenticated!"});
});

app.get("/api/getuser", function(req,res)
{
    console.log("in the getuser");

    var user = req.header("UserId");

    return getAPIToken()
    .then(function(token)
    {
//        console.log(token);
        return getUserInfo(token,encodeURI(user))
        .then(function(body)
        {
//            console.log(body);
            res.json({message: body});
        })
    })
});

app.get("/api/getpeopledata", function(req,res)
{
    var result;
    console.log("getGooglePeopleData");
    var gToken = req.header('gAccess_token');
    console.log(gToken);
    return getGooglePeopleGender(gToken)
    .then(function(peopleData)
    {
        console.log(peopleData);
//        result.peopleData = peopleData
        return getGooglePeopleContactCount(gToken)
        .then(function(peopleCount)
        {
            
            console.log(JSON.parse(peopleCount).totalPeople);
            console.log(typeof(peopleCount));
//            result.contactCount = peopleCount.totalPeople;
            res.json({message: "yippee!"});
        })

    })
})
    

app.listen(3001);
console.log("listening on http://localhost:3001");

function getUserInfo(token, user)
{
    var options = {
        method: 'GET',
        url: `https://${AUTH0_DOMAIN}/api/v2/users/${user}`,
        headers: {
            authorization: 'Bearer ' + token
        }
      };
      
      return new Promise(resolve => {
        request(options, function (error, response, body) {
        if (error) throw new Error(error);
        
        resolve(body);
    })});
}

function getAPIToken()
{
    var options = { method: 'POST',
  url: 'https://randomqliks.auth0.com/oauth/token',
  headers: { 'content-type': 'application/json' },
  body: '{"client_id":"NBe5ugM8DKo42NEwJ5t67FCR6mx10e1r","client_secret":"ULwACJ5F-c8v3zAKg5sKb3Dr8qcOFqg-4KxZMvuJMzDd2ARD8CZ8GOCiuD4dw4hD","audience":"https://randomqliks.auth0.com/api/v2/","grant_type":"client_credentials"}' };

    return new Promise(resolve => {
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            let access_token = JSON.parse(body).access_token;
            //console.log(access_token);
            resolve(access_token);
    })});
}

function getGooglePeopleGender(identity)
{
    var options = {
        method: 'GET',
        url: 'https://people.googleapis.com/v1/people/me?personFields=genders',
        headers: {
            Authorization: 'Bearer ' + identity
        }
      };
      
      return new Promise(resolve => {
        request(options, function (error, response, body) {
        if (error) throw new Error(error);
        
        resolve(body);
    })});
}

function getGooglePeopleContactCount(identity)
{
    var options = {
        method: 'GET',
        url: 'https://people.googleapis.com/v1/people/me/connections?personFields=names',
        headers: {
            Authorization: 'Bearer ' + identity
        }
      };
      
      return new Promise(resolve => {
        request(options, function (error, response, body) {
        if (error) throw new Error(error);
        
        resolve(body);
    })});
}