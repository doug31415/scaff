/**
 * Created by hzou on 12/11/15.
 */

( function() {
  'use strict';

  angular
    .module( 'isc.common' )
    .constant( 'componentsConfig', getConfig() );

  /*========================================
   =                 config                =
   ========================================*/
  function getConfig() {
    return {
      'devlogWhitelist': [],
      'session'        : {
        'routeMemoryExpirationInMinutes': 15
      },
      'moduleApi'      : {
        'forms'         : {
          'path': 'api/v1/forms'
        },
        'formData'      : {
          'path': 'api/v1/formData'
        },
        'formTemplates' : {
          'path': 'api/v1/formTemplates'
        },
        'formCodeTables': {
          'path': 'api/v1/codeTables'
        }
      },
      'forms'          : {
        'defaultDisplayField'   : 'Description',
        'debounce'              : 0,
        'useExternalValidation' : false,
        'allowInvalid'          : false,
        'updateOn'              : 'change',
        'updateOnExcluded'      : [
          'checkbox',
          'multiCheckbox',
          'radio',
          'select',
          'typeahead',
          'typeaheadWithScript',
          'dateComponents',
          'dateComponentsPartial'
        ],
        'fieldLayout'           : {
          'breakpoints': [
            'small',
            'medium',
            'large',
            'xlarge'
          ],
          'classes'    : {
            'columns'   : '{{breakpoint}}-up-{{columns}}',
            'percentage': 'formly-field-{{breakpoint}}-{{percentage}}'
          }
        }
      },
      'debugDisplay'   : {
        'forms': {
          'additionalModels': false,
          'formData'        : false,
          'formState'       : false
        }
      },
      'formats'        : {
        'date': {
          'shortDate'   : 'MM-DD-YYYY',
          'shortTime'   : 'h:mm A',
          'longDate'    : 'd MMMM yyyy',
          'longDateTime': 'd MMMM yyyy H:mm',
          'database'    : 'YYYY-MM-DD HH:mm:ss'
        }
      },
      'rolePermissions': {},
      'landingPages'   : {},
      'topTabs'        : {}
    };
  }

} )();
