const functions = require("@google-cloud/functions-framework");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

app.use(cors());
app.use(express.json());

admin.initializeApp({});

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(403).send('Unauthorized: No token provided.');
  }

  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Add user info to the request object
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized: Invalid token.');
  }
};


// Test route
app.get("/", (req, res) => {
  res.send("🚀 FCM Notification Server is up!");
});

// Route to send notification - now protected by middleware
app.post("/send-notification", verifyFirebaseToken, async (req, res) => {

  const { token, title, body, data } = req.body;

  const recipientTokens = Array.isArray(token) ? token : [token];

  if (!recipientTokens || recipientTokens.length === 0 || !recipientTokens[0]) {
    return res.status(400).send({ error: "Missing push token(s)" });
  }

  const stringifiedData = {};
  if (data) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        stringifiedData[key] = String(data[key]);
      }
    }
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: stringifiedData,
    android: { priority: "high" },
    apns: {
      payload: { aps: { "content-available": 1 } },
      headers: { "apns-priority": "10" },
    },
  };

  try {
    // Use sendEachForMulticast for multiple tokens. It's efficient.
    const response = await admin.messaging().sendEachForMulticast({
      ...message,
      tokens: recipientTokens,
    });

    const failedTokens = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const failedToken = recipientTokens[idx];
          failedTokens.push(failedToken);
          console.error(
            `Failed to send to token: ${failedToken}`,
            resp.error
          );

        }
      });
    }

    console.log(`${response.successCount} messages were sent successfully.`);
    if (failedTokens.length > 0) {
      console.log(`Failed to send to ${failedTokens.length} tokens.`);
    }

    res.status(200).send({ success: true, successCount: response.successCount, failureCount: response.failureCount, failedTokens });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send({ error: "Failed to send notification" });
  }
});


functions.http("fcmServer", app);
