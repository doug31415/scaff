( function() {
  'use strict';


  describe( 'app module', function() {
    var suite;

    useDefaultModules( 'app' );

    beforeEach( inject( function( $rootScope, $compile, FoundationApi, $timeout, $q, loginApi, iscSpinnerModel ) {
      suite = {
        $scope         : $rootScope.$new(),
        $compile       : $compile,
        FoundationApi  : FoundationApi,
        $timeout       : $timeout,
        $q             : $q,
        loginApi       : loginApi,
        iscSpinnerModel: iscSpinnerModel
      };
    } ) );

    describe( 'sampleTest', function() {
      it( "should always pass", function() {
        expect( suite.$scope ).toBeDefined();
        expect( suite.$compile ).toBeDefined();
        expect( suite.$timeout ).toBeDefined();
        expect( suite.$q ).toBeDefined();
        expect( suite.$scope ).toBeDefined();
        expect( suite.FoundationApi ).toBeDefined();
        expect( suite.loginApi ).toBeDefined();
        expect( suite.iscSpinnerModel ).toBeDefined();
      } );
    } );
  } );
} )();
