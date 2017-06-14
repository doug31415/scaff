// Mock data
var mockFormStore      = {};
var resetMockFormStore = function() {
  mockFormStore = {
    formStatus: [
      {
        "formKey"    : "archive",
        "formName"   : "Archive Record",
        "formType"   : "closeout",
        "createdDate": "2016-01-29T16:32:50.186Z",
        "status"     : "Active"
      },
      {
        "formKey"    : "comprehensive",
        "formName"   : "Comprehensive Form",
        "formType"   : "initial",
        "createdDate": "2016-01-29T16:32:50.190Z",
        "status"     : "Active"
      },
      {
        "formKey"    : "treatment",
        "formName"   : "Treatment Form",
        "formType"   : "treatment",
        "createdDate": "2016-01-29T16:32:50.201Z",
        "status"     : "Active"
      },
      {
        "formKey"    : "sample",
        "formName"   : "Sample Comprehensive Form",
        "formType"   : "initial",
        "createdDate": "2016-02-25T23:42:14.037Z",
        "status"     : "Inactive"
      },
      {
        "formKey"    : "sample2",
        "formName"   : "Sample Treatment Form",
        "formType"   : "treatment",
        "createdDate": "2016-02-25T23:42:14.041Z",
        "status"     : "Active"
      },
      {
        "formKey"    : "hsModelUtilsValidationSample",
        "formName"   : "Sample Form for hsModelUtilsValidation",
        "formType"   : "sample",
        "createdDate": "2016-04-05T20:43:05.838Z",
        "status"     : "Inactive"
      }
    ],
    formData  : [
      sampleCloseout,
      sampleDDPData,
      sampleIntake,
      sampleConfigurableCollectionData,
      placeholderData,
      codedItemCollectionData,
      viewModeMockData,
      collectionLayoutMockData,
      filterableData
    ]
  }
};

var sampleCloseout = {
  "formKey"    : "archive",
  "formName"   : "Archive Record",
  "formType"   : "closeout",
  "author"     : {
    "Roles"   : [
      "provider"
    ],
    "Name"    : {
      "NamePrefix"        : {
        "Scheme"     : "",
        "Code"       : "",
        "Description": "",
        "CodeName"   : "HSCC-App-CodeTable.NamePrefix.$"
      },
      "GivenName"         : "Beth",
      "MiddleName"        : "",
      "FamilyNamePrefix"  : "",
      "FamilyName"        : "Childs",
      "NameSuffix"        : "",
      "PreferredName"     : "",
      "ProfessionalSuffix": ""
    },
    "userRole": "provider",
    "FullName": "Beth Childs"
  },
  "completedOn": "2016-01-20T08:10:19.558Z",
  "data"       : {
    "type": {
      "name" : "Treatment Complete",
      "value": "TC"
    }
  },
  "id"         : 1
};
var sampleDDPData  = {
  "formKey"    : "comprehensive",
  "formName"   : "Comprehensive Form",
  "formType"   : "initial",
  "id"         : 2,
  "author"     : {
    "Roles"   : [
      "provider"
    ],
    "Name"    : {
      "NamePrefix"        : {
        "Scheme"     : "",
        "Code"       : "",
        "Description": "",
        "CodeName"   : "HSCC-App-CodeTable.NamePrefix.$"
      },
      "GivenName"         : "Beth",
      "MiddleName"        : "",
      "FamilyNamePrefix"  : "",
      "FamilyName"        : "Childs",
      "NameSuffix"        : "",
      "PreferredName"     : "",
      "ProfessionalSuffix": ""
    },
    "userRole": "provider",
    "FullName": "Beth Childs",
    "username": "bchilds",
    "jwt"     : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJBcHBsaWNhdGlvblJvbGUiOiJwcm92aWRlciIsIlVzZXJUeXBlIjoiY2xpbmljaWFuIiwiVXNlcm5hbWUiOiJiY2hpbGRzIiwiUGFzc3dvcmQiOiJ0ZXN0IiwiVXNlckRhdGEiOnsiUm9sZXMiOlsicHJvdmlkZXIiXSwiTmFtZSI6eyJHaXZlbk5hbWUiOiJCZXRoIiwiTWlkZGxlTmFtZSI6IiIsIkZhbWlseU5hbWVQcmVmaXgiOiIiLCJGYW1pbHlOYW1lIjoiQ2hpbGRzIiwiTmFtZVN1ZmZpeCI6IiIsIlByZWZlcnJlZE5hbWUiOiIiLCJQcm9mZXNzaW9uYWxTdWZmaXgiOiIifX0sInNlc3Npb25JRCI6Ilc4bFhjSkJkME9ZMk9OLVp3elJuRnozMjBjQXc5MkQzIiwiaWF0IjoxNDYxODYzMzczLCJleHAiOjE0NjE5NDk3NzN9.Deru7nUcVvWYFfETHHPn3YWRPxmqYRPlPV-U81y5_wo"
  },
  "patientId"  : 5,
  "completedOn": "2016-04-28T17:10:06.383Z",
  "data"       : {
    "name"       : {
      "first": "Johnz",
      "last" : "Smith"
    },
    "dateOfBirth": "1951-12-12 00:00:00",
    "sex"        : {
      "name" : "Male",
      "value": "1"
    },
    "consent"    : {
      "name" : "Patient consents to treatment",
      "value": "Yes"
    },
    "addresses"  : [
      {
        "zip"         : "02116",
        "isPrimary"   : true,
        "streetNumber": 12,
        "street"      : "Main Street",
        "street2"     : "B",
        "city"        : "Boston",
        "state"       : {
          "name" : "Massachusetts",
          "value": "MA"
        }
      }
    ],
    "contacts"   : [
      {
        "type"     : {
          "name" : "Phone",
          "value": "tel"
        },
        "value"    : "617-274-5764",
        "isPrimary": true
      }
    ],
    "diagnoses"  : [
      {
        "diagnosis": {
          "name" : "Hepatitis B B16",
          "value": "B16"
        }
      }
    ]
  }
};


var mockComponentData = {
  "templates": {
    "input"                : {
      "text": "some text",
      "date": "1990-12-11 00:00:00"
    },
    "checkbox"             : true,
    "multiCheckbox"        : {
      "primitiveValue": [
        "1",
        "2"
      ],
      "objectValue"   : [
        {
          "displayFieldOverride": "MultiCheckbox 1",
          "value"               : "1"
        },
        {
          "displayFieldOverride": "MultiCheckbox 3",
          "value"               : "3"
        }
      ]
    },
    "radio"                : {
      "primitiveValue": "Radio 3",
      "objectValue"   : {
        "displayField": "Radio 2",
        "value"       : "2"
      }
    },
    "typeahead"            : {
      "primitiveValue": "Typeahead 3",
      "objectValue"   : {
        "displayField": "Typeahead 2",
        "value"       : "2"
      }
    },
    "typeaheadWithScript"  : {
      "displayField": "Typeahead 1",
      "value"       : "1"
    },
    "select"               : {
      "primitiveValue": "Select 3",
      "objectValue"   : {
        "displayField": "Select 2",
        "value"       : "2"
      }
    },
    "textarea"             : "more text",
    "datePicker"           : "1990-12-11T00:00:00.000Z",
    "dateComponents"       : "1990-12-11 00:00:00",
    "dateComponentsPartial": {
      "day"  : "",
      "month": 12,
      "year" : 1999
    }
  }
};

var sampleIntake = {
  "formKey" : "comprehensive",
  "formName": "Comprehensive Form",
  "id"      : 3,
  "data"    : {
    "form"   : {
      "components": angular.copy( mockComponentData )
    },
    "subform": {
      "components": [
        angular.copy( mockComponentData )
      ]
    },
    "test"   : {
      "SubformPage"        : [
        {
          "aField": "SubformPage: some data"
        }
      ],
      "SubformInline"      : [
        {
          "aField": "SubformPage: some data"
        }
      ],
      "SubformModal"       : [
        {
          "aField": "SubformPage: some data"
        }
      ],
      "PrimitiveCollection": [
        "1"
      ]
    }
  }
};

var sampleConfigurableCollectionData = {
  "id"  : 4,
  "data": {
    "objectTypeCollection"   : {
      "key1": {
        "valueProp1": 1,
        "valueProp2": 2
      },
      "key2": {
        "valueProp1": 3,
        "valueProp2": 4
      }
    },
    "hashtableTypeCollection": {
      "key1": "value1",
      "key2": "value2"
    }
  }
};

var codedItemCollectionData = {
  "id"  : 5,
  "data": {
    "collection": [
      {
        "displayField": "Alabama",
        "value"       : "AL"
      }
    ]
  }
};

var viewModeMockData = {
  "id"  : 6,
  "data": {
    "date1": "2016-12-21T20:35:02.000Z",
    "date2": "2016-12-21 20:35:02",
    "date3": "2016-12-21 20:35:02.123456"
  }
};

var collectionLayoutMockData = {
  "id"  : 7,
  "data": {
    "contact": {
      "addresses": [
        {
          "streetNumber": "123",
          "street"      : "Sesame St",
          "street2"     : "4A",
          "city"        : "Oscar",
          "state"       : {
            "displayField": "Alaska",
            "value"       : "AK"
          },
          "zip"         : "12345",
          "isPrimary"   : true
        },
        {
          "streetNumber": "456",
          "street"      : "Sesame St",
          "street2"     : "4A",
          "city"        : "Oscar",
          "state"       : {
            "displayField": "Alaska",
            "value"       : "AK"
          },
          "zip"         : "12345"
        },
        {
          "streetNumber": "789",
          "street"      : "Sesame St",
          "street2"     : "4A",
          "city"        : "Oscar",
          "state"       : {
            "displayField": "Alaska",
            "value"       : "AK"
          },
          "zip"         : "12345"
        },
        {
          "streetNumber": "ABC",
          "street"      : "Sesame St",
          "street2"     : "4A",
          "city"        : "Oscar",
          "state"       : {
            "displayField": "Alaska",
            "value"       : "AK"
          },
          "zip"         : "12345"
        },
        {
          "streetNumber": "DEF",
          "street"      : "Sesame St",
          "street2"     : "4A",
          "city"        : "Oscar",
          "state"       : {
            "displayField": "Alaska",
            "value"       : "AK"
          },
          "zip"         : "12345"
        }
      ]
    }
  }
};

var filterableData = {
  "id"  : 8,
  "data": {
    "myArray"       : [
      {
        "alwaysShows": "1",
        "filterable" : "test"
      },
      {
        "alwaysShows": "2",
        "filterable" : "test"
      }
    ]
  }
};


// Sets the max id in use by the mock db to 1000
var placeholderData = {
  "id"  : 1000,
  "data": {}
};