(function() {
  'use strict';

  describe( 'iscOauthInterceptor test', function() {

    var suite;

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

    // setup devlog
    beforeEach( module( 'isc.core', 'isc.common', 'isc.oauth', function( devlogProvider ) {
      devlogProvider.loadConfig( {} );
    } ) );

    beforeEach( inject( function( $http, iscOauthInterceptor, iscSessionModel, iscOauthService ) {
      suite                     = {};
      suite.$http               = $http;
      suite.iscOauthInterceptor = iscOauthInterceptor;
      suite.iscSessionModel     = iscSessionModel;
      suite.iscOauthService     = iscOauthService;
    } ) );


    /**
     *  tests
     */
    describe(
      'sanity check',
      function() {
        it( 'should have interceptor defined', function() {
          expect( suite.iscOauthInterceptor ).toBeDefined();
          expect( suite.iscOauthInterceptor.request ).toBeDefined();
        } );
      } );

    describe(
      'request tests',
      function() {

        it( 'should set auth header for authenticated requests if auth header is not available', function() {
          spyOn( suite.iscSessionModel, 'isAuthenticated' ).and.returnValue( true );
          spyOn( suite.iscOauthService, 'get' ).and.returnValue( "test123" );

          var config = {};

          var requestResponse = suite.iscOauthInterceptor.request( config );

          expect( suite.iscSessionModel.isAuthenticated ).toHaveBeenCalled();
          expect( suite.iscOauthService.get ).toHaveBeenCalled();
          expect( requestResponse.headers.AUTHORIZATION ).toBe( 'BEARER test123' );
          expect( suite.$http.defaults.headers.common.AUTHORIZATION ).toBe( 'BEARER test123' );
        } );

        it( 'should not override auth header for authenticated requests if auth header is available', function() {
          spyOn( suite.iscSessionModel, 'isAuthenticated' ).and.returnValue( true );
          spyOn( suite.iscOauthService, 'get' ).and.returnValue( "test123" );

          var config = {
            headers: {
              AUTHORIZATION: "test987"
            }
          };

          var requestResponse = suite.iscOauthInterceptor.request( config );

          expect( suite.iscSessionModel.isAuthenticated ).toHaveBeenCalled();
          expect( suite.iscOauthService.get ).not.toHaveBeenCalled();
          expect( requestResponse.headers.AUTHORIZATION ).toBe( 'test987' );
          expect( suite.$http.defaults.headers.common.AUTHORIZATION ).not.toBeDefined();
        } );

        it( 'should not set auth header for unauthenticated requests', function() {
          spyOn( suite.iscSessionModel, 'isAuthenticated' ).and.returnValue( false );
          spyOn( suite.iscOauthService, 'get' ).and.returnValue( "test123" );

          var config = {
            headers: {
              test: "test987"
            }
          };

          var requestResponse = suite.iscOauthInterceptor.request( config );

          expect( suite.iscSessionModel.isAuthenticated ).toHaveBeenCalled();
          expect( suite.iscOauthService.get ).not.toHaveBeenCalled();
          expect( requestResponse.headers.AUTHORIZATION ).not.toBeDefined();
          expect( suite.$http.defaults.headers.common.AUTHORIZATION ).not.toBeDefined();
        } );

      } );


  } );
}());
