// Authentication Service Module

import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Listen to Firebase Auth changes and fetch user details from Firestore.
 * @param {Function} callback - Function called with user profile or null.
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          callback({
            uid: user.uid,
            email: user.email,
            name: profileData.name || "User",
            role: profileData.role || "client"
          });
        } else {
          callback({
            uid: user.uid,
            email: user.email,
            name: user.displayName || "User",
            role: "client"
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        callback({
          uid: user.uid,
          email: user.email,
          name: user.displayName || "User",
          role: "client"
        });
      }
    } else {
      callback(null);
    }
  });
}

/**
 * Register a new user with Email, Password and Role.
 */
export async function registerUser(name, email, password, role) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Save profile to Cloud Firestore
  await setDoc(doc(db, "users", user.uid), {
    name: name,
    email: email,
    role: role
  });

  return user;
}

/**
 * Sign in an existing user.
 */
export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 */
export async function logoutUser() {
  return signOut(auth);
}
