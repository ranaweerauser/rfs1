// ==========================================================================
// cloudinary.js — Unsigned image upload helper
// Used by Admin Panel to upload product images, category icons, banners, logo.
// ==========================================================================

import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from "./firebase-config.js";

/**
 * Uploads a single File object to Cloudinary using the unsigned preset.
 * @param {File} file
 * @param {(percent:number)=>void} onProgress optional progress callback
 * @returns {Promise<{url:string, publicId:string, width:number, height:number}>}
 */
export function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided."));
    if (!file.type.startsWith("image/")) return reject(new Error("Only image files are allowed."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Image must be smaller than 8MB."));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_UPLOAD_URL, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: res.secure_url,
            publicId: res.public_id,
            width: res.width,
            height: res.height
          });
        } else {
          reject(new Error(res.error?.message || "Image upload failed."));
        }
      } catch (err) {
        reject(new Error("Image upload failed: invalid server response."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during image upload."));
    xhr.send(formData);
  });
}

/** Upload multiple files in parallel, returns array of results in same order. */
export async function uploadMultipleToCloudinary(files, onEachProgress) {
  const uploads = Array.from(files).map((file, idx) =>
    uploadToCloudinary(file, (pct) => onEachProgress && onEachProgress(idx, pct))
  );
  return Promise.all(uploads);
}
