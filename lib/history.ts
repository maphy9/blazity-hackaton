// Per-user generation history, stored under users/{uid}/generations/{id}.
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "@/lib/firebase";
import type { GenerateResult } from "@/lib/types";

export { isFirebaseConfigured };

/** Persisted publish/schedule state for one platform within a generation. */
export interface PostState {
  status: "published" | "scheduled";
  url?: string;
  scheduledAt?: number;
  publishedAt?: number;
}

export interface GenerationRecord {
  id: string;
  brief: string;
  platforms: string[];
  results: GenerateResult[];
  imageUrls?: string[];
  /** Per-platform publish/schedule state. */
  postStates: Record<string, PostState>;
  createdAt: number | null; // epoch ms, or null until the server timestamp resolves
}

function generationsCol(uid: string) {
  if (!db) throw new Error("Firebase is not configured.");
  return collection(db, "users", uid, "generations");
}

export async function saveGeneration(
  uid: string,
  input: { brief: string; platforms: string[]; results: GenerateResult[]; imageUrls?: string[] },
): Promise<string | null> {
  if (!db) return null;
  const ref = await addDoc(generationsCol(uid), {
    brief: input.brief,
    platforms: input.platforms,
    results: input.results,
    imageUrls: input.imageUrls || [],
    postStates: {},
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Write (or clear) the publish/schedule state for one platform of a generation. */
export async function setPostState(
  uid: string,
  generationId: string,
  platform: string,
  state: PostState | null,
): Promise<void> {
  if (!db) return;
  const ref = doc(db, "users", uid, "generations", generationId);
  await updateDoc(ref, { [`postStates.${platform}`]: state ?? deleteField() });
}

export async function listGenerations(
  uid: string,
  max = 25,
): Promise<GenerationRecord[]> {
  if (!db) return [];
  const q = query(generationsCol(uid), orderBy("createdAt", "desc"), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt;
    const rawStates = (data.postStates ?? {}) as Record<string, PostState>;
    return {
      id: d.id,
      brief: typeof data.brief === "string" ? data.brief : "",
      platforms: Array.isArray(data.platforms) ? data.platforms : [],
      results: Array.isArray(data.results) ? (data.results as GenerateResult[]) : [],
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      postStates: rawStates && typeof rawStates === "object" ? rawStates : {},
      createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : null,
    };
  });
}
