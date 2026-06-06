// Firebase Configuration and Initialization Module

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4V9VkcYNeg-MFif4bw-EwIx87yBezM3Y",
  authDomain: "cook-connectapp.firebaseapp.com",
  projectId: "cook-connectapp",
  storageBucket: "cook-connectapp.firebasestorage.app",
  messagingSenderId: "223735091243",
  appId: "1:223735091243:web:57df46e8f14b5d29349a6e",
  measurementId: "G-87B5ZWQ494"
};

// Initialize services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
