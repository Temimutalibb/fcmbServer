const functions = require("@google-cloud/functions-framework");
const admin = require("firebase-admin");

// Ensure firebase-admin is initialized before other modules that use it
admin.initializeApp();

// HTTP notification function (fcmServer)
const notificationApp = require("./notification");
functions.http("fcmServer", notificationApp);
module.exports.fcmServer = notificationApp;
