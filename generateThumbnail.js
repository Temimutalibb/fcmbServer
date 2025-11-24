const { Storage } = require("@google-cloud/storage");
const sharp = require("sharp");
const admin = require("firebase-admin");
const path = require("path");

if (!admin.apps.length) admin.initializeApp();

const bucket = new Storage().bucket();
const db = admin.firestore();

// CloudEvent handler
exports.generateThumbnail = async (event) => {
    const data = event.data;
    const filePath = data?.name;
    const bucketName = data?.bucket;

    if (!filePath || !filePath.startsWith("products/") || !filePath.endsWith(".jpg")) return;

    const fileName = path.basename(filePath);
    const productId = fileName.split(".")[0];

    const tempPath = `/tmp/${fileName}`;
    const thumbName = `thumb_${fileName}`;
    const thumbPath = `/tmp/${thumbName}`;

    const storageBucket = new Storage().bucket(bucketName);

    // Download original image
    await storageBucket.file(filePath).download({ destination: tempPath });

    // Generate thumbnail
    await sharp(tempPath).resize(300).toFile(thumbPath);

    // Upload thumbnail
    const thumbStoragePath = `products/thumbnails/${thumbName}`;
    await storageBucket.upload(thumbPath, {
        destination: thumbStoragePath,
        metadata: { contentType: "image/jpeg" },
    });

    // Get signed URL
    const [thumbUrl] = await storageBucket.file(thumbStoragePath).getSignedUrl({
        action: "read",
        expires: "03-09-2099",
    });

    // Save to Firestore
    await db.collection("products").doc(productId).update({
        thumbnailUrl: thumbUrl,
        thumbnailCreatedAt: Date.now(),
    });

    console.log(`Thumbnail generated for product ${productId}`);
};
