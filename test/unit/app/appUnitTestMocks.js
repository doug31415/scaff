/**
 * Created by douglasgoodman on 11/25/14.
 */

var customConfig      = getCustomConfig();
var mockLoginResponse = getLoginResponse();

beforeEach( function() {
  customConfig      = getCustomConfig();
  mockLoginResponse = getLoginResponse();
} );

function getCustomConfig() {
  return {
    'baseUrl'        : 'http://hscommdev.iscinternal.com/public/api/v1',
    'devlogWhitelist': [],
    'devlogBlacklist': [],
    'landingPages'   : {},
    'rolePermissions': {
      '*'    : ['index.login'],
      'user' : ['index.wellness.*', 'index.messages.*', 'index.library.*', 'index.calendar.*', 'index.myAccount.*'],
      'proxy': ['index.myAccount.*', 'index.messages', 'index.messages.inbox', 'index.messages.outbox', 'index.messages.refillPrescription']
    },
    'api'            : {
      'path': '/csp/healthshare/HSPD1/hspd/api/v1'
    }
  };
}

function getLoginResponse() {
  return {
    'ApplicationRole': '*',
    'SessionTimeout' : 3600,
    'UserData'       : {
      'FirstName': 'Adam',
      'FullName' : 'Adam Everyman',
      'LastName' : 'Everyman',
      'userRole' : '*'
    },
    'sessionInfo'    : {
      expiresOn: moment().add( 30, 'minutes' ).toString()
    }
  };
}
