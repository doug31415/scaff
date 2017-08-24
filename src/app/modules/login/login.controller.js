/**
 * Created by  on 1/5/2016, 3:56:02 PM.
 */

( function() {
  'use strict';

  angular.module( 'login' )
    .controller( 'loginController', loginController );

  function loginController( devlog, $rootScope, $window, loginApi, iscSessionModel, AUTH_EVENTS, iscCustomConfigService ) {
    var log = devlog.channel( 'loginController' );
    log.logFn( 'loginController' );

    // ----------------------------
    // vars
    // ----------------------------
    var loginData;

    var self = this;
    _.extend( self, {
      login : login,
      setOrg: setOrg
    } );

    init();

    // ----------------------------
    // functions
    // ----------------------------
    function init() {
      loginApi.status().then( _loginSuccess );
    }

    function login() {
      log.logFn( 'login' );
      log.debug( 'credentials', self.credentials );

      if ( iscCustomConfigService.getConfig().login.useCacheLogin ) {
        return loginApi.cacheLogin( self.credentials )
          .then( cacheLoginSuccess, _loginError );
      } else {
        return loginApi.login( self.credentials )
          .then( _loginSuccess, _loginError );
      }

      function cacheLoginSuccess( responseData ) {
        if ( iscCustomConfigService.getConfig().login.requiresOrg ) {
          return loginApi.getCacheUser( responseData.Username )
            .then( addFakeApplicationRole )
            .then( cacheUserSuccess );
        } else {
          loginData = responseData;
          addFakeApplicationRole( responseData );
          _.extend( responseData,
            {
              sessionInfo: {
                remainingTime: responseData.SessionTimeout
              },
              UserData   : {
                Name: {
                  GivenName: responseData.Username,
                  LastName : ""
                }
              }
            } );
          _loginSuccess( loginData );
        }

        function addFakeApplicationRole( cacheUser ) {
          cacheUser.ApplicationRole = "provider";  //update server to return actual ApplicationRole
          return cacheUser;
        }

        function cacheUserSuccess( cacheUser ) {
          self.userOrgs = cacheUser.UserContainer.Organizations;
          loginData     = {
            UserData       : {
              Name: cacheUser.UserContainer.FirstName
            },
            Username       : responseData.Username,
            ApplicationRole: cacheUser.ApplicationRole,
            sessionInfo    : {
              remainingTime: responseData.SessionTimeout
            },
            name           : {
              GivenName: cacheUser.UserContainer.FirstName,
              LastName : cacheUser.UserContainer.LastName
            }
          };
        }
      }
    }

    /**
     * Once the user picks an organization, log the user in
     */
    function setOrg() {
      _loginSuccess( loginData );
    }

    function _loginSuccess( responseData ) {
      log.logFn( '_loginSuccess' );
      var name    = responseData.UserData.Name;
      var session = _.extend( responseData, { SessionTimeout: responseData.sessionInfo.remainingTime } );

      _.extend( responseData.UserData, {
        userRole: responseData.ApplicationRole,
        username: responseData.Username,
        FullName: [name.GivenName, name.FamilyName].join( " " ),
        jwt     : responseData.jwt
      } );

      // Create a session for timeout testing purposes
      iscSessionModel.create( session, true );

      // Saving session.id here to test/demonstrate scope of sessionStorage
      $window.sessionStorage.setItem( 'sessionId', session.sessionId );
    }

    function _loginError( responseData ) {
      log.error( 'login Failed because: ' + responseData.data.error );
      $rootScope.$emit( AUTH_EVENTS.loginFailed, responseData );
    }

  }// END CLASS

} )();
