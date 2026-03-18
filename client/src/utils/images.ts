import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
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
