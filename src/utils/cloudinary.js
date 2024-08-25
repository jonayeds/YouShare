import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:  process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localFilePath) =>{
    try {
        if(!localFilePath) return null
        // uploading the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        // console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response        
    } catch (error) {
        // removing the locally saved temporary file if the upload operation failed
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteImageFromCloudinary  = async(publicId)=>{
        if(!publicId) return null
        await cloudinary.api.delete_resources([publicId], {
            type:"upload",
            resource_type:"image",
        })
        .then(() => {
            console.log("deleted old file successfully")
            return 
        }).catch(() => {
            console.log("not deleted")
             return 
        });
        
        
}

export {uploadOnCloudinary, deleteImageFromCloudinary}