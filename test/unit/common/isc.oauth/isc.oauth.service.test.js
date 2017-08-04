(function() {
  'use strict';

  describe( 'isc.oauth.service', function() {
    var suite;

    var oauthConfig = {
      'client'          : "testClientId",
      'redirectUrl'     : "testRedirectUrl",
      'scope'           : "user/*.read",
      'responseType'    : 'code',
      'responseMode'    : 'query',
      'oauthBaseUrl'    : "testOauthBaseUrl",
      'aud'             : "testAud",
      'state'           : "state123",
      'requestGrantType': 'authorization_code',
      'refreshGrantType': 'refresh_token',
      'launch'          : null,
      'params'          : {}
    };

    var getUrlList = [
      "getAuthorizationUrl",
      "getRequestTokenUrl",
      "getRevocationUrl",
      "getUserInfoUrl",
      "getIntrospectionUrl"
    ];


    var mockMd5 = jasmine.createSpyObj( "mockMd5", ["createHash"] );
    mockMd5.createHash.and.returnValue( "state123" );


    beforeEach( function(  ) {
      angular.module("angular-md5", []);
    } );

    beforeEach( module( function( $provide ) {
      $provide.factory( "md5", function() {
        return mockMd5;
      } )
    } ) );

    // useDefaultModules('isc.common','angular-md5','isc.oauth');
    useDefaultModules('isc.common','isc.oauth');

    beforeEach( inject( function(
      $window,
      $rootScope,
      md5,
      iscSessionStorageHelper,
      iscOauthService) {

      suite = {
        $window                : $window,
        $rootScope             : $rootScope,
        md5                    : md5,
        iscSessionStorageHelper: iscSessionStorageHelper,
        iscOauthService        : iscOauthService
      };

      spyOn( suite.$window, "btoa" ).and.callFake( _.identity );
      spyOn( suite.$window, "atob" ).and.callFake( _.identity );

    } ) );

    beforeEach( function() {
      suite.iscOauthService.clearOauthConfig();
      suite.iscOauthService.configure({});
      suite.iscOauthService.saveOauthConfig( oauthConfig );
    } );

    it( 'Should have defined methods', function() {

      _.every( getUrlList, function( method ) {
        expect( suite.iscOauthService[method] ).toBeDefined();
      } );
      expect( suite.iscOauthService.get ).toBeDefined();
      expect( suite.iscOauthService.configure ).toBeDefined();
      expect( suite.iscOauthService.isOuathConfigured ).toBeDefined();
      expect( suite.iscOauthService.getOauthConfig ).toBeDefined();
      expect( suite.iscOauthService.saveOauthConfig ).toBeDefined();
      expect( suite.iscOauthService.clearOauthConfig ).toBeDefined();
    } );

    it( "Should return the configured values for every property when called via get", function() {
      _.every( _.keys( oauthConfig ), function( key ) {

        expect( suite.iscOauthService.get( key ) ).toBe( oauthConfig[key] );
      } );
    } );

    it( "Should return the right url values for all get url methods", function() {
      var authUrl = oauthConfig.oauthBaseUrl + '/authorize' + '?' +
        'client_id=' + encodeURIComponent( "testClientId" ) + '&' +
        'redirect_uri=' + encodeURIComponent( oauthConfig.redirectUrl ) + '&' +
        'response_type=' + encodeURIComponent( oauthConfig.responseType ) + '&' +
        'response_mode=' + encodeURIComponent( oauthConfig.responseMode ) + '&' +
        'scope=' + encodeURIComponent( oauthConfig.scope ) + '&' +
        'aud=' + encodeURIComponent( oauthConfig.aud ) + '&' +
        'state=' + encodeURIComponent( oauthConfig.state );

      expect( suite.iscOauthService.getAuthorizationUrl() ).toBe( authUrl );
      expect( suite.iscOauthService.getRevocationUrl() ).toBe( oauthConfig.oauthBaseUrl + '/revocation' );
      expect( suite.iscOauthService.getRequestTokenUrl() ).toBe( oauthConfig.oauthBaseUrl + '/token' );
      expect( suite.iscOauthService.getIntrospectionUrl() ).toBe( oauthConfig.oauthBaseUrl + '/introspection' );
      expect( suite.iscOauthService.getUserInfoUrl() ).toBe( oauthConfig.oauthBaseUrl + '/userinfo' );

    } );

    it( "Should return the true or false for isOuathConfigured", function() {

      suite.iscOauthService.saveOauthConfig( { oauthBaseUrl: '' } );
      expect( suite.iscOauthService.isOuathConfigured() ).toBe( false );

      suite.iscOauthService.saveOauthConfig( { oauthBaseUrl: 'testOauthBaseUrl' } );
      expect( suite.iscOauthService.isOuathConfigured() ).toBe( true );

    } );

    it( "Should return parsed and decoded oauth config from session storage on getOauthConfig", function() {
      spyOn( suite.iscSessionStorageHelper, "getValFromSessionStorage" ).and.callThrough();
      spyOn( window.JSON, "parse" ).and.callThrough();
      spyOn( window, "decodeURIComponent" ).and.callThrough();
      expect( suite.iscOauthService.getOauthConfig() ).toEqual( oauthConfig );
      expect( suite.iscSessionStorageHelper.getValFromSessionStorage ).toHaveBeenCalled();
      expect( window.JSON.parse ).toHaveBeenCalled();
      expect( window.decodeURIComponent ).toHaveBeenCalled();
    } );

    it( "Should save encoded oauth config string in session storage on saveOauthConfig", function() {
      spyOn( suite.iscSessionStorageHelper, "setSessionStorageValue" ).and.callThrough();
      spyOn( window.JSON, "stringify" ).and.callThrough();
      spyOn( window, "encodeURIComponent" ).and.callThrough();
      var storedConfig = suite.iscOauthService.getOauthConfig();
      var test         = _.assignIn( {}, storedConfig, { test: 123 } );
      suite.iscOauthService.saveOauthConfig( { test: 123 } );
      expect( window.JSON.stringify ).toHaveBeenCalled();
      expect( window.encodeURIComponent ).toHaveBeenCalled();
      expect( suite.iscSessionStorageHelper.setSessionStorageValue ).toHaveBeenCalledWith( 'state123', encodeURIComponent( JSON.stringify( test ) ) );

      expect( suite.iscOauthService.getOauthConfig() ).toEqual( test );
    } );

    it( "Should remove oauth config string from session storage on clearOauthConfig", function() {
      spyOn( suite.iscSessionStorageHelper, "removeFromSessionStorage" ).and.callThrough();

      suite.iscOauthService.clearOauthConfig();
      expect( suite.iscSessionStorageHelper.removeFromSessionStorage ).toHaveBeenCalledWith( 'state123' );
      expect( suite.iscSessionStorageHelper.removeFromSessionStorage ).toHaveBeenCalledWith( 'oauthAppState' );

    } );

  } );
})();
