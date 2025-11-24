const functions = require("@google-cloud/functions-framework");

// HTTP notification
const notificationApp = require("./notification");
functions.http("fcmServer", notificationApp);

// Storage trigger
const { generateThumbnail } = require("./generateThumbnail");
functions.cloudEvent("generateThumbnail", generateThumbnail);

// Scheduled cleanup
const { cleanExpiredProducts } = require("./cleanExpiredProducts");
functions.cloudEvent("cleanExpiredProducts", cleanExpiredProducts);

// Firestore trigger
const { deleteExpiredProduct } = require("./deleteExpiredProduct");
functions.cloudEvent("deleteExpiredProduct", deleteExpiredProduct);
