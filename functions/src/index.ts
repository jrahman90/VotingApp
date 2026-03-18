import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();

export const health = onCall(async () => {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
  };
});

export const getBootstrapData = onCall(async () => {
  const [electionsSnapshot, devicesSnapshot] = await Promise.all([
    db.collection("elections").limit(25).get(),
    db.collection("devices").limit(100).get(),
  ]);

  return {
    elections: electionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
    devices: devicesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
  };
});
