(function() {
  'use strict';

  describe( 'iscTable', function() {
    var $rootScope,
        isolateScope,
        httpBackend,
        timeout,
        $ctrl,
        element,
        state,
        $compile;

    var tableConfig = {
      key           : 'LabOrders',
      title         : '',
      backButtonText: 'back',
      editable      : false,

      columns: [{
        key         : 'OrderedItemDisplay',
        title       : 'ISC_WELLNESS_LAB_NAME',
        defaultValue: []
      },
        {
          key  : 'Timestamp',
          title: 'ISC_WELLNESS_LAB_DATE',
          type : 'date'
        }]
    };

    var tableData = {
      "LabOrders": [{
        "OrderedItemDisplay": "BASIC METABOLIC PANEL",
        "ResultItems"       : [
          {
            "ResultValue"     : 141,
            "ResultValueUnits": "MEQ/L",
            "Test"            : "SODIUM"
          },
          {
            "ResultValue"     : 3.9,
            "ResultValueUnits": "MEQ/L",
            "Test"            : "POTASSIUM"
          }
        ],
        "Timestamp"         : "2012-11-09 05:06:00"
      }
      ]
    };

    var tableData2 = {
      "LabOrders": [
        {
          "OrderedItemDisplay": "BASIC METABOLIC PANEL",
          "ResultItems"       : [
            {
              "ResultValue"     : 141,
              "ResultValueUnits": "MEQ/L",
              "Test"            : "SODIUM"
            },
            {
              "ResultValue"     : 3.9,
              "ResultValueUnits": "MEQ/L",
              "Test"            : "POTASSIUM"
            }
          ],
          "Timestamp"         : "2012-11-09 05:06:00"
        },
        {
          "OrderedItemDisplay": "BASIC FOOBAR PANEL",
          "ResultItems"       : [
            {
              "ResultValue"     : 141,
              "ResultValueUnits": "MEQ/L",
              "Test"            : "SODIUM"
            },
            {
              "ResultValue"     : 3.9,
              "ResultValueUnits": "MEQ/L",
              "Test"            : "POTASSIUM"
            }
          ],
          "Timestamp"         : "2012-11-09 05:06:00"
        },
        {
          "OrderedItemDisplay": "BASIC WHATEVER",
          "ResultItems"       : [
            {
              "ResultValue"     : 141,
              "ResultValueUnits": "MEQ/L",
              "Test"            : "SODIUM"
            },
            {
              "ResultValue"     : 3.9,
              "ResultValueUnits": "MEQ/L",
              "Test"            : "POTASSIUM"
            }
          ],
          "Timestamp"         : "2012-11-09 05:06:00"
        }
      ]
    };

    var html = '<isc-table table-name="tblProvider" ' +
      'template-url="fakeTable.html" ' +
      'table-config="tableConfig"' +
      'table-data="tableData"' +
      'current-page="currentPage"' +
      'default-sort="OrderedItemDisplay"' +
      'back-button-callback="backButtonCallback()"' +
      'row-button-callback="rowButtonCallback( state )">' +
      '</isc-table>';

    useDefaultModules( 'isc.templates', 'isc.table' );

    beforeEach( inject( function( _$rootScope_, _$compile_, $httpBackend, $state, $timeout, _$templateCache_ ) {
      $rootScope = _$rootScope_;
      $compile   = _$compile_;

      $rootScope.tableConfig = _.cloneDeep( tableConfig );
      $rootScope.tableData   = _.cloneDeep( tableData );
      $rootScope.currentPage = 1;

      state         = $state;
      state.current = {
        name: 'tableTests'
      };

      $rootScope.backButtonCallback = function() {
      };

      $rootScope.rowButtonCallback = function() {
      };

      httpBackend = $httpBackend;
      timeout     = $timeout;

      _$templateCache_.put( 'fakeTable.html', '<div ng-repeat"dataItem in iscTblCtrl.tableRows" class="row"> </div>' );

      compileDirective();
    } ) );

    function compileDirective() {
      element = $compile( html )( $rootScope );

      $rootScope.$digest();
      isolateScope = element.isolateScope();
      $ctrl        = isolateScope.iscTblCtrl;
    }

    // -------------------------
    describe( 'setup tests ', function() {

      it( "should have a table config", function() {
        expect( angular.isObject( isolateScope.iscTblCtrl.tableConfig ) ).toBe( true );
      } );

      it( "should have table data", function() {
        expect( angular.isObject( isolateScope.iscTblCtrl.tableData ) ).toBe( true );
      } );

      it( "should have a defaultSort", function() {
        expect( angular.isDefined( isolateScope.iscTblCtrl.defaultSort ) ).toBe( true );
        expect( isolateScope.iscTblCtrl.defaultSort ).toBe( 'OrderedItemDisplay' );
      } );

    } );

    describe( 'table name', function() {
      it( 'should set tableName on parent scope', function() {
        expect( $rootScope.tblProvider ).toBeDefined();
        expect( $rootScope.tblProvider ).toBe( $ctrl );
      } );
    } );

    // -------------------------
    describe( 'tableData change tests ', function() {

      it( "should updated table data", function() {

        $rootScope.tableData = tableData;
        $rootScope.$digest();
        expect( isolateScope.iscTblCtrl.tableRows.length ).toBe( 1 );

        $rootScope.tableData = tableData2;
        $rootScope.$digest();
        expect( isolateScope.iscTblCtrl.tableRows.length ).toBe( 3 );
      } );

      it( 'should have removed a row when deleteRow is called', function() {
        expect( $ctrl.tableRows.length ).toBe( 1 );
        $ctrl.deleteRow( $ctrl.tableRows[0] );
        expect( $ctrl.tableRows.length ).toBe( 0 );
      } );

    } );

    describe( 'createRow', function() {
      it( 'should have created a new row', function() {
        $ctrl.dataItem = null;
        $ctrl.createRow();
        expect( $ctrl.dataItem ).toBeDefined();
        expect( $ctrl.dataItem.isNew ).toBe( true );
      } );

      it( 'should have created a new row using default value', function() {
        $ctrl.dataItem = null;
        $ctrl.createRow();
        expect( $ctrl.dataItem.OrderedItemDisplay ).toEqual( [] );
      } );

      it( 'should not have added to $ctrl.dataRows yet', function() {
        expect( $ctrl.tableRows.length ).toBe( 1 );
        $ctrl.createRow();
        expect( $ctrl.tableRows.length ).toBe( 1 );
      } );
    } );

    describe( 'addRow', function() {
      it( 'should have added a row', function() {
        var newRecord = { patintName: "John Smith", providerName: "Jane Doe" };
        expect( $ctrl.tableRows.length ).toBe( 1 );
        $ctrl.addRow( { patintName: "John Smith", providerName: "Jane Doe" } );
        expect( $ctrl.tableRows[1] ).toEqual( newRecord );
      } );

      it( 'should have set dataItem to null', function() {
        $ctrl.dataItem = $ctrl.tableRows[0];
        $ctrl.addRow( { patintName: "John Smith", providerName: "Jane Doe" } );
        expect( $ctrl.dataItem ).toBeNull();
      } );
    } );

    describe( 'updateRow', function() {
      it( 'should have updated a row', function() {
        var newRecord = { patintName: "John Smith", providerName: "Jane Doe" };
        expect( $ctrl.tableRows[0].patientName ).toBeUndefined();
        expect( $ctrl.tableRows[0].providerName ).toBeUndefined();
        $ctrl.updateRow( newRecord, $ctrl.tableRows[0] );
        expect( $ctrl.tableRows[0].patientName ).toBe( newRecord.patientName );
        expect( $ctrl.tableRows[0].providerName ).toBe( newRecord.providerName );
      } );

      it( 'should have set dataItem to null', function() {
        var newRecord  = { patintName: "John Smith", providerName: "Jane Doe" };
        $ctrl.dataItem = $ctrl.tableRows[0];
        $ctrl.updateRow( newRecord, $ctrl.tableRows[0] );
        expect( $ctrl.dataItem ).toBeNull();
      } );
    } );

    describe( 'editRow', function() {
      it( 'should have set dataItem to row data', function() {
        $ctrl.dataItem = null;
        $ctrl.editRow( $ctrl.tableRows[0] );
        expect( $ctrl.dataItem ).toBe( $ctrl.tableRows[0] );
      } );
    } );

    describe( 'cancelEdit', function() {
      it( 'should have set dataItem to null', function() {
        $ctrl.dataItem = $ctrl.tableRows[0];
        $ctrl.cancelEdit();
        expect( $ctrl.dataItem ).toBeNull();
      } );
    } );

    // -------------------------
    describe( 'table pagination tests ', function() {

      it( "should have a default of 15 rowsOnPage", function() {
        expect( isolateScope.iscTblCtrl.rowsOnPage ).toBe( 15 );
      } );

      it( "should chage rowsOnPage if you add number to config", function() {
        $rootScope.tableConfig.rowsOnPage = 20;
        compileDirective();

        expect( isolateScope.iscTblCtrl.rowsOnPage ).toBe( 20 );
      } );

      it( "should start on page one", function() {
        expect( isolateScope.iscTblCtrl.currentPage ).toBe( 1 );
      } );

      it( "should start on a different page if initially passed in", function() {
        $rootScope.currentPage = 3;
        compileDirective();
        expect( isolateScope.iscTblCtrl.currentPage ).toBe( 3 );
      } );

      it( "should have a function changePage", function() {
        expect( angular.isFunction( isolateScope.iscTblCtrl.changePage ) ).toBe( true );
      } );

      it( "should change the page when you pass in a new page number", function() {
        isolateScope.iscTblCtrl.changePage( 2 );
        expect( isolateScope.iscTblCtrl.currentPage ).toBe( 2 );
      } );

    } );

    describe( 'table sorting tests ', function() {
      beforeEach( function() {
        html = '<isc-table table-config="tableConfig"' +
          '           table-data="tableData"' +
          '           back-button-callback="backButtonCallback()"' +
          '           row-button-callback="rowButtonCallback( state )">' +
          '</isc-table>';

        compileDirective();
      } );

      it( "should start with unreversed sort order", function() {
        expect( isolateScope.iscTblCtrl.sortField ).toEqual( { reverse: false, name: '' } );
      } );

      it( "should have a function sortColumn", function() {
        expect( angular.isFunction( isolateScope.iscTblCtrl.sortColumn ) ).toBe( true );
      } );

      it( "should change the sort field to the column you pass in without reversing", function() {
        isolateScope.iscTblCtrl.sortColumn( tableConfig.columns[0] );
        expect( isolateScope.iscTblCtrl.sortField ).toEqual( { reverse: false, name: 'OrderedItemDisplay' } );
      } );

      it( "should reverse the next time called", function() {
        isolateScope.iscTblCtrl.sortColumn( tableConfig.columns[1] );
        isolateScope.iscTblCtrl.sortColumn( tableConfig.columns[1] );
        expect( isolateScope.iscTblCtrl.sortField ).toEqual( { reverse: true, name: 'Timestamp' } );
      } );

    } );

    describe( 'callback function tests ', function() {

      it( "should have a function rowButtonCallback", function() {
        expect( angular.isFunction( isolateScope.iscTblCtrl.rowButtonCallback ) ).toBe( true );
      } );

      it( "should call rowButtonCallback", function() {
        spyOn( $rootScope, 'rowButtonCallback' );
        isolateScope.iscTblCtrl.rowButtonCallback( { state: 'test' } );

        expect( $rootScope.rowButtonCallback ).toHaveBeenCalledWith( 'test' );
      } );

      it( "should have a function backButtonCallback", function() {
        expect( angular.isFunction( isolateScope.iscTblCtrl.backButtonCallback ) ).toBe( true );
      } );

      it( "should call backButtonCallback", function() {
        spyOn( $rootScope, 'backButtonCallback' );
        isolateScope.iscTblCtrl.backButtonCallback();

        expect( $rootScope.backButtonCallback ).toHaveBeenCalled();
      } );

    } );

    describe( 'table columns', function() {
      it( 'should return column when calling getColumnByKey(key) ', function() {
        var expected = $ctrl.tableConfig.columns[0];
        var actual   = $ctrl.getColumnByKey( "OrderedItemDisplay" );

        expect( actual ).toBe( expected );
      } );
    } );
  } );
})();