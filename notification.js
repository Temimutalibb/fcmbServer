const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Admin only once
if (!admin.apps.length) {
    admin.initializeApp();
}

app.get("/", (req, res) => {
    res.send("🚀 FCM Notification Server is up!");
});

app.post("/send-notification", async (req, res) => {
    const { token, title, body, data } = req.body;

    const recipientTokens = Array.isArray(token) ? token : [token];

    if (!recipientTokens[0]) {
        return res.status(400).send({ error: "Missing push token(s)" });
    }

    const stringifiedData = {};
    if (data) {
        for (const key in data) {
            stringifiedData[key] = String(data[key]);
        }
    }

    const message = {
        notification: { title, body },
        data: stringifiedData,
    };

    try {
        const response = await admin.messaging().sendEachForMulticast({
            ...message,
            tokens: recipientTokens,
        });

        res.status(200).send(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({ error: "Failed to send notification" });
    }
});

module.exports = app;
