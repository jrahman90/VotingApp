import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();

const db = getFirestore();
const auth = getAuth();

interface StoredBallot {
  id: string;
  voterId: number;
  deviceId: number;
  votingId: number;
  createdAt: string;
  updatedAt: string;
  selections: { position: string; candidateId: number }[];
}

function flattenBallots(ballots: StoredBallot[]) {
  return ballots.flatMap((ballot) =>
    ballot.selections.map((selection) => ({
      id: `${ballot.id}:${selection.candidateId}`,
      voterId: ballot.voterId,
      candidateId: selection.candidateId,
      votingId: ballot.votingId,
      deviceId: ballot.deviceId,
    }))
  );
}

async function buildPublicResultsSnapshot(electionDocId: string, electionData: Record<string, unknown>) {
  const [panelsSnapshot, rosterSnapshot, ballotsSnapshot] = await Promise.all([
    db.collection("elections").doc(electionDocId).collection("panels").get(),
    db.collection("elections").doc(electionDocId).collection("roster").get(),
    db.collection("elections").doc(electionDocId).collection("ballots").get(),
  ]);

  const panels = panelsSnapshot.docs.map((doc) => doc.data());
  const voters = rosterSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.id,
      votingId: data.votingId,
      voterId: data.voterId,
    };
  });
  const ballots = ballotsSnapshot.docs.map((doc) => doc.data() as StoredBallot);

  return {
    id: Number(electionData.id || electionDocId),
    name: electionData.name || "",
    img: electionData.img || "",
    Votes: flattenBallots(ballots),
    Voters: voters,
    Panels: panels,
    publishedAt: new Date().toISOString(),
  };
}

async function publishElectionResults(electionDocId: string) {
  const electionDoc = await db.collection("elections").doc(electionDocId).get();

  if (!electionDoc.exists) {
    throw new Error("Election not found.");
  }

  const snapshot = await buildPublicResultsSnapshot(
    electionDoc.id,
    electionDoc.data() as Record<string, unknown>
  );

  await db.collection("publicResults").doc(electionDoc.id).set(snapshot);
  return snapshot;
}

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

export const publishPublicResultsNow = onCall(async (request) => {
  const votingIdValue = request.data?.votingId;

  if (votingIdValue) {
    const snapshot = await publishElectionResults(String(votingIdValue));
    return {
      ok: true,
      electionId: snapshot.id,
      publishedAt: snapshot.publishedAt,
    };
  }

  const electionsSnapshot = await db.collection("elections").get();

  for (const electionDoc of electionsSnapshot.docs) {
    await publishElectionResults(electionDoc.id);
  }

  return {
    ok: true,
    count: electionsSnapshot.size,
    publishedAt: new Date().toISOString(),
  };
});

export const createOperatorUser = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const callerStaffDoc = await db.collection("staff").doc(request.auth.uid).get();
  const callerRole = callerStaffDoc.data()?.role;

  if (!callerStaffDoc.exists) {
    throw new HttpsError("permission-denied", "Only admins can create operators.");
  }

  if (callerRole === "operator") {
    throw new HttpsError("permission-denied", "Only admins can create operators.");
  }

  const email = String(request.data?.email || "").trim().toLowerCase();
  const password = String(request.data?.password || "");
  const assignedVotingIdValue = request.data?.assignedVotingId;

  if (!email || !password) {
    throw new HttpsError("invalid-argument", "Email and password are required.");
  }

  if (password.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "Password must be at least 6 characters."
    );
  }

  const userRecord = await auth.createUser({
    email,
    password,
  });

  const timestamp = new Date().toISOString();

  await db.collection("staff").doc(userRecord.uid).set({
    id: Date.now(),
    email,
    password: "",
    role: "operator",
    assignedVotingId:
      typeof assignedVotingIdValue === "number" ? assignedVotingIdValue : null,
    uid: userRecord.uid,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return {
    uid: userRecord.uid,
    email,
    role: "operator",
    assignedVotingId:
      typeof assignedVotingIdValue === "number" ? assignedVotingIdValue : null,
  };
});

export const publishHourlyPublicResults = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "America/New_York",
    region: "us-central1",
  },
  async () => {
    const electionsSnapshot = await db.collection("elections").get();

    for (const electionDoc of electionsSnapshot.docs) {
      await publishElectionResults(electionDoc.id);
    }
  }
);
