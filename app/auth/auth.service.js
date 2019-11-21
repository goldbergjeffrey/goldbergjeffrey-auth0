(function () {

  'use strict';

  angular
    .module('app')
    .service('authService', authService);

  authService.$inject = ['$state', 'angularAuth0', '$timeout', '$http'];

  function authService($state, angularAuth0, $timeout, $http) {

    var accessToken;
    var idToken;
    var expiresAt;
    var userProfile;
    var heroku = 'https://goldbergjeffrey-pizza42.herokuapp.com:4500/';

    function getIdToken() {
      return idToken;
    }

    function getAccessToken() {
      return accessToken;
    }

    function login() {
      angularAuth0.authorize();
    }

    function handleAuthentication() {
      angularAuth0.parseHash(function(err, authResult) {
        if (authResult && authResult.accessToken && authResult.idToken) {
          localLogin(authResult);
          $state.go('home');
        } else if (err) {
          $timeout(function() {
            $state.go('home');
          });
          console.log(err);
          alert('Error: ' + err.error + '. Check the console for further details.');
        }
      });
    }

    function localLogin(authResult) {
      // Set isLoggedIn flag in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      // Set the time that the access token will expire at
      expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();
      accessToken = authResult.accessToken;
      idToken = authResult.idToken;
      localStorage.setItem('access_token',accessToken);
      localStorage.setItem('id_token',idToken);
      getProfile(function(err, profile) {
        getGoogleProfile();
      });
      
    }

    function renewTokens() {
      angularAuth0.checkSession({},
        function(err, result) {
          if (err) {
            console.log(err);
          } else {
            localLogin(result);
          }
        }
      );
    }

    function logout() {
      // Remove isLoggedIn flag from localStorage
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');

      // Remove tokens and expiry time
      accessToken = '';
      idToken = '';
      expiresAt = 0;

      angularAuth0.logout({
        returnTo: window.location.origin
      });

      $state.go('home');
    }

    function isAuthenticated() {
      // Check whether the current time is past the 
      // access token's expiry time
      return localStorage.getItem('isLoggedIn') === 'true' && new Date().getTime() < expiresAt;
    }

    function getProfile(cb) {
      if (!accessToken) {
        throw new Error('Access Token must exist to fetch profile');
      }
      angularAuth0.client.userInfo(accessToken, function(err, profile) {
        if (profile) {
          setUserProfile(profile);
        }
        cb(err, profile);
      });
    }
    
    function setUserProfile(profile) {
      userProfile = profile;
    }
    
    function getCachedProfile() {
      return userProfile;
    }

    function getGoogleProfile() {
      $http.get(heroku + "api/getuser",
      {
        headers: {
          UserId: userProfile.sub
        }
      }).then(function(response)
      {
        return response.data.message; 
      })
      .then(function(extProfile)
      {
        var profileArray = parseProfile(JSON.parse(extProfile).identities,'google-oauth2')
        if(Array.isArray(profileArray) && profileArray.length)
        {
          getGoogleData(extProfile);
        }

      })
      .catch(function(error)
      {
        alert('Error: ' + JSON.stringify(error) + '. Check the console for further details.');
      });
    }

    function getGoogleData(extendedProfile) {
      var identity = parseProfile(JSON.parse(extendedProfile).identities,'google-oauth2');
      $http.get(heroku + "api/getpeopledata",
      {
        headers: {
          gAccess_token: identity[0].access_token,
          UserId: userProfile.sub
        }
      }).then(function(response)
      {
        //alert("google gender(" + response.data.gender + ") and contact count(" + response.data.contactCount + ") acquired.")
      }).catch(function(error)
      {
        alert('Error: ' + JSON.stringify(error) + '. Check the console for further details.');
      });
    }

    function parseProfile(data, providerName)
    {
      let identity = data.filter(function(item)
      {
        return item.provider ===providerName;
      })
      return identity;
    }

    return {
      login: login,
      getIdToken: getIdToken,
      getAccessToken: getAccessToken,
      handleAuthentication: handleAuthentication,
      logout: logout,
      isAuthenticated: isAuthenticated,
      renewTokens: renewTokens,
      getProfile: getProfile,
      getCachedProfile: getCachedProfile,
      heroku:heroku
    }
  }
})();
