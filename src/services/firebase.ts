/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import rawConfig from "../../firebase-applet-config.json";

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

// Stored override if user entered their own project
const CUSTOM_CONFIG_KEY = "rutatrack_custom_firebase_config";

export function getActiveFirebaseConfig(): FirebaseAppConfig {
  try {
    const custom = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (custom) {
      return JSON.parse(custom);
    }
  } catch {
    // fallback
  }
  return rawConfig as FirebaseAppConfig;
}

export function saveCustomFirebaseConfig(config: FirebaseAppConfig | null) {
  if (!config) {
    localStorage.removeItem(CUSTOM_CONFIG_KEY);
  } else {
    localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
  }
  window.location.reload();
}

export const firebaseConfig = getActiveFirebaseConfig();

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let connectionStatus: "connected" | "offline" | "error" | "unconfigured" = isFirebaseConfigured ? "connected" : "unconfigured";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn("🔥 Firestore Error handled:", JSON.stringify(errInfo));
  return errInfo;
}

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
      ? firebaseConfig.firestoreDatabaseId
      : undefined;

    // Use initializeFirestore with experimentalForceLongPolling to prevent iframe connection drops
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      }, dbId);
    } catch {
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    }

    storage = getStorage(app);
    connectionStatus = "connected";
    console.log(`🔥 RutaTrack: Firebase inicializado con éxito. Proyecto: "${firebaseConfig.projectId}", DB: "${firebaseConfig.firestoreDatabaseId || '(default)'}"`);
  } catch (error) {
    console.error("❌ RutaTrack: Error al inicializar Firebase:", error);
    connectionStatus = "error";
  }
} else {
  console.warn("⚠️ RutaTrack: Firebase no configurado.");
}

export function getConnectionStatus() {
  return connectionStatus;
}

export { app, auth, db, storage };
