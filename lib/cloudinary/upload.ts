"use client";

interface SignResponse {
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  folder?: string;
  publicId?: string;
  overwrite?: boolean;
  signature?: string;
  error?: string;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  error?: { message: string };
}

/** Uploads an image straight to Cloudinary using a short-lived signature minted by the given sign endpoint. */
async function uploadViaSignedEndpoint(file: File, signEndpoint: string): Promise<string> {
  const signRes = await fetch(signEndpoint, { method: "POST" });
  const signData = (await signRes.json()) as SignResponse;
  if (!signRes.ok || !signData.cloudName || !signData.apiKey || !signData.signature || !signData.timestamp) {
    throw new Error(signData.error ?? "Unable to prepare image upload.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("timestamp", String(signData.timestamp));
  formData.append("signature", signData.signature);
  if (signData.folder) formData.append("folder", signData.folder);
  if (signData.publicId) formData.append("public_id", signData.publicId);
  if (signData.overwrite) formData.append("overwrite", "true");

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const uploadData = (await uploadRes.json()) as CloudinaryUploadResponse;
  if (!uploadRes.ok || !uploadData.secure_url) {
    throw new Error(uploadData.error?.message ?? "Image upload failed.");
  }
  return uploadData.secure_url;
}

/** Admin-only: uploads a product photo, signed by /api/admin/cloudinary-sign. */
export function uploadProductImage(file: File): Promise<string> {
  return uploadViaSignedEndpoint(file, "/api/admin/cloudinary-sign");
}

/** Any registered seller: uploads a photo for one of their own products, signed by /api/seller/cloudinary-sign. */
export function uploadSellerProductImage(file: File): Promise<string> {
  return uploadViaSignedEndpoint(file, "/api/seller/cloudinary-sign");
}

/** Any signed-in user: uploads their own profile photo, signed by /api/account/avatar-sign. */
export function uploadAvatarImage(file: File): Promise<string> {
  return uploadViaSignedEndpoint(file, "/api/account/avatar-sign");
}
