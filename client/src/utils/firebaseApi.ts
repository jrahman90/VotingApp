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
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { firebaseAuth, firestore } from "./firebase";

export interface StaffRecord {
  id: number;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnlineDevice {
  id: number;
  name: string;
  voterId?: number | null;
  createdAt: string;
  updatedAt: string;
  online: boolean;
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

const nowIso = () => new Date().toISOString();
const createNumericId = () =>
  Date.now() + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000);

const electionsCollection = collection(firestore, "elections");
const devicesCollection = collection(firestore, "devices");
const votersCollection = collection(firestore, "voters");
const staffCollection = collection(firestore, "staff");

const electionPanelsCollection = (votingId: number) =>
  collection(firestore, "elections", String(votingId), "panels");
const electionRosterCollection = (votingId: number) =>
  collection(firestore, "elections", String(votingId), "roster");
const electionBallotsCollection = (votingId: number) =>
  collection(firestore, "elections", String(votingId), "ballots");

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

async function readElectionPanels(votingId: number): Promise<PanelRecord[]> {
  const snapshot = await getDocs(query(electionPanelsCollection(votingId), orderBy("createdAt")));
  return snapshot.docs.map((docSnapshot) => castDoc<PanelRecord>(docSnapshot));
}

async function readElectionRoster(votingId: number): Promise<ElectionVoterRecord[]> {
  const snapshot = await getDocs(
    query(electionRosterCollection(votingId), orderBy("voterId"))
  );
  return snapshot.docs.map((docSnapshot) => castDoc<ElectionVoterRecord>(docSnapshot));
}

async function readElectionBallots(votingId: number): Promise<StoredBallot[]> {
  const snapshot = await getDocs(query(electionBallotsCollection(votingId)));
  return snapshot.docs.map((docSnapshot) => castDoc<StoredBallot>(docSnapshot));
}

async function buildVotingRecord(base: Omit<VotingRecord, "Panels" | "Voters" | "Votes">) {
  const [Panels, Voters, ballots] = await Promise.all([
    readElectionPanels(base.id),
    readElectionRoster(base.id),
    readElectionBallots(base.id),
  ]);

  return {
    ...base,
    Panels,
    Voters,
    Votes: flattenBallots(ballots),
  } satisfies VotingRecord;
}

async function getActiveElectionBase() {
  const snapshot = await getDocs(
    query(electionsCollection, where("isActive", "==", true), limit(1))
  );

  if (snapshot.empty) {
    return null;
  }

  return castDoc<Omit<VotingRecord, "Panels" | "Voters" | "Votes">>(
    snapshot.docs[0]
  );
}

async function findDeviceByName(name: string) {
  const snapshot = await getDocs(
    query(devicesCollection, where("name", "==", name), limit(1))
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
    return existing.data() as StaffRecord;
  }

  const timestamp = nowIso();
  const staffRecord: StaffRecord = {
    id: createNumericId(),
    email,
    password: "",
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
  if (firebaseAuth.currentUser?.isAnonymous) {
    await signOut(firebaseAuth);
  }

  await signInWithEmailAndPassword(firebaseAuth, input.email, input.password);
  return ensureStaffRecord(input.email);
}

export async function registerDeviceWithFirebase(input: { name: string }) {
  if (!input.name.trim()) {
    throw new Error("Device name is required.");
  }

  if (firebaseAuth.currentUser && !firebaseAuth.currentUser.isAnonymous) {
    await signOut(firebaseAuth);
  }

  if (!firebaseAuth.currentUser) {
    await signInAnonymously(firebaseAuth);
  }

  const timestamp = nowIso();
  const existing = await findDeviceByName(input.name.trim());

  if (existing) {
    const device: OnlineDevice = {
      ...existing.data,
      name: input.name.trim(),
      online: true,
      authUid: firebaseAuth.currentUser?.uid || null,
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
    authUid: firebaseAuth.currentUser?.uid || null,
  };

  await setDoc(doc(devicesCollection, String(id)), device);
  return device;
}

export async function unregisterDeviceWithFirebase(input: { name: string }) {
  const device = await findDeviceByName(input.name);
  if (!device) {
    throw new Error("Device not found.");
  }

  await updateDoc(device.ref, {
    online: false,
    voterId: null,
    updatedAt: nowIso(),
  });

  await signOut(firebaseAuth);
  return true;
}

export function subscribeToConnectedDevices(
  onData: (devices: OnlineDevice[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(devicesCollection, where("online", "==", true), orderBy("name")),
    (snapshot) => {
      onData(snapshot.docs.map((docSnapshot) => castDoc<OnlineDevice>(docSnapshot)));
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
  }

  const device = await findDeviceByName(input.name);
  if (!device) {
    throw new Error("Device not found.");
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
  await updateDoc(ref, {
    name: input.name.trim(),
    img: input.img?.trim() || DEFAULT_ELECTION_IMAGE,
    updatedAt: nowIso(),
  });
  return true;
}

export async function deleteVotingRecord(input: { votingId: number }) {
  await deleteCollectionDocs(electionPanelsCollection(input.votingId));
  await deleteCollectionDocs(electionRosterCollection(input.votingId));
  await deleteCollectionDocs(electionBallotsCollection(input.votingId));
  await deleteDoc(doc(electionsCollection, String(input.votingId)));
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
  const createdAt =
    (existing.data() as PanelRecord | undefined)?.createdAt || nowIso();

  const panel: PanelRecord = {
    id: input.panelId,
    panelName: input.panelName.trim(),
    panelColor: input.panelColor,
    textColor: input.textColor,
    img: input.img?.trim() || DEFAULT_PANEL_IMAGE,
    votingId: input.votingId,
    createdAt,
    updatedAt: nowIso(),
    Candidates: panelCandidatesToLinks(input.candidates),
  };

  await setDoc(ref, panel);
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
  return true;
}

export async function getAllPanels() {
  const snapshot = await getDocs(collectionGroup(firestore, "panels"));
  return snapshot.docs.map((docSnapshot) => castDoc<PanelRecord>(docSnapshot));
}

export async function getAllVotings() {
  const snapshot = await getDocs(query(electionsCollection, orderBy("createdAt", "desc")));
  return Promise.all(
    snapshot.docs.map((docSnapshot) =>
      buildVotingRecord(
        castDoc<Omit<VotingRecord, "Panels" | "Voters" | "Votes">>(docSnapshot)
      )
    )
  );
}

export async function getActiveVotingDetailed() {
  const activeElection = await getActiveElectionBase();
  if (!activeElection) {
    return null;
  }
  return buildVotingRecord(activeElection);
}

export async function getVotingById(votingId: number) {
  return getElectionByIdInternal(votingId);
}

export async function getVotingRoster(votingId: number) {
  const election = await getElectionByIdInternal(votingId);
  const votedVoterIds = Array.from(new Set(election.Votes.map((vote) => vote.voterId)));
  return {
    id: election.id,
    name: election.name,
    img: election.img,
    votedVoterIds,
    Voters: election.Voters,
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

export async function getVoterById(voterId: number) {
  const snapshot = await getDoc(doc(votersCollection, String(voterId)));
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
  const ballotRef = doc(electionBallotsCollection(input.votingId), String(input.voterId));
  const existing = await getDoc(ballotRef);

  if (existing.exists()) {
    throw new Error("This voter has already voted in this election.");
  }

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

  const devices = await getDocs(query(devicesCollection, where("voterId", "==", input.voterId)));
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
