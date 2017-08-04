(function() {
  'use strict';

  var suite;


  // Factory/service
  describe( 'isc.oauth.api', function() {

    var mockMd5 = jasmine.createSpyObj( "mockMd5", ["createHash"] );
    mockMd5.createHash.and.returnValue( "state123" );

    var accessToken= "eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJqdGkiOiJodHRwczovL3FkaHNjcGRldjEuaXNjaW50ZXJuYWwuY29tL29hdXRoMi53SHdGSVp4QmRQRGlaN0I3aUFKUHQtc0dYdjgiLCJpc3MiOiJodHRwczovL3FkaHNjcGRldjEuaXNjaW50ZXJuYWwuY29tL29hdXRoMiIsInN1YiI6InRlc3QiLCJleHAiOjE1MDA5MjI4MzEsImF1ZCI6Imh0dHBzOi8vcWRoc2NwZGV2MS5pc2NpbnRlcm5hbC5jb20vY3NwL2hlYWx0aHNoYXJlL2ZoaXJhY2Nlc3MvZmhpcmFjY2Vzc29hdXRoIiwiaGVhbHRoc2hhcmVfcm9sZXMiOiIlSFNDUF9Vc2VyIiwiaGVhbHRoc2hhcmVfdXNlcm5hbWUiOiJ0ZXN0IiwibmFtZSI6InRlc3QgdGVzdCJ9.";

    beforeEach( function(  ) {
      angular.module("angular-md5", []);
    } );

    beforeEach( module( function( $provide ) {
      $provide.factory( "md5", function() {
        return mockMd5;
      } )
    } ) );

    // setup devlog
    beforeEach( module( 'isc.core', 'isc.common', 'isc.oauth', function( devlogProvider ) {
      devlogProvider.loadConfig( {} );
    } ) );

    // Inject factory API

    beforeEach( inject( function( $httpBackend,
      $window,
      $q,
      $rootScope,
      iscHttpapi,
      iscCustomConfigService,
      iscSessionStorageHelper,
      $httpParamSerializerJQLike,
      iscOauthApi,
      iscOauthService ) {

      suite = {
        $window                : $window,
        $rootScope             : $rootScope,
        $q                     : $q,
        $httpBackend           : $httpBackend,
        iscHttpapi             : iscHttpapi,
        iscCustomConfigService : iscCustomConfigService,
        iscSessionStorageHelper: iscSessionStorageHelper,
        serializer             : $httpParamSerializerJQLike,
        iscOauthApi            : iscOauthApi,
        iscOauthService        : iscOauthService
      };

      spyOn( suite.$window.location, "assign" ).and.callFake( _.identity );

      spyOn( suite.iscOauthService, 'get' ).and.callFake( function( query ) {
        if ( query === "client" ) {
          return "test-" + query;
        }
        return "test-" + query;
      } )
    } ) );


    // -------------------------
    it( 'authorize should called to get auth url', function() {

      spyOn( suite.iscOauthService, 'getAuthorizationUrl' ).and.returnValue( "test123" );
      suite.iscOauthApi.authorize();
      expect( suite.iscOauthService.getAuthorizationUrl ).toHaveBeenCalled();
      expect( suite.$window.location.assign ).toHaveBeenCalledWith( 'test123' );
    } );

    // -------------------------
    it( 'revoke should make a form post request with right data and call clearOauthConfig', function() {
      spyOn( suite.iscOauthService, 'getRevocationUrl' ).and.returnValue( "test123" );
      spyOn( suite.iscOauthService, 'clearOauthConfig' ).and.callFake( _.noop );

      suite.$httpBackend.expectPOST( "test123", suite.serializer( {
        "token"     : 'test-accessToken',
        "client_id" : "test-client",
        "token_type": "revoke"
      } ) ).respond( {} );
      suite.iscOauthApi.revoke().then( function() {
        expect( suite.iscOauthService.get ).toHaveBeenCalledWith( 'client' );
        expect( suite.iscOauthService.clearOauthConfig ).toHaveBeenCalled();
      } );
      suite.$httpBackend.flush();
    } );


    // -------------------------
    it( 'requestToken should make a form post request with right data and call saveOauthConfig', function() {
      spyOn( suite.iscOauthService, 'getRequestTokenUrl' ).and.returnValue( "test123" );
      spyOn( suite.iscOauthService, 'saveOauthConfig' ).and.callFake( _.noop );

      var tokenResponse  = {
        "access_token": "tkn123"
      };
      var formattedToken = {
        "accessToken": "tkn123"
      };

      suite.$httpBackend.expectPOST( "test123", suite.serializer( {
        "grant_type"  : "authorization_code",
        "client_id" : "test-client",
        "code"        : "auth-123",
        "redirect_uri": "test-redirectUrl"
      } ) ).respond( tokenResponse );
      suite.iscOauthApi.requestToken( "auth-123" ).then( function() {
        expect( suite.iscOauthService.saveOauthConfig ).toHaveBeenCalledWith( formattedToken );
      } );
      suite.$httpBackend.flush();
    } );

    it( 'refreshToken should make a form post request with right data and call saveOauthConfig', function() {
      spyOn( suite.iscOauthService, 'getRequestTokenUrl' ).and.returnValue( "test123" );
      spyOn( suite.iscOauthService, 'saveOauthConfig' ).and.callFake( _.noop );

      var tokenResponse  = {
        "access_token" : "tkn123",
        "refresh_token": "123"
      };
      var formattedToken = {
        "accessToken" : "tkn123",
        "refreshToken": "123"
      };

      suite.$httpBackend.expectPOST( "test123", suite.serializer( {
        "grant_type"   : "refresh_token",
        "refresh_token": "test-refreshToken"
      } ) ).respond( tokenResponse );
      suite.iscOauthApi.refreshToken().then( function() {
        expect( suite.iscOauthService.saveOauthConfig ).toHaveBeenCalledWith( formattedToken );
      } );
      suite.$httpBackend.flush();
    } );


    it( 'introspect should make a form post request with right data', function() {
      spyOn( suite.iscOauthService, 'getIntrospectionUrl' ).and.returnValue( "test123" );

      suite.$httpBackend.expectPOST( "test123", suite.serializer( {
        "token": encodeURIComponent( "test-accessToken" )
      } ) ).respond( {} );
      suite.iscOauthApi.introspect().then( function( response ) {
        expect( response ).toEqual( {} );
      } );
      suite.$httpBackend.flush();
    } );


    it( 'getUserInfo should make a form post request with right data', function() {
      spyOn( suite.iscOauthService, 'getUserInfoUrl' ).and.returnValue( "test123" );

      suite.$httpBackend.expectPOST( "test123", suite.serializer( {
        "access_token": encodeURIComponent( "test-accessToken" )
      } ) ).respond( {} );
      suite.iscOauthApi.getUserInfo().then( function( response ) {
        expect( response ).toEqual( {} );
      } );
      suite.$httpBackend.flush();
    } );


    it( 'configureBaseUrl should set the base url from fhir config', function() {
      var appConfig             = {
        fhir: {
          iss: "testIssUrl"
        }
      };
      var sampleConformanceJson = {
        "rest": [{
          "security": {
            "extension": [
              {
                "extension": [
                  {
                    "valueUri": "testOuathServerUrl/authorize",
                    "url"     : "authorize"
                  }
                ],
                "url"      : "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris"
              }
            ]
          }
        }]
      };

      spyOn( suite.iscCustomConfigService, 'getConfig' ).and.returnValue( appConfig );
      spyOn( suite.iscOauthService, 'configure' ).and.callFake( _.noop );

      suite.$httpBackend.expectGET( 'testIssUrl/metadata' ).respond( sampleConformanceJson );

      suite.iscOauthApi.configureBaseUrl( {} ).then( function( response ) {
        expect( response ).toEqual( "testOuathServerUrl" );
        var config = _.assignIn( {}, appConfig.fhir, {}, { "oauthBaseUrl": response } );
        expect( suite.iscOauthService.configure ).toHaveBeenCalledWith( config );
      } );
      suite.$httpBackend.flush();
    } );


    it( 'configureBaseUrl should set the base url from query params', function() {
      var appConfig             = {
        fhir: {}
      };
      var sampleConformanceJson = {
        "rest": [{
          "security": {
            "extension": [
              {
                "extension": [
                  {
                    "valueUri": "testOuathServerUrl/authorize",
                    "url"     : "authorize"
                  }
                ],
                "url"      : "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris"
              }
            ]
          }
        }]
      };

      var params = { iss: "testIssUrl" };

      spyOn( suite.iscCustomConfigService, 'getConfig' ).and.returnValue( appConfig );
      spyOn( suite.iscOauthService, 'configure' ).and.callFake( _.noop );

      suite.$httpBackend.expectGET( 'testIssUrl/metadata' ).respond( sampleConformanceJson );

      suite.iscOauthApi.configureBaseUrl( params ).then( function( response ) {
        expect( response ).toEqual( "testOuathServerUrl" );
        var config = _.assignIn( {}, appConfig.fhir, params, { "oauthBaseUrl": response } );
        expect( suite.iscOauthService.configure ).toHaveBeenCalledWith( config );
      } );
      suite.$httpBackend.flush();
    } );


    it( 'configureBaseUrl should set the base url from oauth config if not fhir based', function() {
      var appConfig = {
        oauth: {
          oauthBaseUrl: "testOauthBaseUrl"
        }
      };

      spyOn( suite.iscCustomConfigService, 'getConfig' ).and.returnValue( appConfig );
      spyOn( suite.iscOauthService, 'configure' ).and.callFake( _.noop );

      suite.iscOauthApi.configureBaseUrl( {} ).then( function( response ) {
        expect( response ).toEqual( "testOauthBaseUrl" );
        expect( suite.iscOauthService.configure ).toHaveBeenCalledWith( appConfig.oauth );
      } );
      suite.$rootScope.$digest();
    } );


    it( 'doOauthCheck should not request token and user , return empty object if for wrong query params', function() {
      spyOn( suite.iscOauthApi, 'requestToken' ).and.returnValue( suite.$q.when( {} ) );
      spyOn( suite.iscSessionStorageHelper, 'getValFromSessionStorage' ).and.returnValue( 'state123' );

      suite.iscOauthApi.doOauthCheck( {} ).then( function( response ) {
        expect( response ).toEqual( {} );
        expect( suite.iscOauthApi.requestToken ).not.toHaveBeenCalled();
      } );
      suite.$rootScope.$digest();

      suite.iscOauthApi.doOauthCheck( { code: "code123" } ).then( function( response ) {
        expect( response ).toEqual( {} );
        expect( suite.iscOauthApi.requestToken ).not.toHaveBeenCalled();
      } );
      suite.$rootScope.$digest();

      suite.iscOauthApi.doOauthCheck( { state: "state123" } ).then( function( response ) {
        expect( response ).toEqual( {} );
        expect( suite.iscOauthApi.requestToken ).not.toHaveBeenCalled();
      } );
      suite.$rootScope.$digest();

    } );


    it( 'doOauthCheck should request token and user , return oauth response for the right state params', function() {
      spyOn( suite.iscOauthApi, 'requestToken' ).and.returnValue( suite.$q.when( { "accessToken": accessToken, "expiresIn": 600 } ) );

      spyOn( suite.iscSessionStorageHelper, 'getValFromSessionStorage' ).and.returnValue( 'state123' );

      suite.iscOauthApi.doOauthCheck( { code: "code123", state: "state123" } ).then( function( response ) {
        expect( response ).toEqual( { SessionTimeout: 600, UserData: { id: 'test', name: 'test test', roles: [ '%HSCP_User' ] }} );
        expect( suite.iscOauthApi.requestToken ).toHaveBeenCalledWith( "code123" );
      } );
      suite.$rootScope.$digest();

    } );


  } );
})
();
