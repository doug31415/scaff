/**
 * Created by hzou on 12/8/15.
 */

( function() {
  'use strict';
  angular
    .module( 'app', [
      'routes',
      'isc.components',
      'isc.socket',
      'isc.templates',
      'app.config'
    ] )
    .config( config )
    .run( run );

  function config( $translateProvider, $httpProvider, $compileProvider, $urlRouterProvider, uiSelectConfig,
    devlogProvider, iscCustomConfigServiceProvider, coreConfig, componentsConfig, appConfig ) {

    //update below to change the default URL
    $urlRouterProvider.when( '', '/login' );
    $urlRouterProvider.when( '/', '/login' );

    uiSelectConfig.theme = 'selectize';

    _.defaultsDeepArray( appConfig, componentsConfig, coreConfig );

    iscCustomConfigServiceProvider.loadConfig( appConfig );
    devlogProvider.loadConfig( appConfig );

    $httpProvider.interceptors.push( 'iscAuthenticationInterceptor' );
    $httpProvider.interceptors.push( 'iscLoggingInterceptor' );
    $httpProvider.interceptors.push( 'iscSessionInterceptor' );

    $translateProvider.useStaticFilesLoader( {
      prefix: 'assets/i18n/',
      suffix: '.json'
    } );

    $translateProvider.preferredLanguage( 'en-us' );
    $httpProvider.defaults.withCredentials = true;

    if ( appConfig.production ) {
      $compileProvider.debugInfoEnabled( false );
    }
  }

  function run( $rootScope, $state, $window, $timeout, $translate, FoundationApi, iscAuthenticationInterceptorConfig, apiHelper,
    devlog, loginApi, AUTH_EVENTS, NOTIFICATION, iscNavContainerModel, iscConfirmationService, iscNotificationService, iscSessionModel,
    iscRouterDefaultEventService, iscExternalRouteApi, iscStateInit, iscVersionApi, iscCustomConfigService ) {

    var log = devlog.channel( 'app.module' );
    iscAuthenticationInterceptorConfig.configure( {
      statusApiUrl: apiHelper.getUrl( 'auth/status' )
    } );

    /*
     this will be triggered if, for example
     you open the browser on an iPad in Chrome in incognito mode
     */
    if ( detectUnsupportedBrowserMode() ) {
      return; // boot from the startup process since any further attempt to write to sessionStorage will cause a crash
    }

    // Configure notification defaults
    iscNotificationService.setDefaults( {
      position : NOTIFICATION.position.topRight,
      autoclose: 5000
    } );

    //register default state event handlers
    iscRouterDefaultEventService.registerDefaultEvents();

    iscStateInit.config( {
      'initFunctions': {
        'versionInfo': iscVersionApi.load //grab version info for the footer
      }
    } );

    var isAutoLogOut   = $window.sessionStorage.getItem( 'isAutoLogOut' );
    var isManualLogOut = $window.sessionStorage.getItem( 'isManualLogOut' );
    if ( !Boolean( isManualLogOut ) && Boolean( isAutoLogOut ) ) {
      $timeout( function() {
        FoundationApi.publish( 'main-notifications', {
          title  : $translate.instant( 'Session Expired' ),
          content: $translate.instant( 'You were automatically logged out.' )
        } );
      } );
    }
    $window.sessionStorage.removeItem( 'isAutoLogOut' );
    $window.sessionStorage.removeItem( 'isManualLogOut' );

    // ------------------------
    // $viewContentLoaded
    $rootScope.$on( '$viewContentLoaded',
      function( event, toState, toParams, fromState, fromParams ) {
        log.debug( 'AUTH_EVENTS.$viewContentLoaded...' );
        angular.element( '[ui-view]' ).parent().scrollTop( 0 );
      } );

    // ------------------------
    // destroy session when the route resolve is rejected because of user's notAuthenticated
    $rootScope.$on( '$stateChangeRejected', function( event, toState, toParams, fromState, fromParams, error ) {//jshint ignore:line
      log.debug( '$stateChangeRejected...' );

      if ( error.code === AUTH_EVENTS.notAuthenticated ) {
        destroySession();
      }
    } );

    // ------------------------
    // loginSuccess event - after logging in with a new session
    $rootScope.$on( AUTH_EVENTS.loginSuccess, function() {
      log.debug( 'AUTH_EVENTS.loginSuccess...' );
      // Handle initial state routing
      var initialState = iscExternalRouteApi.getNextState();
      if ( initialState ) {
        $state.go( initialState.nextState, initialState.stateParams );
      }
    } );

    // ------------------------
    // sessionTimeoutConfirm event - when you click 'Log out' on the dialog
    $rootScope.$on( AUTH_EVENTS.sessionTimeoutConfirm, function() {
      log.debug( 'AUTH_EVENTS.sessionTimeoutConfirm...' );
      iscSessionModel.destroy();
    } );

    $rootScope.$on( AUTH_EVENTS.notAuthenticated, function() {
      log.debug( 'AUTH_EVENTS.notAuthenticated...' );
      loginApi.logout()
        .finally( destroySession );

    } );

    // ----------------------
    // session logout
    $rootScope.$on( AUTH_EVENTS.logout, function() {
      log.debug( 'AUTH_EVENTS.logout...' );
      $window.sessionStorage.setItem( 'isManualLogOut', true );
      loginApi.logout()
        .finally( destroySession );

    } );

    // ------------------------
    // sessionTimeoutWarning event - issued when session timeout hits warnThreshold
    $rootScope.$on( AUTH_EVENTS.sessionTimeoutWarning, function() {
      log.debug( 'AUTH_EVENTS.sessionTimeoutWarning...' );
      iscConfirmationService
        .show( $translate.instant( 'Session is about to expire. Continue working?' ) )
        .then( _onYes, _onNo );

      function _onYes() {
        log.debug( '_onYes...' );
        iscSessionModel.resetSessionTimeout();
      }

      function _onNo() {
        log.debug( '_onNo...' );
        $window.sessionStorage.setItem( 'isManualLogOut', true );
        destroySession();
      }
    } );

    // ------------------------
    // sessionTimeout event
    $rootScope.$on( AUTH_EVENTS.sessionTimeout, function() {
      log.debug( 'AUTH_EVENTS.sessionTimeout...' );
      var state         = $state.current,
          params        = $state.params,
          config        = iscCustomConfigService.getConfig(),
          sessionConfig = _.get( config, 'session', {} );
      iscExternalRouteApi.persistCurrentState( state, params, sessionConfig.routeMemoryExpirationInMinutes );
      iscConfirmationService.hide();
      destroySession();
    } );

    // ------------------------
    // login failed
    $rootScope.$on( AUTH_EVENTS.loginFailed, function loginFailedHandler() {
      FoundationApi.publish( 'main-notifications', {
        title  : $translate.instant( 'Login Failed' ),
        content: $translate.instant( 'Please check your username and password and try again' )
      } );
    } );

    $rootScope.$on( AUTH_EVENTS.sessionTimeoutReset, function resetTimeout() {
      log.debug( 'AUTH_EVENTS.sessionTimeoutReset...' );
      iscSessionModel.resetSessionTimeout();
    } );

    // ------------------------
    // user session changed
    $rootScope.$on( AUTH_EVENTS.sessionChange, function() {
      log.debug( 'AUTH_EVENTS.sessionChange..' );
      _.defer( iscNavContainerModel.navigateToUserLandingPage, 0 );
    } );

    /**
     * @description     destroys the session and takes the user to the landing page
     */
    function destroySession() {
      log.debug( 'destroySession..' );
      iscSessionModel.destroy();
      _.defer( iscNavContainerModel.navigateToUserLandingPage, 0 );
    }

    // ------------------------
    function detectUnsupportedBrowserMode() {

      var unsupportedMode = false;

      // attempt to write to sessionStorage
      try {
        $window.sessionStorage.setItem( 'test', 'exists' );
        $window.sessionStorage.removeItem( 'test' );
      }
      catch ( error ) {
        unsupportedMode = true;
        $window.alert( 'sessionStorage is not available' );
      }

      // attempt to set a cookie
      try {
        $window.document.cookie = "test=exists;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT";
      }
      catch ( error ) {
        unsupportedMode = true;
        $window.alert( 'cookies are unsupported' );
      }

      if ( unsupportedMode ) {
        $state.go( 'errorUnsupportedMode' );
      }

      return unsupportedMode;
    }
  }

} )();
