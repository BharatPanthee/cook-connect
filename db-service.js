// Database Service Module

import { db } from "./firebase.js";
import { 
  doc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Fetch user profile from Firestore.
 */
export async function getUserProfile(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? userDoc.data() : null;
}

/**
 * Fetch all registered chefs from Cloud Firestore.
 */
export async function getChefs() {
  const querySnapshot = await getDocs(collection(db, "chefs"));
  const chefsList = [];
  querySnapshot.forEach((doc) => {
    chefsList.push({
      id: doc.id,
      ...doc.data()
    });
  });
  return chefsList;
}

/**
 * Fetch all community help requests from Cloud Firestore.
 */
export async function getRequests() {
  const querySnapshot = await getDocs(collection(db, "requests"));
  const requestsList = [];
  querySnapshot.forEach((doc) => {
    requestsList.push({
      id: doc.id,
      ...doc.data()
    });
  });
  return requestsList;
}

/**
 * Save or update a chef listing in Firestore, and sync the user's role profile.
 */
export async function createChefProfile(uid, chefData) {
  // Save listing to chefs collection
  await setDoc(doc(db, "chefs", uid), chefData);

  // Sync user profile role to "cook"
  await setDoc(doc(db, "users", uid), {
    role: "cook"
  }, { merge: true });
}

/**
 * Add a new cooking request to the community board in Firestore.
 */
export async function createCookingRequest(requestData) {
  return addDoc(collection(db, "requests"), requestData);
}

/**
 * Add a new meeting schedule in Firestore.
 */
export async function createMeeting(meetingData) {
  return addDoc(collection(db, "meetings"), meetingData);
}

/**
 * Fetch all recipes from Cloud Firestore.
 */
export async function getRecipes() {
  const querySnapshot = await getDocs(collection(db, "recipes"));
  const recipesList = [];
  querySnapshot.forEach((doc) => {
    recipesList.push({
      id: doc.id,
      ...doc.data()
    });
  });
  return recipesList;
}

/**
 * Add a new recipe to the community swap library in Firestore.
 */
export async function createRecipe(recipeData) {
  return addDoc(collection(db, "recipes"), recipeData);
}

/**
 * Create or retrieve a deterministic chat room ID between two users.
 */
export async function getOrCreateChatRoom(user1Id, user2Id, user1Name, user2Name) {
  const chatId = [user1Id, user2Id].sort().join("_");
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [user1Id, user2Id],
      participantNames: {
        [user1Id]: user1Name,
        [user2Id]: user2Name
      },
      lastMessage: "",
      updatedAt: new Date().toISOString()
    });
  }
  return chatId;
}

/**
 * Subscribe to messages for a specific chat room in real-time.
 */
export function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(messages);
  });
}

/**
 * Send a message and update the chat room's metadata.
 */
export async function sendMessage(chatId, senderId, senderName, text) {
  const messageData = {
    senderId,
    senderName,
    text,
    createdAt: new Date().toISOString()
  };
  
  await addDoc(collection(db, "chats", chatId, "messages"), messageData);
  
  await setDoc(doc(db, "chats", chatId), {
    lastMessage: text,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Subscribe to all chat rooms a user is part of.
 */
export function subscribeToUserChats(userId, callback) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId)
  );
  return onSnapshot(q, (snapshot) => {
    const rooms = [];
    snapshot.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    // Sort client-side by updatedAt descending
    rooms.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    callback(rooms);
  });
}

/**
 * Get all reviews for a specific chef.
 */
export async function getReviews(chefId) {
  const q = query(collection(db, "reviews"), where("chefId", "==", chefId));
  const querySnapshot = await getDocs(q);
  const reviewsList = [];
  querySnapshot.forEach((doc) => {
    reviewsList.push({
      id: doc.id,
      ...doc.data()
    });
  });
  return reviewsList;
}

/**
 * Add a review and update the chef's average rating in the chefs collection.
 * Uses a transaction to prevent concurrent updates from corrupting rating aggregates.
 */
export async function createReview(reviewData) {
  const chefRef = doc(db, "chefs", reviewData.chefId);
  const reviewsCollectionRef = collection(db, "reviews");
  const newReviewRef = doc(reviewsCollectionRef);

  await runTransaction(db, async (transaction) => {
    const chefDoc = await transaction.get(chefRef);
    if (!chefDoc.exists()) {
      throw new Error("Chef profile does not exist.");
    }

    const chefInfo = chefDoc.data();
    const currentRating = chefInfo.rating || 0;
    const currentCount = chefInfo.reviewsCount || 0;

    const newCount = currentCount + 1;
    const newAverage = parseFloat(((currentRating * currentCount + reviewData.rating) / newCount).toFixed(1));

    // Save the review record
    transaction.set(newReviewRef, reviewData);

    // Update the chef document rating aggregates
    transaction.update(chefRef, {
      rating: newAverage,
      reviewsCount: newCount
    });
  });

  return newReviewRef;
}

/**
 * Toggle a recipe's favorite status for a user profile in Firestore.
 */
export async function toggleRecipeFavorite(userId, recipeId, isFavorite) {
  const userRef = doc(db, "users", userId);
  if (isFavorite) {
    await setDoc(userRef, {
      savedRecipes: arrayUnion(recipeId)
    }, { merge: true });
  } else {
    await setDoc(userRef, {
      savedRecipes: arrayRemove(recipeId)
    }, { merge: true });
  }
}

/**
 * Submit a moderation report for flagged content.
 */
export async function reportContent(reportData) {
  const reportsRef = collection(db, "reports");
  return addDoc(reportsRef, {
    ...reportData,
    createdAt: new Date().toISOString()
  });
}

/**
 * Add a user ID to the current user's blocked list.
 */
export async function blockUser(userId, blockeeId) {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    blockedUsers: arrayUnion(blockeeId)
  }, { merge: true });
}

/**
 * Remove a user ID from the current user's blocked list.
 */
export async function unblockUser(userId, blockeeId) {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    blockedUsers: arrayRemove(blockeeId)
  }, { merge: true });
}
