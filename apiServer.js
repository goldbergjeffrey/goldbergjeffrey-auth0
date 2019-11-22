const express = require("express");
const jwt = require("express-jwt");
const jwtAuthz = require('express-jwt-authz');
const jwks = require("jwks-rsa");
const cors = require("cors");
const request = require("request");
const bodyParser = require("body-parser");
const path = require('path');

const AUTH0_CLIENT_ID='jpremUKrjbLQzEb87zhFgcWJifs0CaeM'; 
const AUTH0_DOMAIN='randomqliks.auth0.com'; 
const AUTH0_CALLBACK_URL='https://pizza42-app.herokuapp.com/callback';
const AUTH0_AUDIENCE = "https://goldbergjeffrey-pizza42";

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
    res.json({message:"Hello from the private endpoint. You are seeing this because you are authenticated!"});
});


//GET the extended user profile from Auth0
app.get("/api/getuser", function(req,res)
{

    var user = req.header("UserId");

    //Get an api from the management API
    return getAPIToken()
    .then(function(token)
    {
        //Get userinfo from the management API
        return getUserInfo(token,encodeURI(user))
        .then(function(body)
        {
            res.json({message: body});
        })
    })
});

//This method goes out to google people api twice. Once to get the profile picture and gender of the user,
//and then goes out to the collection endpoint to get contact count.
//Lastly it adds the information to the Auth0 profile for the google account, and then a rule in the admin layer merges the email and google profile if possible.
app.get("/api/getpeopledata", function(req,res)
{
    var result = {};
    var gToken = req.header('gAccess_token');
    var userId = req.header('UserId');

    //obtaining the access token on the login with google credentials
    return getGooglePeopleData(gToken)
    .then(function(peopleData)
    {
        console.log(peopleData)
        result.picture = JSON.parse(peopleData).photos.filter(function(photo)
        {
            return photo.metadata.source.type.toUpperCase() == "PROFILE";
        })
    
        result.gender = JSON.parse(peopleData).genders[0].value;
        return getGooglePeopleContactCount(gToken)
        .then(function(peopleCount)
        {
            result.contactCount = JSON.parse(peopleCount).totalPeople;
            return;
        }).then(function()
        {
            //add this information to the user profile
            var user_metadata = {
                "picture": result.picture[0].url,
                "user_metadata": {
                    "gender": result.gender,
                    "contactCount": result.contactCount
                }
            };
            return getAPIToken()
            .then(function(token)
            {
                return patchUserInfo(token,encodeURI(userId),user_metadata)
                .then(function(finish)
                {
                    res.json(result);
                })
            })
        })

    })
})

//Updates the Auth0 credential to email verified so profiles can be merged.
app.get("/api/verifyemail", function(req, res)
{
    var result = {};
    var userId = req.header('UserId');
    var user_metadata = {
        "email_verified": true
    };
    return getAPIToken()
    .then(function(token)
    {
        return patchUserInfo(token,encodeURI(userId),user_metadata)
        .then(function(finish)
        {
            res.json(result);
        })
    })
})


app.listen(process.env.PORT);
console.log("listening on https://localhost:" + process.env.PORT );


//Supporting functions

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

function patchUserInfo(token, user, JSONInfo)
{
    var options = {
        method: 'PATCH',
        url: `https://${AUTH0_DOMAIN}/api/v2/users/${user}`,
        headers: {
            'content-type':'application/json',
            authorization: 'Bearer ' + token
        },
        body: JSON.stringify(JSONInfo)
    }

    return new Promise(resolve => {
        request(options,function(error,response,body)
        {
            if(error) throw new Error(error);

            resolve(`${response.statusCode}: ${response}`);
        })
    })
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
            resolve(access_token);
    })});
}

function getGooglePeopleData(identity)
{
    var options = {
        method: 'GET',
        url: 'https://people.googleapis.com/v1/people/me?personFields=genders,photos',
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