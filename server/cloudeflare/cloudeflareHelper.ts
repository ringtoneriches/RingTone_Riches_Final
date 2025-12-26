import multer from "multer";
import multerS3 from "multer-s3";
import { r2 } from "./cloudeflare"; 
import { nanoid } from "nanoid";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const createS3Uploader = (folder: string) => {
  return multer({
    storage: multerS3({
      s3: r2,
      bucket: process.env.R2_BUCKET_NAME!,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const ext = file.originalname.split(".").pop();
        const fileName = `${folder}/${Date.now()}-${nanoid(8)}.${ext}`;
        cb(null, fileName);
      },
    }),
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  });
};



export async function deleteR2Object(key: string) {
  try {
    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }));
    console.log(`Deleted R2 object: ${key}`);
  } catch (err) {
    console.error(`Failed to delete R2 object: ${key}`, err);
  }
}