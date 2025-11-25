const sharp = require("sharp");
const path = require("path");
const admin = require("firebase-admin");

async function generateThumbnail(event) {
    // Ensure firebase-admin is initialized (defensive in case this module is loaded directly)
    if (!admin.apps || admin.apps.length === 0) {
        admin.initializeApp();
    }

    const bucket = admin.storage().bucket();
    const db = admin.firestore();

    const filePath = event.data.name;

    if (!filePath.startsWith("products/") || !filePath.endsWith(".jpg")) return;

    const fileName = path.basename(filePath);
    const productId = fileName.split(".")[0];

    const tempPath = `/tmp/${fileName}`;
    const thumbName = `thumb_${fileName}`;
    const thumbPath = `/tmp/${thumbName}`;

    await bucket.file(filePath).download({ destination: tempPath });

    await sharp(tempPath).resize(300).toFile(thumbPath);

    const thumbStoragePath = `products/thumbnails/${thumbName}`;

    await bucket.upload(thumbPath, {
        destination: thumbStoragePath,
        metadata: { contentType: "image/jpeg" },
    });

    const [thumbUrl] = await bucket
        .file(thumbStoragePath)
        .getSignedUrl({
            action: "read",
            expires: "03-09-2099",
        });

    await db.collection("products").doc(productId).update({
        thumbnailUrl: thumbUrl,
        thumbnailCreatedAt: Date.now(),
    });

    console.log(`Thumbnail generated for product ${productId}`);
}

module.exports = { generateThumbnail };
