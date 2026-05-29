import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: unknown, file: Express.Multer.File) => {
    const filenameWithoutExt = file.originalname.split(".")[0].replace(/[^a-zA-Z0-9]/g, "-");
    return {
      folder: "primehome",
      allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
      public_id: `${Date.now()}-${filenameWithoutExt}`,
    };
  },
});

export { cloudinary };
