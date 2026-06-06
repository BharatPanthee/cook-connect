// Google Meet Scheduling Service Module

import { createMeeting } from "./db-service.js";
import { googleConfig } from "./google-config.js";

let tokenClient = null;
let googleAccessToken = null;

/**
 * Generate a random mock Google Meet link (used as fallback).
 * @returns {string} The formatted meet URL.
 */
export function generateMeetLink() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const part1 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part3 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${part1}-${part2}-${part3}`;
}

/**
 * Initialize the Google Identity Services Token Client.
 */
export function initGoogleTokenClient(onSuccess, onError) {
  if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) {
    console.warn("Google Identity Services SDK not loaded.");
    if (onError) onError(new Error("Google Identity Services SDK not loaded yet. Check your connection or index.html script tag."));
    return;
  }

  if (googleConfig.clientId.includes("YOUR_GOOGLE_CLIENT_ID")) {
    console.warn("Google OAuth Client ID is not configured in google-config.js.");
    if (onError) onError(new Error("Please configure your Google Client ID in google-config.js to connect."));
    return;
  }

  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: googleConfig.clientId,
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          console.error("OAuth Callback Error:", tokenResponse.error);
          if (onError) onError(tokenResponse);
          return;
        }

        googleAccessToken = tokenResponse.access_token;
        const expiry = Date.now() + (tokenResponse.expires_in * 1000);
        sessionStorage.setItem("google_access_token", googleAccessToken);
        sessionStorage.setItem("google_token_expiry", expiry.toString());

        if (onSuccess) onSuccess(googleAccessToken);
      },
    });
  } catch (err) {
    console.error("Error during initTokenClient:", err);
    if (onError) onError(err);
  }
}

/**
 * Check and return a cached valid OAuth access token from sessionStorage.
 */
export function getCachedToken() {
  if (googleAccessToken) return googleAccessToken;

  const token = sessionStorage.getItem("google_access_token");
  const expiryStr = sessionStorage.getItem("google_token_expiry");

  if (token && expiryStr) {
    const expiry = parseInt(expiryStr);
    if (Date.now() < expiry) {
      googleAccessToken = token;
      return googleAccessToken;
    }
  }

  // Token is missing or expired, clean up
  disconnectGoogleCalendar();
  return null;
}

/**
 * Trigger the Google OAuth consent flow popup.
 */
export function requestGoogleAuth(onSuccess, onError) {
  try {
    if (!tokenClient) {
      initGoogleTokenClient(onSuccess, onError);
    }
    
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    }
  } catch (err) {
    console.error("Failed to request Google authorization:", err);
    if (onError) onError(err);
  }
}

/**
 * Disconnect Google Calendar (clear session token).
 */
export function disconnectGoogleCalendar() {
  googleAccessToken = null;
  sessionStorage.removeItem("google_access_token");
  sessionStorage.removeItem("google_token_expiry");
}

/**
 * Create a real event on Google Calendar using Calendar API v3.
 * Request code is configured to include a Google Meet link.
 */
export async function scheduleRealGoogleMeetEvent(topic, date, time) {
  const token = getCachedToken();
  if (!token) {
    throw new Error("Google Calendar is not authorized. Please connect first.");
  }

  // Combine date and time
  const startDateTime = new Date(`${date}T${time}:00`);
  if (isNaN(startDateTime.getTime())) {
    throw new Error("Invalid meeting date or time.");
  }

  // Standard meeting is 1 hour
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const eventBody = {
    summary: topic,
    description: "Culinary lesson scheduled via CookConnect",
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: timeZone,
    },
    conferenceData: {
      createRequest: {
        requestId: `cookconnect-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  // Google Calendar API insert endpoint with conferenceDataVersion=1 parameter
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    if (response.status === 401) {
      disconnectGoogleCalendar();
    }
    throw new Error(errBody.error?.message || `Google API HTTP ${response.status}`);
  }

  const eventData = await response.json();
  
  // Try to find the Meet URI in conference data
  let meetLink = "";
  if (eventData.conferenceData && eventData.conferenceData.entryPoints) {
    const videoEntry = eventData.conferenceData.entryPoints.find(
      (ep) => ep.entryPointType === "video"
    );
    if (videoEntry) {
      meetLink = videoEntry.uri;
    }
  }

  // Fallback to calendar HTML link if meet link wasn't returned
  if (!meetLink) {
    meetLink = eventData.htmlLink || `https://meet.google.com/mock-fallback`;
  }

  return {
    meetLink,
    eventId: eventData.id,
    htmlLink: eventData.htmlLink,
  };
}

/**
 * Schedule a meeting and save it to Firestore.
 * Supports both real Google Calendar API scheduling and developer-mode mock fallback.
 */
export async function scheduleGoogleMeet(currentUser, activeChef, topic, date, time) {
  let meetLink = "";
  let eventId = "mock-id";
  let isRealEvent = false;

  // Try real calendar creation if real scheduling is enabled and authorized
  if (googleConfig.useRealGoogleMeet && getCachedToken()) {
    try {
      const realEvent = await scheduleRealGoogleMeetEvent(topic, date, time);
      meetLink = realEvent.meetLink;
      eventId = realEvent.eventId;
      isRealEvent = true;
    } catch (err) {
      console.warn("Real scheduling failed, falling back to mock link:", err);
      throw err; // bubble up API error to UI
    }
  } else {
    // If not authorized or mock mode is enabled, generate a mock link
    meetLink = generateMeetLink();
  }
  
  const meetingData = {
    chefId: activeChef.userId || activeChef.id,
    chefName: activeChef.name,
    userId: currentUser.uid,
    userName: currentUser.name,
    topic,
    date,
    time,
    meetLink,
    eventId,
    isRealEvent,
    createdAt: new Date().toISOString()
  };

  await createMeeting(meetingData);
  return meetingData;
}
