const path = require("path");
const fs = require("fs");
// Load dotenv from server directory before initializing Firebase Admin
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const bcrypt = require("bcryptjs");

const serviceAccountPath = path.join(__dirname, "../firebase-key.json");
// Check if we should force emulator
const useEmulator = process.env.USE_EMULATOR === "true";

let initializedProject = "";

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  
  initializedProject = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "knotoria-6057a";
  initializeApp({
    projectId: initializedProject
  });
  console.log(`Initialized Firebase Admin using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST} for project: ${initializedProject}`);
} else {
  // Attempt initialization using env variables or service account file
  try {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      initializedProject = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "knotoria-6057a";
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      initializeApp({
        credential: cert({
          projectId: initializedProject,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
      console.log("Firebase Admin initialized for project: " + initializedProject + " using individual environment variables.");
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (fs.existsSync(credPath)) {
        const serviceAccount = require(credPath);
        initializedProject = serviceAccount.project_id;
        initializeApp({
          credential: cert(serviceAccount)
        });
        console.log("Firebase Admin initialized for project: " + initializedProject + " using GOOGLE_APPLICATION_CREDENTIALS file.");
      } else {
        throw new Error(`GOOGLE_APPLICATION_CREDENTIALS file not found at path: ${credPath}`);
      }
    } else if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      initializedProject = serviceAccount.project_id;
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log("Firebase Admin initialized for project: " + initializedProject + " using local serviceAccountKey.json");
    } else {
      // Fallback default initialization (might fail if no credentials, but at least tries)
      initializeApp();
      console.log("Firebase Admin initialized using default credentials.");
    }
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err.message);
  }
}

const db = getFirestore();

// ---- Seed default admin and test user ----
async function ensureUsersSeeded() {
  try {
    const usersRef = db.collection("users");
    const defaultEmail = process.env.ADMIN_EMAIL || "admin@knotoria.com";
    const defaultPassword = process.env.ADMIN_PASSWORD || "knotoria123";
    const hash = bcrypt.hashSync(defaultPassword, 10);

    let adminUid = "admin_default_uid";

    // 1. Seed Admin in Firebase Auth if emulator or connection allows
    try {
      const authAdmin = getAuth();
      let authUser;
      try {
        authUser = await authAdmin.getUserByEmail(defaultEmail);
        adminUid = authUser.uid;
      } catch (authErr) {
        if (authErr.code === "auth/user-not-found") {
          authUser = await authAdmin.createUser({
            email: defaultEmail,
            password: defaultPassword,
            displayName: "Store Administrator",
            emailVerified: true
          });
          adminUid = authUser.uid;
          console.log(`Created admin user in Firebase Auth: ${defaultEmail}`);
        } else {
          throw authErr;
        }
      }
    } catch (authErr) {
      console.warn("Could not seed Admin in Firebase Auth (check if emulator is running):", authErr.message);
    }

    // 2. Seed Admin document in users collection
    const adminSnapshot = await usersRef.where("email", "==", defaultEmail).limit(1).get();
    if (adminSnapshot.empty) {
      await usersRef.doc(adminUid).set({
        name: "Store Administrator",
        email: defaultEmail,
        phone: "123-456-7890",
        role: "admin",
        password_hash: hash,
        created_at: new Date().toISOString()
      });
      console.log(`Created admin user "${defaultEmail}" in Firestore "users" collection.`);
    }

    // 3. For backwards compatibility, seed the legacy admins collection as well
    const adminsRef = db.collection("admins");
    const legacyAdminSnapshot = await adminsRef.limit(1).get();
    if (legacyAdminSnapshot.empty) {
      await adminsRef.doc(adminUid).set({
        username: defaultEmail.split("@")[0], // e.g. "admin"
        password_hash: hash,
        created_at: new Date().toISOString()
      });
      console.log(`Created legacy admin user entry in Firestore "admins" collection.`);
    }

    // 4. Seed Test Customer User
    const testEmail = "testuser@knotoria.com";
    const testPassword = "testpassword123";
    let testUid = "test_user_default_uid";

    try {
      const authAdmin = getAuth();
      let authUser;
      try {
        authUser = await authAdmin.getUserByEmail(testEmail);
        testUid = authUser.uid;
      } catch (authErr) {
        if (authErr.code === "auth/user-not-found") {
          authUser = await authAdmin.createUser({
            email: testEmail,
            password: testPassword,
            displayName: "Test Customer",
            emailVerified: true
          });
          testUid = authUser.uid;
          console.log(`Created test customer in Firebase Auth: ${testEmail}`);
        } else {
          throw authErr;
        }
      }
    } catch (authErr) {
      console.warn("Could not seed test customer in Firebase Auth:", authErr.message);
    }

    const testSnapshot = await usersRef.where("email", "==", testEmail).limit(1).get();
    if (testSnapshot.empty) {
      await usersRef.doc(testUid).set({
        name: "Test Customer",
        email: testEmail,
        phone: "987-654-3210",
        role: "user",
        created_at: new Date().toISOString()
      });
      console.log(`Created test user "${testEmail}" in Firestore "users" collection.`);
    }
  } catch (err) {
    console.error("Error seeding users in Firestore:", err.message);
  }
}

// Delay briefly to allow database connection to stabilize
setTimeout(ensureUsersSeeded, 1000);

module.exports = db;
