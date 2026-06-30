// Firestore persistence for generation history.
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "@/lib/firebase";
import type { GenerateResult } from "@/lib/types";

const COLLECTION = "generations";

export interface GenerationRecord {
  id: string;
  brief: string;
  platforms: string[];
  results: GenerateResult[];
  createdAt: number | null; // epoch ms, or null until the server timestamp resolves
}

export { isFirebaseConfigured };

/** Persist one generation. Returns the new document id, or null if Firebase isn't configured. */
export async function saveGeneration(input: {
  brief: string;
  platforms: string[];
  results: GenerateResult[];
}): Promise<string | null> {
  if (!db) return null;
  const ref = await addDoc(collection(db, COLLECTION), {
    brief: input.brief,
    platforms: input.platforms,
    results: input.results,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Load the most recent generations, newest first. */
export async function listGenerations(max = 25): Promise<GenerationRecord[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt;
    return {
      id: doc.id,
      brief: typeof data.brief === "string" ? data.brief : "",
      platforms: Array.isArray(data.platforms) ? data.platforms : [],
      results: Array.isArray(data.results) ? (data.results as GenerateResult[]) : [],
      createdAt:
        createdAt instanceof Timestamp ? createdAt.toMillis() : null,
    };
  });
}
