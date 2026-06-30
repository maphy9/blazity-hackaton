// Per-user platform credentials, stored under users/{uid}/connections/{platformId}.
import { collection, doc, getDocs, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getPlatform, type Platform } from "@/lib/platforms";
import type { PlatformCredentials } from "@/lib/types";

export type CredentialsMap = Record<string, PlatformCredentials>;

function connectionsCol(uid: string) {
  if (!db) throw new Error("Firebase is not configured.");
  return collection(db, "users", uid, "connections");
}

/** Load all saved platform credentials for a user. */
export async function loadCredentials(uid: string): Promise<CredentialsMap> {
  if (!db) return {};
  const snap = await getDocs(connectionsCol(uid));
  const map: CredentialsMap = {};
  snap.forEach((d) => {
    map[d.id] = d.data() as PlatformCredentials;
  });
  return map;
}

/** Save (overwrite) one platform's credentials. */
export async function saveCredentials(
  uid: string,
  platformId: string,
  creds: PlatformCredentials,
): Promise<void> {
  if (!db) throw new Error("Firebase is not configured.");
  await setDoc(doc(db, "users", uid, "connections", platformId), creds);
}

/** A platform is "connected" when every required credential field is filled. */
export function isConnected(
  platform: Platform | string,
  creds: PlatformCredentials | undefined,
): boolean {
  const p = typeof platform === "string" ? getPlatform(platform) : platform;
  if (!p || !creds) return false;
  return p.credentialFields.every((f) => Boolean(creds[f.key]?.trim()));
}
