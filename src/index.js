/**
 * App ID for the skill
 */
var APP_ID = '';

var http = require('http');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * TidePooler is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var AltXkcd = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
AltXkcd.prototype = Object.create(AlexaSkill.prototype);
AltXkcd.prototype.constructor = AltXkcd;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

AltXkcd.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestIdci
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

AltXkcd.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    //handleWelcomeRequest(response);
    // Design decision -- as the skill has a single request currently, go straight to loading alt text
    handleOneshotAltRequest(null, session, response);
};

AltXkcd.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */
AltXkcd.prototype.intentHandlers = {
    "GetAltText": function (intent, session, response) {
        handleOneshotAltRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- AltXkcd Domain Specific Business Logic --------------------------

// function handleWelcomeRequest(response) {
//         speechOutput = {
//             speech: "<speak>Welcome to Alt X. K. C. D. "
//                 + "You can get the alt text for the current comic."
//                 + "</speak>",
//             type: AlexaSkill.speechOutputType.PLAIN_TEXT
//         },
//         repromptOutput = {
//             speech: "I can load the alt text for the current X. K. C. D. "
//                 + "comic.",
//             type: AlexaSkill.speechOutputType.PLAIN_TEXT
//         };

//     response.ask(speechOutput, repromptOutput);
// }

function handleHelpRequest(response) {
    repromptText = "Ask me to get today's comic.";
    var speechOutput = "I can load the alt text for the current X. K. C. D. "
                + "comic.";
        + repromptText;

    response.ask(speechOutput, repromptText);
}


/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Tide Pooler and get tide information for Seattle on Saturday'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotAltRequest(intent, session, response) {

    // Issue the request, and respond to the user
    makeXkcdRequest(function xkcdResponseCallback(err, xkcdResponse) {
        var speechOutput;

        if (err) {
            speechOutput = "Sorry, the X. K. C. D. service is experiencing a problem. Please try again later";
        } else {
            speechOutput = "The current x. k. c. d. comic alt text is, "
                + xkcdResponse.alt + ".";
        }

        response.tellWithCard(speechOutput, "AltXkcd", speechOutput)
    });
}

function makeXkcdRequest(xkcdResponseCallback) {

    var endpoint = 'http://xkcd.com/info.0.json';
    http.get(endpoint, function (res) {
        var xkcdResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            xkcdResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            xkcdResponseString += data;
        });

        res.on('end', function () {
            var xkcdResponseObject = JSON.parse(xkcdResponseString);

            if (xkcdResponseObject.error) {
                console.log("XKCD error: " + xkcdResponseObj.error.message);
                xkcdResponseCallback(new Error(xkcdResponseObj.error.message));
            } else {
                xkcdResponseCallback(null, xkcdResponseObject);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        xkcdResponseCallback(new Error(e.message));
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var altXkcd = new AltXkcd();
    altXkcd.execute(event, context);
};

