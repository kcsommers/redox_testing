require('dotenv').config();
const express = require('express');
const bp = require('body-parser');
const ejsLayouts = require('express-ejs-layouts');
const app = express();
const port = process.env.PORT || 3000;
const request = require('request');
const destinationToken = process.env.DESTINATION_TOKEN;
const sourceSecret = process.env.SOURCE_SECRET;
const sourceApiKey = process.env.SOURCE_API_KEY;
var _ = require('lodash');
var authToken, authTokenExpires;

var lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = lowdb(adapter)

db.defaults({appointments: []})
  .write();

app.use(express.static(__dirname + '/static'));
app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.use(bp.json());

app.listen(port, () => {
    console.log(`Hooked on ${port}`);
});

var sendMedia = function(appointment) {
  getAuthToken(function(token) {
    var options = {
      url: 'https://api.redoxengine.com/endpoint',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token 
      },
      json: true 
    };
    options.body = {
      "Meta": {
        "DataModel": "Media",
        "EventType": "New",
        "EventDateTime": "2018-09-14T04:04:08.137Z",
        "Test": true,
        "Destinations": [
          {
            "ID": "af394f14-b34a-464f-8d24-895f370af4c9",
            "Name": "Redox EMR"
          }
        ],
        "FacilityCode": null
      },
      "Patient": {
        "Identifiers": appointment.PatientIdentifiers
      },
      "Media": {
        "FileType": "JPG",
        "FileName": "SampleImage",
        "FileContents": "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",
        "DocumentType": "Sample Image",
        "DocumentID": "b169923c-42g9-4fe3-91hg-8ckf1094e90l",
        "DocumentDescription": null,
        "CreationDateTime": "2017-06-22T19:30:04.387Z",
        "ServiceDateTime": "2017-06-22T17:00:00.387Z",
        "Provider": {
          "ID": appointment.ProviderID
        },
        "Authenticated": "False",
        "Availability": "Available"
      }
    };

    request.post(options, function(err, response, body) {
      console.log('MEDIA: ');
      console.log(err)
      console.log(response.statusCode)
      console.log(body)
    });
  });
};  

var getAuthToken = function(callback) {
  if(authToken && Date.now() < new Date(authTokenExpires).getTime()) {
    return callback(authToken);
  }
  else {
    var options = {
      url: 'https://api.redoxengine.com/auth/authenticate',
      method: 'POST',
      body: {
          apiKey: sourceApiKey,
          secret: sourceSecret
      },
      headers: {
          'Content-Type': 'application/json'
      },
      json: true
    };

    request.post(options, function(err, response, body) {
      console.log('GET AUTH TOKEN BODY', body);
      authToken = body.accessToken;
      authTokenExpires = body.expires;

      callback(authToken)
    });
  }
}

var getClinicalSummary = function(appointment) {
  getAuthToken(function(token) {
    var options = {
      url: 'https://api.redoxengine.com/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      json: true,
    };

    options.body = {
      "Meta": {
        "DataModel": "Clinical Summary",
        "EventType": "PatientQuery",
        "EventDateTime": "2018-08-31T04:35:00.469Z",
        "Test": true,
        "Destinations": [
            {
                "ID": "ef9e7448-7f65-4432-aa96-059647e9b357",
                "Name": "Patient Query Endpoint"
            }
        ],
        "FacilityCode": null
      },
      "Patient": {
        "Identifiers": appointment.PatientIdentifiers
      }
    }

    request.post(options, function(err, response, body) {
      console.log('Clinical Summary');
      console.log(err);
      console.log(response.statusCode);
      console.log(body.Meta.DataModel + ' was received');

      sendMedia(appointment)
    });
  });
}

var getPatient = function() {
  getAuthToken(function(token) {
    var options = {
      url: 'https://api.redoxengine.com/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer' + token
      },
      json: true
    };
    options.body = {
      "Meta": {
        "DataModel": "PatientSearch",
        "EventType": "Query"
      },
      "Patient": {
        "Identifiers": [
          {
            "ID": "0000000001",
            "IDType": "MR"
          },
          {
            "ID": "e167267c-16c9-4fe3-96ae-9cff5703e90a",
            "IDType": "EHRID"
          },
          {
            "ID": "a1d4ee8aba494ca",
            "IDType": "NIST"
          }
        ],
        "Demographics": {
          "FirstName": "Timothy",
          "MiddleName": "Paul",
          "LastName": "Bixby",
          "DOB": "2008-01-06",
          "SSN": "101-01-0001",
          "Sex": "Male",
          "Race": "White",
          "IsHispanic": null,
          "MaritalStatus": "Married",
          "IsDeceased": null,
          "DeathDateTime": null,
          "PhoneNumber": {
            "Home": "+18088675301",
            "Office": null,
            "Mobile": null
          },
          "EmailAddresses": [],
          "Language": "en",
          "Citizenship": [],
          "Address": {
            "StreetAddress": "4762 Hickory Street",
            "City": "Monroe",
            "State": "WI",
            "ZIP": "53566",
            "County": "Green",
            "Country": "US"
          }
        },
        "Notes": []
      }
    }

    request.post(options, function(err, response, body) {
      console.log('PATIENT RESPONSE');
      console.log('ERR', err);
      console.log('RESPONSE', response.statusCode);
      console.log('BODY', body);
    });
  });
}

app.get('/', function(req, res) {
    console.log('GET DESTINATION HIT');
    if(req.headers['verification-token'] = destinationToken) {
        let appointments = db.get('appointments').value();
        console.log('verification-token matched!');
        res.render('index', {appointments});
        // res.send(req.query.challenge);
    }
    else {
        console.log('verification token did not match');
        res.sendStatus(400);
    }
});

app.post('/', function(req, res) {
  console.log('POST DESTINATION HIT');
  if(req.body.Meta.DataModel === 'Scheduling' && req.body.Meta.EventType === 'New') {
    console.log('Scheduling Message Received!');
    var appointment = {
      PatientFirstName: req.body.Patient.Demographics.FirstName,
      PatientLastName: req.body.Patient.Demographics.LastName,
      PatientIdentifiers: req.body.Patient.Identifiers,
      VisitDateTime: req.body.Visit.VisitDateTime,
      VisitReason: req.body.Visit.Reason,
      ProviderFirstName: req.body.Visit.AttendingProvider.FirstName,
      ProviderLastName: req.body.Visit.AttendingProvider.LastName,
      ProviderID: req.body.Visit.AttendingProvider.ID
    };
    db.get('appointments').push(appointment).write();

    getClinicalSummary(appointment);
  }
  res.sendStatus(200);
});

app.get('/appointments', function(req, res) {
  var appointments = db.get('appointments').value();
  res.send(appointments);
});

app.post('/patientsearch', function(req, res) {
    console.log('PATIENT POST ROUTE HIT');
    getPatient();
    res.redirect('/');
});



