// Generation history persistence.
//
// Primary store: browser localStorage — always available, works offline, needs
// no setup, so the History widget works in any environment.
// Optional sync: Firestore, used additionally when configured AND its rules allow
// access. Cloud failures are reported (not swallowed) and never block local history.
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
const STORAGE_KEY = "oief:history";
const MAX_RECORDS = 25;

export interface GenerationRecord {
  /** Stable local id — React key and selection id. */
  id: string;
  /** Firestore doc id once a cloud write succeeds; used to dedupe cloud vs local. */
  firestoreId?: string | null;
  brief: string;
  platforms: string[];
  results: GenerateResult[];
  /** Epoch ms. null only for a cloud doc whose server timestamp is still pending. */
  createdAt: number | null;
}

export interface LoadResult {
  records: GenerationRecord[];
  /** Human-readable message when cloud sync failed but local history still loaded. */
  cloudError: string | null;
}

export interface SaveResult {
  record: GenerationRecord;
  cloudError: string | null;
}

export { isFirebaseConfigured };

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readLocal(): GenerationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as GenerationRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(records: GenerationRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records.slice(0, MAX_RECORDS)),
    );
  } catch {
    // Storage full or disabled — non-fatal.
  }
}

function sortRecords(records: GenerationRecord[]): GenerationRecord[] {
  // Newest first; a pending (null) server timestamp sorts to the top.
  return [...records]
    .sort((a, b) => (b.createdAt ?? Infinity) - (a.createdAt ?? Infinity))
    .slice(0, MAX_RECORDS);
}

function cloudMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  if (code === "permission-denied") {
    return "Cloud sync off: Firestore denied access. Deploy firestore.rules to sync across devices. Saved locally.";
  }
  if (code === "unavailable") {
    return "Cloud sync unavailable (offline). Saved locally.";
  }
  return "Cloud sync failed. Saved locally.";
}

/** Persist one generation. Always writes locally; syncs to Firestore best-effort. */
export async function saveGeneration(input: {
  brief: string;
  platforms: string[];
  results: GenerateResult[];
}): Promise<SaveResult> {
  const record: GenerationRecord = {
    id: newId(),
    firestoreId: null,
    brief: input.brief,
    platforms: input.platforms,
    results: input.results,
    createdAt: Date.now(),
  };

  // Local first — this is what makes the widget work without any cloud setup.
  const existing = readLocal();
  writeLocal([record, ...existing]);

  if (!db) return { record, cloudError: null };

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      brief: input.brief,
      platforms: input.platforms,
      results: input.results,
      createdAt: serverTimestamp(),
    });
    // Remember the cloud id so future loads can dedupe this record against its doc.
    record.firestoreId = ref.id;
    writeLocal([record, ...existing]);
    return { record, cloudError: null };
  } catch (err) {
    return { record, cloudError: cloudMessage(err) };
  }
}

/** Load history: localStorage always, merged with Firestore docs when reachable. */
export async function loadHistory(): Promise<LoadResult> {
  const local = readLocal();

  if (!db) return { records: sortRecords(local), cloudError: null };

  try {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION),
        orderBy("createdAt", "desc"),
        limit(MAX_RECORDS),
      ),
    );
    const cloud: GenerationRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt;
      return {
        id: doc.id,
        firestoreId: doc.id,
        brief: typeof data.brief === "string" ? data.brief : "",
        platforms: Array.isArray(data.platforms) ? data.platforms : [],
        results: Array.isArray(data.results) ? (data.results as GenerateResult[]) : [],
        createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : null,
      };
    });

    // Keep local records (stable ids); add only cloud docs with no local counterpart
    // (e.g. created on another device). Avoids showing each synced item twice.
    const syncedIds = new Set(
      local.map((r) => r.firestoreId).filter((id): id is string => Boolean(id)),
    );
    const cloudOnly = cloud.filter((r) => !r.firestoreId || !syncedIds.has(r.firestoreId));

    return { records: sortRecords([...local, ...cloudOnly]), cloudError: null };
  } catch (err) {
    // Cloud read failed (e.g. rules not deployed) — fall back to local, report why.
    return { records: sortRecords(local), cloudError: cloudMessage(err) };
  }
}
