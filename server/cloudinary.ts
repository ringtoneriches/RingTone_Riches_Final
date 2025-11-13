import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import multer from "multer";
dotenv.config();
// console.log("Cloudinary Config:", {
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "competitions", 
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    public_id: (req, file) => `${Date.now()}-${nanoid(8)}`, 
  } as any,
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

export { cloudinary, upload };