import { v2 as cloudinary} from "cloudinary";
import fs from "fs";
  
cloudinary.config({ // cloudinary configuration
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});


const uploadOnCloudinary = async (localFilePath) => { // async as uploading takes some time.
    try {
        if(!localFilePath) return null;
        // upload the file on cloudinary.
        const response = await cloudinary.uploader.upload(localFilePath, {
          resource_type: "auto"
        });
        // file has been successfully uploaded.
        // console.log("File successfully uploaded on cloudinary", response.url);
        // Remove the locally saved temporary file.
        fs.unlinkSync(localFilePath);
        return response;
    } 
    catch (error) {
      // Remove the locally saved temporary file as upload failed.
      fs.unlinkSync(localFilePath);
      return null;
    }
};


export default uploadOnCloudinary;