import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

if (!getApps().length) {
  // biome-ignore lint/suspicious/noExplicitAny: explicit
  let credential: any;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      );
      credential = cert(serviceAccount);
    }
  } catch (e) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY", e);
  }

  try {
    initializeApp({
      credential: credential || applicationDefault(),
    });
  } catch (err) {
    console.error(
      "Firebase Admin initialization error (missing credentials?):",
      err,
    );
  }
}

export const admin = {};
