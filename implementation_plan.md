# Production Readiness Implementation Plan

This plan details the steps required to secure, harden, and prepare the CookConnect community platform for live deployment. It transitions database operations from unsecured client-side writes to transaction-safe operations, introduces robust database security rules, and adds user safety (reporting/blocking) mechanisms.

## User Review Required

> [!WARNING]
> Implementing **Firestore Security Rules** requires deploying them via the Firebase CLI to your active Firebase project (`cook-connectapp`). Without this deployment, the database will remain unsecured.
> We will generate a `firestore.rules` file in the root of your workspace for you to deploy.

> [!IMPORTANT]
> Since Firebase Spark (Free Tier) does not allow outbound networking for Cloud Functions without a billing account, we are using **Client-Side Firestore Transactions** (`runTransaction`) for review aggregations. This prevents race conditions without requiring server-side cloud function deployment.

## Proposed Changes

We will introduce safety and security enhancements across database queries, stylesheets, markup layouts, and security rule files.

---

### Security Configuration

#### [NEW] [firestore.rules](file:///Users/bharatpanthee/.gemini/antigravity-ide/scratch/cook-connect/firestore.rules)
* Create rules defining read/write permissions for all collections:
  * `/users/{userId}`: Write only allowed if `request.auth.uid == userId`.
  * `/chefs/{chefId}`: Write only allowed if `request.auth.uid == chefId`.
  * `/recipes/{recipeId}`: Create/Update/Delete only if `request.auth.uid == resource.data.userId` or (for new documents) `request.auth.uid == request.resource.data.userId`.
  * `/requests/{requestId}`: Create/Update/Delete only if `request.auth.uid == resource.data.userId` or `request.auth.uid == request.resource.data.userId`.
  * `/chats/{chatId}`: Read/Write only if `request.auth.uid` is in `resource.data.participants` or `request.resource.data.participants`.
  * `/chats/{chatId}/messages/{msgId}`: Write only if `request.auth.uid == request.resource.data.senderId` AND the user is a participant of the parent chat.
  * `/meetings/{meetingId}`: Read/Write only if `request.auth.uid` is the `userId` or `chefId` of the meeting.
  * `/reports/{reportId}`: Any authenticated user can create a report. No users (except admin rules) can read or modify reports.

---

### Database Integrity (Transactions)

#### [MODIFY] [db-service.js](file:///Users/bharatpanthee/.gemini/antigravity-ide/scratch/cook-connect/db-service.js)
* Refactor `createReview` to use `runTransaction`.
* The transaction will:
  1. Retrieve the target Chef's profile document.
  2. Calculate the updated average rating: `((oldRating * oldCount) + newScore) / (oldCount + 1)`.
  3. Write the new review document to `/chefs/{chefId}/reviews/{reviewId}`.
  4. Write the updated `rating` and `reviewsCount` to the Chef's profile document.
* Implement `reportContent` helper to record user reports of chefs, recipes, or reviews to a new `/reports` collection.
* Implement `blockUser` and `unblockUser` helpers updating a `blockedUsers` list inside the user's profile.

---

### Safety and Moderation UI

#### [MODIFY] [index.html](file:///Users/bharatpanthee/.gemini/antigravity-ide/scratch/cook-connect/index.html)
* Add a "Report" button in the Chef Details dialog modal.
* Add a "Report" button to each recipe details modal view.
* Add a "Block User" button to the active chat header next to the schedule button.
* Create a generic Report Submission Modal (`#report-modal`) with a dropdown for reasons (Spam, Harassment, Inappropriate Content) and a comments textarea.

#### [MODIFY] [app.js](file:///Users/bharatpanthee/.gemini/antigravity-ide/scratch/cook-connect/app.js)
* Bind click event handlers for the new "Report" actions on Chefs, Recipes, and Chats.
* Handle submission of the `#report-modal` form, saving findings into the `/reports` collection.
* Add event listeners for "Block User" which prompts confirmation and calls `blockUser` in `db-service.js`.
* Update message-fetching listeners to filter out chat rooms and messages belonging to blocked users.

#### [MODIFY] [style.css](file:///Users/bharatpanthee/.gemini/antigravity-ide/scratch/cook-connect/style.css)
* Add styling rules for report buttons, flag icons, the report dialog modal, and the visual styling of blocked chat indicators.

---

## Verification Plan

### Automated Tests
* We can verify that the rules and transactions load properly by simulating unauthorized operations (e.g. attempting to update another chef's rating) in the console.

### Manual Verification
1. **Security Verification**: Log in as User A and attempt to update User B's profile document or write a review on yourself (verify UI prevents this, and security rules block direct document access).
2. **Transaction Test**: Concurrently submit two reviews on the same cook and verify both are logged and average ratings reconcile correctly.
3. **Safety Controls**: Open a chat room, click "Block User", verify that the room immediately disappears from your active chats panel and that no notifications or messages from that user can be received.
4. **Report Flow**: Click "Report" on a recipe, submit a report, verify it writes to `/reports` in Firebase.
