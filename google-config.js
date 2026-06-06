// Google API client credentials configuration
export const googleConfig = {
  // Set to true to enable real Google Calendar & Meet scheduling.
  // Set to false to run in mock mode (generates mock Meet links instantly).
  useRealGoogleMeet: false,

  // Replace this with your actual Google Cloud Console OAuth 2.0 Web Client ID.
  // Make sure your OAuth client settings permit JavaScript origins from http://localhost:* (or equivalent).
  clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
};
