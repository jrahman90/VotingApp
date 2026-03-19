import {
  QueryDocumentSnapshot,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import {
  deviceFirestore,
  firebaseAuth,
  firebaseDeviceAuth,
  firebaseFunctions,
  firestore,
} from "./firebase";
import { deleteUploadedImage } from "./images";

export interface StaffRecord {
  id: number;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  role?: "admin" | "operator";
  assignedVotingId?: number | null;
  uid?: string;
}

export interface OnlineDevice {
  id: number;
  name: string;
  voterId?: number | null;
  createdAt: string;
  updatedAt: string;
  online: boolean;
  approved?: boolean;
  authUid?: string | null;
}

export interface VoterRecord {
  id: number;
  voterId: number;
  firstAndMiddleName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  phone: string;
  yob: number;
  permanentAddress: string;
  comments?: string | null;
}

export interface CandidateRecord {
  id: number;
  name: string;
  img: string;
  position: string;
}

export interface PanelRecord {
  id: number;
  panelName: string;
  panelColor: string;
  textColor: string;
  img: string;
  votingId: number | null;
  createdAt: string;
  updatedAt: string;
  Candidates: {
    id: number;
    candidateId: number;
    Candidate: CandidateRecord;
  }[];
}

export interface ElectionVoterRecord {
  id: number;
  votingId: number;
  voterId: number;
  extraFields?: Record<string, string> | null;
  Voter: VoterRecord;
}

export interface FlatVoteRecord {
  id: string;
  voterId: number;
  candidateId: number;
  votingId: number;
  deviceId: number;
}

export interface VotingRecord {
  id: number;
  name: string;
  img: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  Panels: PanelRecord[];
  Voters: ElectionVoterRecord[];
  Votes: FlatVoteRecord[];
}

interface StoredBallot {
  id: string;
  voterId: number;
  deviceId: number;
  votingId: number;
  createdAt: string;
  updatedAt: string;
  selections: { position: string; candidateId: number }[];
}

const DEFAULT_ELECTION_IMAGE =
  "https://placehold.co/240x240/png?text=Election";
const DEFAULT_PANEL_IMAGE = "https://placehold.co/120x120/png?text=Panel";
const DEFAULT_CANDIDATE_IMAGE =
  "https://placehold.co/120x120/png?text=Candidate";
const USE_LOCAL_MOCK_ROSTER =
  typeof window !== "undefined" && window.location.hostname === "localhost";
const MOCK_VOTING_ID = 900001;
const MOCK_CREATED_AT = "2026-03-18T00:00:00.000Z";

const nowIso = () => new Date().toISOString();
const createNumericId = () =>
  Date.now() + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000);

const electionsCollection = collection(firestore, "elections");
const publicResultsCollection = collection(firestore, "publicResults");
const devicesCollection = collection(firestore, "devices");
const votersCollection = collection(firestore, "voters");
const staffCollection = collection(firestore, "staff");

const electionPanelsCollection = (votingId: number) =>
  collection(firestore, "elections", String(votingId), "panels");
const electionRosterCollection = (votingId: number) =>
  collection(firestore, "elections", String(votingId), "roster");
const electionBallotsCollection = (votingId: number) =>
  collection(firestore, "elections", String(votingId), "ballots");

function getSessionFirestore() {
  return firebaseDeviceAuth.currentUser ? deviceFirestore : firestore;
}

function castDoc<T>(snapshot: QueryDocumentSnapshot): T {
  return snapshot.data() as T;
}

function flattenBallots(ballots: StoredBallot[]): FlatVoteRecord[] {
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

function panelCandidatesToLinks(
  candidates: {
    id?: number;
    name: string;
    img: string;
    position: string;
  }[]
) {
  return candidates.map((candidate) => {
    const candidateId = candidate.id || createNumericId();
    return {
      id: createNumericId(),
      candidateId,
      Candidate: {
        id: candidateId,
        name: candidate.name.trim(),
        img: candidate.img?.trim() || DEFAULT_CANDIDATE_IMAGE,
        position: candidate.position.trim(),
      },
    };
  });
}

async function deleteUploadedImages(urls: Array<string | null | undefined>) {
  const uniqueUrls = Array.from(
    new Set(urls.filter((url): url is string => !!url && url.trim().length > 0))
  );

  await Promise.all(uniqueUrls.map((url) => deleteUploadedImage(url)));
}

const mockRoster: ElectionVoterRecord[] = Array.from({ length: 100 }, (_, index) => {
  const voterId = 100 + index;
  const voterData: VoterRecord = {
    id: voterId,
    voterId,
    firstAndMiddleName: `Test${index + 1}`,
    lastName: `Voter${index + 1}`,
    streetAddress: `${100 + index} Mockingbird Lane`,
    city: "San Francisco",
    state: "California",
    phone: `+1 555 010 ${String(index).padStart(2, "0")}`,
    yob: 1970 + (index % 30),
    permanentAddress: `${100 + index} Mockingbird Lane, San Francisco, California`,
    comments: index % 10 === 0 ? "Priority voter" : "",
  };

  return {
    id: voterId,
    votingId: MOCK_VOTING_ID,
    voterId,
    extraFields: {
      ZIP: String(94100 + index),
      Precinct: `P-${(index % 5) + 1}`,
    },
    Voter: voterData,
  };
});

const mockPanels: PanelRecord[] = [
  {
    id: 910001,
    panelName: "Unity Panel",
    panelColor: "#1e3a8a",
    textColor: "#ffffff",
    img: DEFAULT_PANEL_IMAGE,
    votingId: MOCK_VOTING_ID,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    Candidates: [
      {
        id: 1,
        candidateId: 920001,
        Candidate: {
          id: 920001,
          name: "Amina Rahman",
          img: DEFAULT_CANDIDATE_IMAGE,
          position: "President",
        },
      },
      {
        id: 2,
        candidateId: 920002,
        Candidate: {
          id: 920002,
          name: "Karim Uddin",
          img: DEFAULT_CANDIDATE_IMAGE,
          position: "Vice President",
        },
      },
      {
        id: 3,
        candidateId: 920003,
        Candidate: {
          id: 920003,
          name: "Laila Noor",
          img: DEFAULT_CANDIDATE_IMAGE,
          position: "Secretary",
        },
      },
    ],
  },
  {
    id: 910002,
    panelName: "Forward Panel",
    panelColor: "#7c2d12",
    textColor: "#ffffff",
    img: DEFAULT_PANEL_IMAGE,
    votingId: MOCK_VOTING_ID,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    Candidates: [
      {
        id: 4,
        candidateId: 920004,
        Candidate: {
          id: 920004,
          name: "Nadia Islam",
          img: DEFAULT_CANDIDATE_IMAGE,
          position: "President",
        },
      },
      {
        id: 5,
        candidateId: 920005,
        Candidate: {
          id: 920005,
          name: "Farhan Ali",
          img: DEFAULT_CANDIDATE_IMAGE,
          position: "Vice President",
        },
      },
      {
        id: 6,
        candidateId: 920006,
        Candidate: {
          id: 920006,
          name: "Sadia Khan",
          img: DEFAULT_CANDIDATE_IMAGE,
          position: "Secretary",
        },
      },
    ],
  },
];

function buildMockVotingRecord(): VotingRecord {
  return {
    id: MOCK_VOTING_ID,
    name: "Mock Local Election",
    img: DEFAULT_ELECTION_IMAGE,
    isActive: true,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
    Panels: mockPanels,
    Voters: mockRoster,
    Votes: [],
  };
}

async function readElectionPanels(
  votingId: number,
  db = firestore
): Promise<PanelRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, "elections", String(votingId), "panels"), orderBy("createdAt"))
  );
  return snapshot.docs.map((docSnapshot) => castDoc<PanelRecord>(docSnapshot));
}

async function readElectionRoster(
  votingId: number,
  db = firestore
): Promise<ElectionVoterRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, "elections", String(votingId), "roster"), orderBy("voterId"))
  );
  return snapshot.docs.map((docSnapshot) => castDoc<ElectionVoterRecord>(docSnapshot));
}

async function readElectionBallots(votingId: number, db = firestore): Promise<StoredBallot[]> {
  const snapshot = await getDocs(
    query(collection(db, "elections", String(votingId), "ballots"))
  );
  return snapshot.docs.map((docSnapshot) => castDoc<StoredBallot>(docSnapshot));
}

async function buildVotingRecord(
  base: Omit<VotingRecord, "Panels" | "Voters" | "Votes">,
  options?: { includeVotes?: boolean; db?: typeof firestore }
) {
  const includeVotes = options?.includeVotes ?? true;
  const db = options?.db ?? firestore;
  const [Panels, Voters, ballots] = await Promise.all([
    readElectionPanels(base.id, db),
    readElectionRoster(base.id, db),
    includeVotes ? readElectionBallots(base.id, db) : Promise.resolve([]),
  ]);

  return {
    ...base,
    Panels,
    Voters,
    Votes: flattenBallots(ballots),
  } satisfies VotingRecord;
}

async function getActiveElectionBase(db = firestore) {
  const snapshot = await getDocs(
    query(collection(db, "elections"), where("isActive", "==", true), limit(1))
  );

  if (snapshot.empty) {
    return null;
  }

  return castDoc<Omit<VotingRecord, "Panels" | "Voters" | "Votes">>(
    snapshot.docs[0]
  );
}

async function hasAnyRealElections() {
  const snapshot = await getDocs(query(electionsCollection, limit(1)));
  return !snapshot.empty;
}

async function shouldUseMockElectionFallback() {
  if (!USE_LOCAL_MOCK_ROSTER) {
    return false;
  }

  return !(await hasAnyRealElections());
}

async function findDeviceByName(name: string, db = firestore) {
  const snapshot = await getDocs(
    query(collection(db, "devices"), where("name", "==", name), limit(1))
  );

  if (snapshot.empty) {
    return null;
  }

  return {
    ref: snapshot.docs[0].ref,
    data: castDoc<OnlineDevice>(snapshot.docs[0]),
  };
}

async function ensureStaffRecord(email: string): Promise<StaffRecord> {
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new Error("No signed-in Firebase user found.");
  }

  const ref = doc(staffCollection, user.uid);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    const existingData = existing.data() as StaffRecord;
    const normalizedRecord: StaffRecord = {
      ...existingData,
      uid: user.uid,
      role: existingData.role || "admin",
      assignedVotingId: existingData.assignedVotingId ?? null,
    };

    if (
      existingData.role !== normalizedRecord.role ||
      existingData.assignedVotingId !== normalizedRecord.assignedVotingId ||
      existingData.uid !== normalizedRecord.uid
    ) {
      await setDoc(ref, normalizedRecord, { merge: true });
    }

    return normalizedRecord;
  }

  const staffSnapshot = await getDocs(query(staffCollection, limit(1)));

  const timestamp = nowIso();
  const staffRecord: StaffRecord = {
    id: createNumericId(),
    email,
    password: "",
    role: staffSnapshot.empty ? "admin" : "operator",
    assignedVotingId: null,
    uid: user.uid,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setDoc(ref, staffRecord);
  return staffRecord;
}

async function clearExistingVoterAssignments(voterId: number, exceptDeviceName?: string) {
  const snapshot = await getDocs(
    query(devicesCollection, where("voterId", "==", voterId))
  );

  await Promise.all(
    snapshot.docs.map(async (docSnapshot) => {
      const device = castDoc<OnlineDevice>(docSnapshot);
      if (exceptDeviceName && device.name === exceptDeviceName) {
        return;
      }

      await updateDoc(docSnapshot.ref, {
        voterId: null,
        updatedAt: nowIso(),
      });
    })
  );
}

async function deleteCollectionDocs(pathCollection: ReturnType<typeof collection>) {
  const snapshot = await getDocs(pathCollection);
  await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
}

async function getElectionByIdInternal(votingId: number) {
  const ref = doc(electionsCollection, String(votingId));
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error("Election not found.");
  }

  return buildVotingRecord(
    snapshot.data() as Omit<VotingRecord, "Panels" | "Voters" | "Votes">
  );
}

export async function loginStaffWithFirebase(input: {
  email: string;
  password: string;
}) {
  if (firebaseDeviceAuth.currentUser) {
    await signOut(firebaseDeviceAuth);
  }

  if (firebaseAuth.currentUser?.isAnonymous) {
    await signOut(firebaseAuth);
  }

  await setPersistence(firebaseAuth, browserLocalPersistence);
  await signInWithEmailAndPassword(firebaseAuth, input.email, input.password);
  return ensureStaffRecord(input.email);
}

export async function getAllStaffRecords() {
  const snapshot = await getDocs(query(staffCollection, orderBy("email")));

  return snapshot.docs.map((docSnapshot) => ({
    ...(castDoc<StaffRecord>(docSnapshot)),
    uid: docSnapshot.id,
    role: castDoc<StaffRecord>(docSnapshot).role || "admin",
    assignedVotingId: castDoc<StaffRecord>(docSnapshot).assignedVotingId ?? null,
  }));
}

export async function updateStaffAccess(input: {
  staffUid: string;
  role: "admin" | "operator";
  assignedVotingId?: number | null;
}) {
  const ref = doc(staffCollection, input.staffUid);
  await updateDoc(ref, {
    role: input.role,
    assignedVotingId:
      input.role === "operator" ? input.assignedVotingId ?? null : null,
    updatedAt: nowIso(),
  });

  return true;
}

export async function createOperatorAccount(input: {
  email: string;
  password: string;
  assignedVotingId?: number | null;
}) {
  const createOperator = httpsCallable(firebaseFunctions, "createOperatorUser");
  const response = await createOperator({
    email: input.email.trim(),
    password: input.password,
    assignedVotingId: input.assignedVotingId ?? null,
  });

  return response.data as {
    uid: string;
    email: string;
    role: "operator";
    assignedVotingId?: number | null;
  };
}

export async function registerDeviceWithFirebase(input: { name: string }) {
  if (!input.name.trim()) {
    throw new Error("Device name is required.");
  }

  await setPersistence(firebaseDeviceAuth, browserSessionPersistence);

  if (!firebaseDeviceAuth.currentUser) {
    await signInAnonymously(firebaseDeviceAuth);
  }

  const timestamp = nowIso();
  const existing = await findDeviceByName(input.name.trim(), deviceFirestore);

  if (existing) {
    const device: OnlineDevice = {
      ...existing.data,
      name: input.name.trim(),
      online: true,
      approved: false,
      voterId: null,
      authUid: firebaseDeviceAuth.currentUser?.uid || null,
      updatedAt: timestamp,
    };

    await setDoc(existing.ref, device);
    return device;
  }

  const id = createNumericId();
  const device: OnlineDevice = {
    id,
    name: input.name.trim(),
    voterId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    online: true,
    approved: false,
    authUid: firebaseDeviceAuth.currentUser?.uid || null,
  };

  await setDoc(doc(collection(deviceFirestore, "devices"), String(id)), device);
  return device;
}

export async function unregisterDeviceWithFirebase(input: { name: string }) {
  const device = await findDeviceByName(input.name, deviceFirestore);
  if (!device) {
    throw new Error("Device not found.");
  }

  await updateDoc(device.ref, {
    online: false,
    voterId: null,
    updatedAt: nowIso(),
  });

  await signOut(firebaseDeviceAuth);
  return true;
}

export async function killDeviceSession(input: { name: string }) {
  const device = await findDeviceByName(input.name);
  if (!device) {
    throw new Error("Device not found.");
  }

  await updateDoc(device.ref, {
    online: false,
    voterId: null,
    approved: false,
    authUid: null,
    updatedAt: nowIso(),
  });

  return true;
}

export async function approveDeviceSession(input: { name: string }) {
  const device = await findDeviceByName(input.name);
  if (!device) {
    throw new Error("Device not found.");
  }

  await updateDoc(device.ref, {
    approved: true,
    updatedAt: nowIso(),
  });

  return true;
}

export function subscribeToConnectedDevices(
  onData: (devices: OnlineDevice[]) => void,
  onError?: (error: Error) => void
) {
  const activeFirestore = getSessionFirestore();
  return onSnapshot(
    query(collection(activeFirestore, "devices"), where("online", "==", true)),
    (snapshot) => {
      onData(
        snapshot.docs
          .map((docSnapshot) => castDoc<OnlineDevice>(docSnapshot))
          .sort((left, right) => left.name.localeCompare(right.name))
      );
    },
    (error) => onError?.(error as Error)
  );
}

export async function assignVoterToDevice(input: { name: string; voterId: number }) {
  const activeElection = await getActiveElectionBase();
  if (activeElection) {
    const rosterEntry = await getDoc(
      doc(electionRosterCollection(activeElection.id), String(input.voterId))
    );
    if (!rosterEntry.exists()) {
      throw new Error("That voter is not on the active election roster.");
    }
  } else if (
    (await shouldUseMockElectionFallback()) &&
    !mockRoster.some((entry) => entry.voterId === input.voterId)
  ) {
    throw new Error("That voter is not on the local mock election roster.");
  } else if (!(await shouldUseMockElectionFallback())) {
    throw new Error("There is no active election.");
  }

  const device = await findDeviceByName(input.name);
  if (!device) {
    throw new Error("Device not found.");
  }

  if (!device.data.approved) {
    throw new Error("Approve the device before assigning a voter.");
  }

  await clearExistingVoterAssignments(input.voterId, input.name);
  await updateDoc(device.ref, {
    voterId: input.voterId,
    updatedAt: nowIso(),
  });

  return true;
}

export async function unassignDevice(input: { name: string }) {
  const device = await findDeviceByName(input.name);
  if (!device) {
    throw new Error("Device not found.");
  }

  await updateDoc(device.ref, {
    voterId: null,
    updatedAt: nowIso(),
  });
  return true;
}

export async function createVotingRecord(input: { name: string; img?: string }) {
  const timestamp = nowIso();
  const id = createNumericId();
  const existing = await getDocs(
    query(electionsCollection, where("name", "==", input.name.trim()), limit(1))
  );

  if (!input.name.trim()) {
    throw new Error("Election name is required.");
  }

  if (!existing.empty) {
    throw new Error("An election with that name already exists.");
  }

  const existingActive = await getActiveElectionBase();

  const election: Omit<VotingRecord, "Panels" | "Voters" | "Votes"> = {
    id,
    name: input.name.trim(),
    img: input.img?.trim() || DEFAULT_ELECTION_IMAGE,
    isActive: !existingActive,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setDoc(doc(electionsCollection, String(id)), election);
  return election;
}

export async function updateVotingRecord(input: {
  votingId: number;
  name: string;
  img?: string;
}) {
  const ref = doc(electionsCollection, String(input.votingId));
  const existingSnapshot = await getDoc(ref);
  const existingElection = existingSnapshot.exists()
    ? (existingSnapshot.data() as Omit<VotingRecord, "Panels" | "Voters" | "Votes">)
    : null;
  const nextImage = input.img?.trim() || DEFAULT_ELECTION_IMAGE;

  await updateDoc(ref, {
    name: input.name.trim(),
    img: nextImage,
    updatedAt: nowIso(),
  });

  if (existingElection?.img && existingElection.img !== nextImage) {
    await deleteUploadedImage(existingElection.img);
  }

  return true;
}

export async function deleteVotingRecord(input: { votingId: number }) {
  const electionRef = doc(electionsCollection, String(input.votingId));
  const electionSnapshot = await getDoc(electionRef);
  const deletedElection =
    electionSnapshot.exists()
      ? (electionSnapshot.data() as Omit<VotingRecord, "Panels" | "Voters" | "Votes">)
      : null;
  const panels = await readElectionPanels(input.votingId);
  const panelImages = panels.map((panel) => panel.img);
  const candidateImages = panels.flatMap((panel) =>
    panel.Candidates.map((link) => link.Candidate.img)
  );

  await deleteCollectionDocs(electionPanelsCollection(input.votingId));
  await deleteCollectionDocs(electionRosterCollection(input.votingId));
  await deleteCollectionDocs(electionBallotsCollection(input.votingId));
  await deleteDoc(electionRef);
  await deleteUploadedImages([
    deletedElection?.img,
    ...panelImages,
    ...candidateImages,
  ]);

  if (deletedElection?.isActive) {
    const remainingSnapshot = await getDocs(
      query(electionsCollection, orderBy("createdAt", "desc"), limit(1))
    );

    if (!remainingSnapshot.empty) {
      await updateDoc(remainingSnapshot.docs[0].ref, {
        isActive: true,
        updatedAt: nowIso(),
      });
    }
  }

  return true;
}

export async function setActiveVotingRecord(input: { votingId: number }) {
  const snapshot = await getDocs(electionsCollection);
  const batch = writeBatch(firestore);
  snapshot.docs.forEach((docSnapshot) => {
    batch.update(docSnapshot.ref, {
      isActive: castDoc<Omit<VotingRecord, "Panels" | "Voters" | "Votes">>(
        docSnapshot
      ).id === input.votingId,
      updatedAt: nowIso(),
    });
  });
  await batch.commit();
  return true;
}

export async function createPanelRecord(input: {
  panelName: string;
  panelColor: string;
  textColor: string;
  img?: string;
  votingId: number;
  candidates: {
    id?: number;
    name: string;
    img: string;
    position: string;
  }[];
}) {
  const timestamp = nowIso();
  const id = createNumericId();
  const panel: PanelRecord = {
    id,
    panelName: input.panelName.trim(),
    panelColor: input.panelColor,
    textColor: input.textColor,
    img: input.img?.trim() || DEFAULT_PANEL_IMAGE,
    votingId: input.votingId,
    createdAt: timestamp,
    updatedAt: timestamp,
    Candidates: panelCandidatesToLinks(input.candidates),
  };

  await setDoc(doc(electionPanelsCollection(input.votingId), String(id)), panel);
  return panel;
}

export async function updatePanelRecord(input: {
  panelId: number;
  panelName: string;
  panelColor: string;
  textColor: string;
  img?: string;
  votingId: number;
  candidates: {
    id?: number;
    name: string;
    img: string;
    position: string;
  }[];
}) {
  const ref = doc(electionPanelsCollection(input.votingId), String(input.panelId));
  const existing = await getDoc(ref);
  const existingPanel = existing.data() as PanelRecord | undefined;
  const createdAt = existingPanel?.createdAt || nowIso();
  const nextPanelImage = input.img?.trim() || DEFAULT_PANEL_IMAGE;
  const nextCandidateImages = input.candidates.map(
    (candidate) => candidate.img.trim() || DEFAULT_CANDIDATE_IMAGE
  );

  const panel: PanelRecord = {
    id: input.panelId,
    panelName: input.panelName.trim(),
    panelColor: input.panelColor,
    textColor: input.textColor,
    img: nextPanelImage,
    votingId: input.votingId,
    createdAt,
    updatedAt: nowIso(),
    Candidates: panelCandidatesToLinks(input.candidates),
  };

  await setDoc(ref, panel);

  const removedImages: string[] = [];

  if (existingPanel?.img && existingPanel.img !== nextPanelImage) {
    removedImages.push(existingPanel.img);
  }

  for (const existingCandidate of existingPanel?.Candidates || []) {
    if (!nextCandidateImages.includes(existingCandidate.Candidate.img)) {
      removedImages.push(existingCandidate.Candidate.img);
    }
  }

  await deleteUploadedImages(removedImages);
  return panel;
}

export async function deletePanelRecord(input: { panelId: number }) {
  const snapshot = await getDocs(
    query(collectionGroup(firestore, "panels"), where("id", "==", input.panelId), limit(1))
  );

  if (snapshot.empty) {
    throw new Error("Panel not found.");
  }

  const panelDoc = snapshot.docs[0];
  const panel = castDoc<PanelRecord>(panelDoc);
  const candidateIds = panel.Candidates.map((link) => link.candidateId);
  const ballots = await readElectionBallots(panel.votingId as number);

  await Promise.all(
    ballots.map(async (ballot) => {
      const filteredSelections = ballot.selections.filter(
        (selection) => !candidateIds.includes(selection.candidateId)
      );

      if (filteredSelections.length === ballot.selections.length) {
        return;
      }

      const ballotRef = doc(
        electionBallotsCollection(panel.votingId as number),
        ballot.id
      );

      if (filteredSelections.length === 0) {
        await deleteDoc(ballotRef);
        return;
      }

      await updateDoc(ballotRef, {
        selections: filteredSelections,
        updatedAt: nowIso(),
      });
    })
  );

  await deleteDoc(panelDoc.ref);
  await deleteUploadedImages([
    panel.img,
    ...panel.Candidates.map((link) => link.Candidate.img),
  ]);
  return true;
}

export async function getAllPanels() {
  const snapshot = await getDocs(collectionGroup(firestore, "panels"));
  return snapshot.docs.map((docSnapshot) => castDoc<PanelRecord>(docSnapshot));
}

export async function getAllVotings() {
  const snapshot = await getDocs(query(electionsCollection, orderBy("createdAt", "desc")));
  const records = await Promise.all(
    snapshot.docs.map((docSnapshot) =>
      buildVotingRecord(
        castDoc<Omit<VotingRecord, "Panels" | "Voters" | "Votes">>(docSnapshot)
      )
    )
  );

  if (USE_LOCAL_MOCK_ROSTER && records.length === 0) {
    return [buildMockVotingRecord(), ...records.filter((record) => record.id !== MOCK_VOTING_ID)];
  }

  return records;
}

export async function getActiveVotingDetailed() {
  const activeFirestore = getSessionFirestore();
  const activeElection = await getActiveElectionBase(activeFirestore);
  if (!activeElection) {
    if (await shouldUseMockElectionFallback()) {
      return buildMockVotingRecord();
    }
    return null;
  }
  return buildVotingRecord(activeElection, {
    includeVotes: !firebaseDeviceAuth.currentUser,
    db: activeFirestore,
  });
}

export async function getVotingById(votingId: number) {
  if ((await shouldUseMockElectionFallback()) && votingId === MOCK_VOTING_ID) {
    return buildMockVotingRecord();
  }
  return getElectionByIdInternal(votingId);
}

export async function getPublicResultsById(votingId: number) {
  if ((await shouldUseMockElectionFallback()) && votingId === MOCK_VOTING_ID) {
    return buildMockVotingRecord();
  }

  const publicResultsRef = doc(publicResultsCollection, String(votingId));
  let snapshot = await getDoc(publicResultsRef);

  if (!snapshot.exists()) {
    const publishResults = httpsCallable(
      firebaseFunctions,
      "publishPublicResultsNow"
    );
    await publishResults({ votingId });
    snapshot = await getDoc(publicResultsRef);
  }

  if (!snapshot.exists()) {
    throw new Error("Public results have not been published yet.");
  }

  return snapshot.data() as VotingRecord;
}

export async function getVotingRoster(votingId: number) {
  if ((await shouldUseMockElectionFallback()) && votingId === MOCK_VOTING_ID) {
    const mockElection = buildMockVotingRecord();
    return {
      id: mockElection.id,
      name: mockElection.name,
      img: mockElection.img,
      votedVoterIds: [],
      Voters: mockElection.Voters,
    };
  }

  const activeFirestore = getSessionFirestore();
  const electionRef = doc(collection(activeFirestore, "elections"), String(votingId));
  const electionSnapshot = await getDoc(electionRef);

  if (!electionSnapshot.exists()) {
    throw new Error("Election not found.");
  }

  const electionBase =
    electionSnapshot.data() as Omit<VotingRecord, "Panels" | "Voters" | "Votes">;
  const Voters = await readElectionRoster(votingId, activeFirestore);

  let votedVoterIds: number[] = [];

  try {
    const ballots = await readElectionBallots(votingId, activeFirestore);
    votedVoterIds = Array.from(new Set(ballots.map((ballot) => ballot.voterId)));
  } catch (error) {
    if (!(error instanceof Error) || !error.message.toLowerCase().includes("permission")) {
      throw error;
    }
  }

  return {
    id: electionBase.id,
    name: electionBase.name,
    img: electionBase.img,
    votedVoterIds,
    Voters,
  };
}

export async function importManyVotersToElection(input: {
  votingId: number;
  voters: (VoterRecord & { extraFields?: Record<string, string> })[];
}) {
  const batch = writeBatch(firestore);
  const timestamp = nowIso();

  input.voters.forEach((voter) => {
    const voterData: VoterRecord = {
      id: voter.id || voter.voterId,
      voterId: voter.voterId,
      firstAndMiddleName: voter.firstAndMiddleName,
      lastName: voter.lastName,
      streetAddress: voter.streetAddress,
      city: voter.city,
      state: voter.state,
      phone: voter.phone || "",
      yob: voter.yob,
      permanentAddress: voter.permanentAddress,
      comments: voter.comments || "",
    };

    batch.set(doc(votersCollection, String(voter.voterId)), voterData, { merge: true });

    const rosterEntry: ElectionVoterRecord = {
      id: voter.voterId,
      votingId: input.votingId,
      voterId: voter.voterId,
      extraFields: voter.extraFields || {},
      Voter: voterData,
    };

    batch.set(
      doc(electionRosterCollection(input.votingId), String(voter.voterId)),
      {
        ...rosterEntry,
        updatedAt: timestamp,
      },
      { merge: true }
    );
  });

  await batch.commit();
  return { count: input.voters.length };
}

export async function clearElectionVoters(input: { votingId: number }) {
  if ((await shouldUseMockElectionFallback()) && input.votingId === MOCK_VOTING_ID) {
    return { count: mockRoster.length };
  }

  const roster = await readElectionRoster(input.votingId);
  const voterIds = new Set(roster.map((entry) => entry.voterId));
  const devicesSnapshot = await getDocs(devicesCollection);

  await Promise.all([
    deleteCollectionDocs(electionRosterCollection(input.votingId)),
    deleteCollectionDocs(electionBallotsCollection(input.votingId)),
    ...devicesSnapshot.docs.map(async (docSnapshot) => {
      const device = castDoc<OnlineDevice>(docSnapshot);
      if (device.voterId && voterIds.has(device.voterId)) {
        await updateDoc(docSnapshot.ref, { voterId: null, updatedAt: nowIso() });
      }
    }),
  ]);

  return { count: roster.length };
}

export async function resetElectionVotes(input: { votingId: number }) {
  if ((await shouldUseMockElectionFallback()) && input.votingId === MOCK_VOTING_ID) {
    return { count: 0 };
  }

  const ballots = await readElectionBallots(input.votingId);
  await deleteCollectionDocs(electionBallotsCollection(input.votingId));

  return { count: ballots.length };
}

export async function getVoterById(voterId: number) {
  if (await shouldUseMockElectionFallback()) {
    const mockVoter = mockRoster.find((entry) => entry.voterId === voterId)?.Voter;
    if (mockVoter) {
      return mockVoter;
    }
  }

  const snapshot = await getDoc(
    doc(collection(getSessionFirestore(), "voters"), String(voterId))
  );
  if (!snapshot.exists()) {
    throw new Error("Voter not found.");
  }
  return snapshot.data() as VoterRecord;
}

export async function submitVoteRecord(input: {
  deviceId: number;
  voterId: number;
  votingId: number;
  selections: { position: string; candidateId: number }[];
}) {
  const activeFirestore = getSessionFirestore();
  const ballotRef = doc(
    collection(activeFirestore, "elections", String(input.votingId), "ballots"),
    String(input.voterId)
  );

  const ballot: StoredBallot = {
    id: String(input.voterId),
    voterId: input.voterId,
    deviceId: input.deviceId,
    votingId: input.votingId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    selections: input.selections,
  };

  await setDoc(ballotRef, ballot);

  const devices = await getDocs(
    query(collection(activeFirestore, "devices"), where("voterId", "==", input.voterId))
  );
  await Promise.all(
    devices.docs.map((docSnapshot) =>
      updateDoc(docSnapshot.ref, {
        voterId: null,
        updatedAt: nowIso(),
      })
    )
  );

  return ballot;
}
