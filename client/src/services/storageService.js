import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase.js";

/**
 * Uploads a file to Firebase Storage.
 * @param {File} file - The file to upload.
 * @param {string} folder - The destination folder (e.g., 'products', 'categories', 'banners').
 * @param {function} onProgress - Callback function for upload progress tracking (receives percent 0-100).
 * @returns {Promise<string>} Resolves with the file's public download URL.
 */
export const uploadProductImage = (file, folder = "products", onProgress = null) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided for upload."));
    }

    // Generate unique name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop();
    const uniqueFileName = `${timestamp}_${randomString}.${extension}`;
    
    // Create reference
    const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
    
    // Start resumable upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Deletes an image from Firebase Storage using its download URL.
 * @param {string} downloadUrl - The download URL of the image.
 * @returns {Promise<void>}
 */
export const deleteProductImage = async (downloadUrl) => {
  if (!downloadUrl) return;
  
  // Basic URL check to confirm it is a Firebase Storage URL
  if (!downloadUrl.includes("firebasestorage.googleapis.com")) {
    console.log("Not a Firebase Storage URL, skipping delete:", downloadUrl);
    return;
  }

  try {
    const fileRef = ref(storage, downloadUrl);
    await deleteObject(fileRef);
    console.log("Successfully deleted file from Storage:", downloadUrl);
  } catch (error) {
    // If the file is already deleted or not found, resolve gracefully
    if (error.code === "storage/object-not-found") {
      console.log("File not found in Storage, skipping delete:", downloadUrl);
      return;
    }
    console.error("Failed to delete file from Storage:", error);
    throw error;
  }
};
