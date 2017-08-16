/**
 * Created by Trevor Hudson on 06/02/15.
 *
 * --------------------------------------
 * sample config
 * --------------------------------------
 *
 var labOrdersConfig = {
    key: 'LabOrders', // if the data is part of a larger set, this is the key, if not, leave blank
    title: '',
    rowsOnPage: 20,
    backButtonText: 'Go Back'
    editable: "popup",
    addBtnTranslationKey: "TRANSLATION_KEY",

    columns: [{
      key           : 'OrderedItemDisplay',
      title         : 'ISC_WELLNESS_LAB_NAME',
      type          : 'buttonWithSref',
      sref          : 'route.index',
      className     : 'class-name'
      columnClick   : 'none', - 'none' (no click behavior), 'sort' (click to sort), 'filter' (click to call a function, requires a filterFunction)
    },
    {
      key            : 'TextField',
      title          : 'ISC_KEY',
      textGetter     : getTextClass, // see below
      type           : 'text'
      columnClick    : 'filter'
      filterFunction : someFunction
    },
    {
      key         : 'Timestamp',
      title       : 'ISC_WELLNESS_LAB_DATE',
      classGetter : getButtonClass, // see below
      type        : 'date'
    },
    {
      key      : 'ButtonField',
      title    : 'ISC_TRANSLATION_KEY',
      type     : 'buttonWithCallback',
      callback : function(){}
    },
    { //drop down
      key           : 'anticipatedProblem',
      title         : 'EmergencyTreatmentPlan_ProblemSymptom',
      type          : 'dropdown',
      dropdownConfig: {
        listData    : model.getLookup( "symptoms" ),
        dropMinwidth: '150px',
        usePrimative: true
      }
    },
    { // for individual application to create non-core specific columns
      type         : 'template',
      key          : 'main',
      title        : 'Contacts_Personal_MainCarer',
      editCellClass: "cmc-team-cell-edit",
      template     : 'carePlan/careTeam/contact-main.html'
    },
    {
      type    : 'commands',
      sortable: false,
      key     : '',
      title   : '',
      commands: getOptimisticCommands()
    }],
    api: {  // if custom command (see: getOptimisticCommands()) override isn't specified,
            // api actions will be used to communicate with services
      create: saveCarePlan,
      update: saveCarePlan,
      remove: saveCarePlan
    }
  };


 * --------------------------------------
 * sample api functions -
 * use to as service api calls
 * --------------------------------------
 *
 * function saveCarePlan(){
      var plan       = model.data.carePlan;
      plan.lastSaved = moment().toDate();
      return cmcCarePlanApi.put( plan.id, plan );
   }

 * --------------------------------------
 * sample commands function -
 * use to override default command behaviors
 * --------------------------------------
 *
 * this is needed because of the current way we are saving data.
 * we are saving entire careplan object instead of the updated field(s)
 * which means, data needs to be in care plan object prior to saving.
 * This approach is the optimistic approach. By default, we are taking the
 * pessimistic approach where we only update the UI/model when data has been committed sucessfully
 *
 * function getOptimisticCommands(){
      return {
        save  : { callback: optimisticSave },
        remove: { callback: optimisticRemove }
      };

      function optimisticRemove( event, iscRowCtrl ){
        devlog.log( "deleting", iscRowCtrl.dataItem );
        var iscTblCtrl = iscRowCtrl.iscTblCtrl;
        var apicall;

        iscRowCtrl.iscTblCtrl.deleteRow( iscRowCtrl.dataItem );
        apicall        = _.get( iscTblCtrl, "tableConfig.api.remove", angular.noop );
        apicall( iscRowCtrl.dataItem );
      }

      function optimisticSave( event, iscRowCtrl ){
        var iscTblCtrl = iscRowCtrl.iscTblCtrl;
        var apicall;

        if( iscRowCtrl.dataItem.isNew ){
          _.set( iscRowCtrl, "editModeData.isNew", false );
          iscRowCtrl.iscTblCtrl.addRow( iscRowCtrl.editModeData );

          apicall = _.get( iscTblCtrl, "tableConfig.api.create", angular.noop );
          apicall( iscRowCtrl.editModeData );
        } else {
          iscRowCtrl.iscTblCtrl.updateRow( iscRowCtrl.editModeData, iscRowCtrl.dataItem );

          apicall = _.get( iscTblCtrl, "tableConfig.api.update", angular.noop );
          apicall( iscRowCtrl.editModeData, iscRowCtrl.dataItem );
        }

        iscRowCtrl.editModeData = {};
        iscRowCtrl.inEditMode   = false;
      }
    }


 * --------------------------------------
 * sample getter for classes -
 * use when different <td>'s in the same column need different classes
 * --------------------------------------
 *
 * function getButtonClass( type ){
      switch( type ){
        case 'APPROVAL':
          return 'cmc-approval-pill';

        case 'REVIEW':
          return 'cmc-review-pill';

        case 'DRAFT':
        default:
          return 'cmc-draft-pill';
      }
    }

 * --------------------------------------
 * sample getter for text -
 * use when combining multiple fields, eg
 * --------------------------------------
 * function getTextClass( cellData ){
      return dataItem[ 'someKey' ] + ', ' + dataItem[ 'someOtherKey' ] ;
    }
 *
 * --------------------------------------
 * sample html
 * --------------------------------------
 *
 * <isc-table table-config="someCtrl.model.getTableConfig()"
 table-data="someCtrl.model.getTableData()">
 </isc-table>
 *
 *
 */
( function() {
  'use strict';

  angular.module( 'isc.table' )
    .directive( 'iscTable', iscTable );

  /* @ngInject */
  /**
   * @ngdoc directive
   * @memberOf isc.table
   * @param devlog
   * @returns {{scope: {tableConfig: string, tableData: string, filterFunction: string, rowButtonCallback: string, backButtonCallback: string, tableName: string}, restrict: string, replace: boolean, templateUrl: directive.templateUrl, bindToController: boolean, link: link, controller: controller, controllerAs: string}}
   */
  function iscTable( devlog ) { //jshint ignore:line
    var channel = devlog.channel( 'iscTable' );

    channel.debug( 'iscTable.LOADED' );

    // ----------------------------
    // vars
    // ----------------------------

    // ----------------------------
    // class factory
    // ----------------------------

    var directive = {
      scope: {
        backButtonCallback: '&?',
        defaultSort       : '@?',
        defaultReverse    : '=?',
        filterFunction    : '&?',
        hasMoreItems      : '=?',
        loadMoreCallback  : '&?',
        rowButtonCallback : '&?',
        tableConfig       : '=',
        tableData         : '=',
        tableName         : '@?',
        currentPage       : '=?'
      },

      restrict: 'E',
      replace : true,

      templateUrl     : function( elem, attrs ) {
        return attrs.templateUrl || 'table/iscTable.html';
      },
      bindToController: true,
      link            : link,
      controller      : controller,
      controllerAs    : 'iscTblCtrl'
    };

    return directive;

    // ----------------------------
    // functions
    // ----------------------------
    /* @ngInject */
    function controller( $scope, $filter ) {//jshint ignore:line
      channel.debug( 'iscTable.link, tableConfig', $scope.tableConfig );
      channel.debug( '...tableData', $scope.tableData );

      var self = this;
      if ( _.isString( self.tableName ) && self.tableName.length > 0 ) {
        $scope.$parent[self.tableName] = self;
      }

      self.refresh   = init;
      self.addRow    = addRow;
      self.updateRow = updateRow;

      self.deleteRow      = deleteRow;
      self.createRow      = createRow;
      self.editRow        = editRow;
      self.cancelEdit     = cancelEdit;
      self.getColumnByKey = getColumnByKey;

      init();

      function init() {
        self.paginationId = _.get( self, 'tableConfig.key' ) || 'table' + String( _.parseInt( Math.random() * 100000 ) );

        self.rowsOnPage  = _.get( self, 'tableConfig.rowsOnPage', 15 );
        self.currentPage = self.currentPage || 1;

        self.sortField      = { reverse: self.defaultReverse || false };
        self.sortField.name = self.defaultSort || '';

        $scope.$watch(
          function() {
            return self.tableData;
          },
          function() {
            channel.debug( 'iscTable.WATCH tableData' );
            // set an array of the table row objects

            if ( !self.tableConfig ) {
              self.tableRows = [];
            }
            else {
              self.tableRows = _.get( self, 'tableConfig.key' ) ? self.tableData[self.tableConfig.key] : self.tableData;

              if ( !_.isArray( self.tableRows ) ) {
                self.tableRows = [self.tableRows];
              }
            }
            channel.debug( '...tableRows', self.tableRows );

            self.filteredRows = self.tableRows;
          }
        );

        applyFilter();
      }

      /**
       * @memberOf iscTable
       */
      function applyFilter() {
        var rows = self.tableRows;
        if ( self.tableConfig.sortable ) {
          rows = $filter( 'orderBy' )( rows, self.sortField.name, self.sortField.reverse );
        }
        self.filteredRows = rows;
      }

      /**
       * @memberOf iscTable
       * @param column
       */
      self.sortColumn = function( column ) {
        if ( ( column.columnClick === 'sort' || !column.columnClick ) && self.sortField.name === column.key ) {
          self.sortField.reverse = !self.sortField.reverse;
        }

        self.sortField.name = column.key;
        applyFilter();
      };

      /**
       * @memberOf iscTable
       * @param newPageNumber
       */
      self.changePage = function( newPageNumber ) {
        self.currentPage = newPageNumber;
      };

      self.enableLoadMoreButton = function() {
        return self.tableRows && Math.ceil( self.tableRows.length / self.rowsOnPage ) === self.currentPage;
      };

      /**
       * @memberOf iscTable
       * @param item
       * @returns {*}
       */
      self.doFilter = function( item ) {
        channel.debug( 'iscTable.doFilter', item );
        var fitlerable = _.some( _.get( self, 'tableConfig.columns', [] ), function( column ) {
          return _.isFunction( column.filterFunction );
        } );

        channel.debug( '...fitlerable', fitlerable );
        if ( fitlerable ) {
          return self.filterFunction( { item: item } );
        }
        else {
          return true;
        }
      };

      // ----------------------------
      // functions
      // ----------------------------
      /**
       * @memberOf iscTable
       * @param key
       * @returns {*}
       */
      function getColumnByKey( key ) {
        return _.find( self.tableConfig.columns, { key: key } );
      }

      /**
       * @memberOf iscTable
       * @param row
       */
      function deleteRow( row ) {
        _.remove( self.tableRows, row );
      }

      /**
       * @memberOf iscTable
       * @param row
       */
      function addRow( row ) {
        self.tableRows.push( row );
        self.dataItem = null;
      }

      /**
       * @memberOf iscTable
       * @param row
       * @param oldRow
       */
      function updateRow( row, oldRow ) {
        angular.extend( oldRow, row );
        self.dataItem = null;
      }

      /**
       * @memberOf iscTable
       * @returns {null|{isNew: boolean}|*}
       */
      function createRow() {
        var dataItem = { isNew: true };
        self.tableConfig.columns.forEach( function( column ) {
          if ( column.defaultValue !== null ) {
            dataItem[column.key] = column.defaultValue;
          }
        } );
        self.dataItem = dataItem;
        return self.dataItem;
      }

      /**
       * @memberOf iscTable
       * @param row
       */
      function editRow( row ) {
        self.dataItem = row;
      }

      /**
       * @memberOf iscTable
       */
      function cancelEdit() {
        self.dataItem = null;
      }

    }// END CTRL

    function link( scope, elem, attr ) {
      scope.hasBackButton = !_.isUndefined( attr.backButtonCallback );
      scope.defaultSort   = attr.defaultSort;
      // $log.debug('hasBackButton', scope.hasBackButton);
    }

  }// END CLASS

} )();
