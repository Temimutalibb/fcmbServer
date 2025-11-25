const functions = require("@google-cloud/functions-framework");
const admin = require("firebase-admin");

// Ensure firebase-admin is initialized before other modules that use it
admin.initializeApp();

// HTTP notification
const notificationApp = require("./notification");
functions.http("fcmServer", notificationApp);
// Export for GCP (so gcloud can detect the entrypoint)
module.exports.fcmServer = notificationApp;

// Storage trigger
const { generateThumbnail } = require("./generateThumbnail");
functions.cloudEvent("generateThumbnail", generateThumbnail);
module.exports.generateThumbnail = generateThumbnail;

// Scheduled cleanup
const { cleanExpiredProducts } = require("./cleanExpiredProducts");
functions.cloudEvent("cleanExpiredProducts", cleanExpiredProducts);
module.exports.cleanExpiredProducts = cleanExpiredProducts;

// Firestore trigger
const { deleteExpiredProduct } = require("./deleteExpiredProduct");
functions.cloudEvent("deleteExpiredProduct", deleteExpiredProduct);
module.exports.deleteExpiredProduct = deleteExpiredProduct;
