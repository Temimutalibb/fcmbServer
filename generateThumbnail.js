const sharp = require("sharp");
const path = require("path");
const admin = require("firebase-admin");

const bucket = admin.storage().bucket();
const db = admin.firestore();

async function generateThumbnail(event) {
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
