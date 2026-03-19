import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseStorage } from "./firebase";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadImageFile(
  file: File,
  folder: "elections" | "panels" | "candidates"
) {
  const storageRef = ref(
    firebaseStorage,
    `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`
  );

  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });

  return getDownloadURL(storageRef);
}

function isFirebaseStorageUrl(url?: string | null) {
  if (!url) {
    return false;
  }

  return (
    url.includes("firebasestorage.googleapis.com") ||
    url.startsWith("gs://")
  );
}

export async function deleteUploadedImage(url?: string | null) {
  if (!isFirebaseStorageUrl(url)) {
    return;
  }

  try {
    await deleteObject(ref(firebaseStorage, url));
  } catch (error) {
    const storageError = error as { code?: string } | undefined;
    if (storageError?.code === "storage/object-not-found") {
      return;
    }

    throw error;
  }
}
