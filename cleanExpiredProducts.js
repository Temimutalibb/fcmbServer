const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

exports.cleanExpiredProducts = async (event) => {
    // This event comes from Cloud Scheduler Pub/Sub
    const now = Date.now();

    const snap = await db
        .collection("products")
        .where("expireAt", "<", new Date(now))
        .get();

    for (const doc of snap.docs) {
        const id = doc.id;

        // Delete main image
        await bucket.file(`products/${id}.jpg`).delete().catch(() => { });

        // Delete thumbnail
        await bucket.file(`products/thumbnails/thumb_${id}.jpg`).delete().catch(() => { });

        // Delete Firestore document
        await db.collection("products").doc(id).delete().catch(() => { });

        console.log(`Cleaned expired product: ${id}`);
    }
};
