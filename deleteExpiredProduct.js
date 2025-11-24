const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

exports.deleteExpiredProduct = async (event) => {
    const data = event.data; // CloudEvent data
    const oldValue = data?.oldValue?.fields;
    const newValue = data?.value?.fields;
    const productId = data?.value?.name?.split("/").pop(); // Firestore document ID

    if (!newValue?.expireAt?.integerValue) return;

    const expireAt = Number(newValue.expireAt.integerValue);
    const now = Date.now();

    if (expireAt > now) return; // Not expired yet

    // Delete main image
    await bucket.file(`products/${productId}.jpg`).delete().catch(() => { });

    // Delete thumbnail
    await bucket.file(`products/thumbnails/thumb_${productId}.jpg`).delete().catch(() => { });

    // Delete Firestore document
    await db.collection("products").doc(productId).delete().catch(() => { });

    console.log(`Expired product deleted: ${productId}`);
};
