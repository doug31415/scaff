( function() {
  'use strict';

  angular.module( 'login' )
    .factory( 'loginApi', loginApi );

  /* @ngInject */
  function loginApi( devlog, apiHelper, iscHttpapi ) {
    var log          = devlog.channel( 'loginApi' );

    var baseUrl = apiHelper.getUrl( 'auth/' );
    var baseUsersUrl = apiHelper.getUrl( 'users/' );

    var api = {
      login          : login,
      logout         : logout,
      status         : status,
      keepAlive      : keepAlive,
      changeRole     : changeRole,
      cacheLogin     : cacheLogin,
      getCacheUser   : getCacheUser
    };

    return api;

    function changeRole( role ) {
      log.debug( 'loginApi.changeRole' );
      var data = { role: role };
      return iscHttpapi.put( baseUrl + 'role', data );
    }

    /**
     * Login via REST-ful API call
     * @param credentials
     * @returns {promise}
     */
    function login( credentials ) {
      log.debug( 'loginApi.login' );
      return iscHttpapi.post( baseUrl + 'login', credentials, { showLoader: true } );
    }

    /**
     * Login via form post to CACHE server
     * @param credentials
     * @returns {promise}
     */
    function cacheLogin( credentials ) {
      log.debug( 'loginApi.iscLogin' );

      var formData = "CacheUserName=" + credentials.username + '&CachePassword=' + credentials.password + '&CacheNoRedirect=1';

      return iscHttpapi.formPost( baseUrl + 'login', formData, { showLoader: true } );
    }

    /**
     * Returns cache user
     * @param username
     * @returns {*}
     */
    function getCacheUser( username ) {
      var url = baseUsersUrl + '/healthshare/' + username;
      return iscHttpapi.get( url );
    }

    /**
     * Terminates a user session
     * @returns {promise}
     */
    function logout() {
      log.debug( 'loginApi.logout' );
      return iscHttpapi.post( baseUrl + 'logout' );
    }

    function status() {
      log.debug( 'loginApi.login' );
      return iscHttpapi.get( baseUrl + 'status' );
    }

    function keepAlive() {
      log.debug( 'loginApi.keepAlive' );
      return iscHttpapi.get( baseUrl + 'keepAlive' );
    }
  }
} )();
