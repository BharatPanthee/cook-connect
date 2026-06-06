// Chat Service Module with Firestore Sync

import { 
  scheduleGoogleMeet, 
  getCachedToken, 
  requestGoogleAuth, 
  disconnectGoogleCalendar 
} from "./meet-service.js";
import { googleConfig } from "./google-config.js";
import { 
  getOrCreateChatRoom, 
  subscribeToMessages, 
  sendMessage, 
  subscribeToUserChats 
} from "./db-service.js";

let activeChatId = null;
let activePartner = null;
let currentUser = null;

let unsubscribeMessages = null;
let unsubscribeChats = null;

let chatModal = null;
let chatMessagesContainer = null;
let chatInput = null;

let scheduleMeetModal = null;
let scheduleMeetForm = null;
let meetTopicInput = null;
let meetDateInput = null;
let meetTimeInput = null;

let googleAuthCard = null;
let googleAuthBtn = null;
let googleStatusText = null;
let googleStatusSubtext = null;
let scheduleMeetSubmitBtn = null;

let tempBooking = null; // Store pending booking details during payment authorization

/**
 * Sync the current logged-in user profile.
 */
export function setCurrentUser(user) {
  currentUser = user;
}

/**
 * Update Google Calendar authorization UI state inside the scheduling modal.
 */
export function updateGoogleAuthUI() {
  if (!googleAuthCard || !googleAuthBtn || !googleStatusText || !googleStatusSubtext || !scheduleMeetSubmitBtn) {
    return;
  }
  
  if (!googleConfig.useRealGoogleMeet) {
    // Mock Mode UI
    googleAuthCard.classList.remove("google-connected");
    googleAuthCard.classList.add("google-unconnected");
    
    googleStatusText.textContent = "Google Calendar (Mock Mode)";
    googleStatusText.className = "google-status-unconnected";
    googleStatusSubtext.textContent = "Mock scheduling enabled. Toggle useRealGoogleMeet in google-config.js to connect.";
    
    googleAuthBtn.textContent = "Connect";
    googleAuthBtn.className = "btn btn-secondary btn-sm google-auth-btn-action";
    googleAuthBtn.setAttribute("disabled", "true"); // Connect is disabled in mock mode
    
    scheduleMeetSubmitBtn.removeAttribute("disabled");
    scheduleMeetSubmitBtn.textContent = "Schedule Meet";
    return;
  }
  
  const token = getCachedToken();
  
  if (token) {
    // Authorized state
    googleAuthCard.classList.remove("google-unconnected");
    googleAuthCard.classList.add("google-connected");
    
    googleStatusText.textContent = "Google Calendar Connected";
    googleStatusText.className = "google-status-connected";
    googleStatusSubtext.textContent = "Ready to schedule a real Google Meet";
    
    googleAuthBtn.textContent = "Disconnect";
    googleAuthBtn.className = "btn btn-secondary btn-sm google-auth-btn-action connected";
    googleAuthBtn.removeAttribute("disabled");
    
    scheduleMeetSubmitBtn.removeAttribute("disabled");
    scheduleMeetSubmitBtn.textContent = "Schedule Real Meet";
  } else {
    // Unauthorized state
    googleAuthCard.classList.remove("google-connected");
    googleAuthCard.classList.add("google-unconnected");
    
    googleStatusText.textContent = "Google Calendar not connected";
    googleStatusText.className = "google-status-unconnected";
    googleStatusSubtext.textContent = "Required to schedule a real Google Meet event";
    
    googleAuthBtn.textContent = "Connect";
    googleAuthBtn.className = "btn btn-secondary btn-sm google-auth-btn-action";
    googleAuthBtn.removeAttribute("disabled");
    
    scheduleMeetSubmitBtn.setAttribute("disabled", "true");
    scheduleMeetSubmitBtn.textContent = "Schedule Real Meet";
  }
}

/**
 * Initialize DOM references and setup event handlers.
 */
export function initChat(elements) {
  chatModal = elements.chatModal;
  chatMessagesContainer = elements.chatMessagesContainer;
  chatInput = elements.chatInput;
  
  // Register Google Meet elements
  scheduleMeetModal = elements.scheduleMeetModal;
  scheduleMeetForm = elements.scheduleMeetForm;
  meetTopicInput = elements.meetTopicInput;
  meetDateInput = elements.meetDateInput;
  meetTimeInput = elements.meetTimeInput;

  // Resolve Google OAuth elements
  googleAuthCard = document.getElementById("google-auth-card");
  googleAuthBtn = document.getElementById("google-auth-btn");
  googleStatusText = document.getElementById("google-status-text");
  googleStatusSubtext = document.getElementById("google-status-subtext");
  scheduleMeetSubmitBtn = document.getElementById("schedule-meet-submit-btn");

  // Setup Google OAuth click event
  if (googleAuthBtn) {
    googleAuthBtn.addEventListener("click", () => {
      const token = getCachedToken();
      if (token) {
        disconnectGoogleCalendar();
        updateGoogleAuthUI();
      } else {
        googleAuthBtn.disabled = true;
        const originalText = googleAuthBtn.textContent;
        googleAuthBtn.textContent = "Connecting...";

        requestGoogleAuth(
          (accessToken) => {
            googleAuthBtn.disabled = false;
            updateGoogleAuthUI();
          },
          (err) => {
            googleAuthBtn.disabled = false;
            googleAuthBtn.textContent = originalText;
            updateGoogleAuthUI();
            alert(`Google Calendar Authorization failed: ${err.message || "Access denied."}`);
          }
        );
      }
    });
  }

  // Setup schedule click events
  if (elements.chatScheduleMeetBtn) {
    elements.chatScheduleMeetBtn.addEventListener("click", () => {
      if (!currentUser) {
        alert("Please sign in to schedule a meeting!");
        return;
      }
      
      if (meetTopicInput && activePartner) {
        meetTopicInput.value = `Cooking Lesson with ${activePartner.name}`;
      }
      
      if (meetDateInput) {
        const today = new Date().toISOString().split("T")[0];
        meetDateInput.value = today;
        meetDateInput.min = today;
      }

      updateGoogleAuthUI();
      scheduleMeetModal.showModal();
    });
  }

  if (elements.closeScheduleMeetBtn) {
    elements.closeScheduleMeetBtn.addEventListener("click", () => {
      scheduleMeetModal.close();
    });
  }

  // Setup scheduling form submission
  if (scheduleMeetForm) {
    scheduleMeetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleScheduleMeet();
    });
  }

  // Setup suggestions chips click event
  document.querySelectorAll(".suggestion-chip").forEach(chip => {
    chip.addEventListener("click", async () => {
      const text = chip.textContent.trim();
      if (text && activeChatId && currentUser) {
        try {
          await sendMessage(activeChatId, currentUser.uid, currentUser.name || "Client", text);
        } catch (err) {
          console.error("Failed to send suggestion:", err);
        }
      }
    });
  });

  // Setup Mock Stripe Payment Form listeners
  const paymentForm = document.getElementById("payment-form");
  const paymentModal = document.getElementById("payment-modal");
  
  if (paymentForm) {
    paymentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById("payment-submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing payment...";
      
      // Simulate payment network processing delay (800ms)
      setTimeout(async () => {
        paymentModal.close();
        submitBtn.disabled = false;
        submitBtn.textContent = "Authorize & Book Session";
        paymentForm.reset();
        
        // Execute pending booking with secure deposit verified
        if (tempBooking) {
          await proceedWithScheduling(
            tempBooking.topic,
            tempBooking.date,
            tempBooking.time,
            true,
            tempBooking.amount
          );
          tempBooking = null;
        }
      }, 950);
    });
  }

  const closePaymentBtn = document.getElementById("close-payment-modal");
  if (closePaymentBtn) {
    closePaymentBtn.addEventListener("click", () => {
      paymentModal.close();
      tempBooking = null;
    });
  }
}

/**
 * Handle schedule meet submission.
 */
async function handleScheduleMeet() {
  const topic = meetTopicInput.value.trim();
  const date = meetDateInput.value;
  const time = meetTimeInput.value;

  if (!topic || !date || !time || !currentUser || !activePartner) return;
  
  scheduleMeetModal.close();

  // Determine if this is a paid class or helper session
  const rate = activePartner.rate || 0;
  const isPaid = rate > 0;
  
  if (isPaid) {
    // Open payment window (assuming 2 hours standard duration)
    const amount = rate * 2;
    tempBooking = { topic, date, time, amount };
    
    document.getElementById("payment-amount-display").textContent = `$${amount.toFixed(2)}`;
    document.getElementById("payment-modal").showModal();
  } else {
    // Free skill-swap session
    await proceedWithScheduling(topic, date, time);
  }
}

/**
 * Create calendar meeting, format invite card, and publish to chat room.
 */
async function proceedWithScheduling(topic, date, time, hasDepositedEscrow = false, amount = 0) {
  const loader = document.createElement("div");
  loader.className = "msg-bubble system";
  loader.textContent = "Scheduling meeting on Google Calendar...";
  chatMessagesContainer.appendChild(loader);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

  try {
    const meeting = await scheduleGoogleMeet(currentUser, activePartner, topic, date, time);
    loader.remove();
    
    // Store meeting invite details inside Firestore messages collection
    const meetingMessageText = `MEET_SCHEDULED|${meeting.topic}|${meeting.date}|${meeting.time}|${meeting.meetLink}|${hasDepositedEscrow ? amount : 0}`;
    await sendMessage(activeChatId, currentUser.uid, currentUser.name || "Client", meetingMessageText);
    
    scheduleMeetForm.reset();
  } catch (err) {
    if (loader) loader.remove();
    console.error("Failed to schedule meeting:", err);
    alert(`Failed to schedule meeting: ${err.message}`);
  }
}

/**
 * Sync active chat room and load/subscribe to message thread.
 */
export function selectChatRoom(chatId, partner) {
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
  
  activeChatId = chatId;
  activePartner = partner;
  
  // Hide placeholder screen, display chat workspace panels
  document.getElementById("chat-status-wrapper").style.display = "flex";
  document.getElementById("chat-schedule-meet-btn").style.display = "inline-flex";
  document.getElementById("chat-suggestions").style.display = "flex";
  document.getElementById("chat-form").style.display = "flex";
  
  // Set partner headings
  document.getElementById("chat-modal-title").textContent = partner.name;
  document.getElementById("chat-avatar").textContent = partner.avatar;
  
  // Render loading state
  chatMessagesContainer.innerHTML = `<div class="chat-placeholder-text">Loading messages...</div>`;
  
  // Subscribe to real-time message stream
  unsubscribeMessages = subscribeToMessages(chatId, (messages) => {
    renderChatMessages(messages);
  });
  
  // Highlight active sidebar room
  document.querySelectorAll(".conversation-item").forEach(item => {
    if (item.getAttribute("data-id") === chatId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

/**
 * Render message bubbles inside the panel container.
 */
function renderChatMessages(messages) {
  chatMessagesContainer.innerHTML = "";
  
  if (messages.length === 0) {
    chatMessagesContainer.innerHTML = `<div class="chat-placeholder-text">No messages yet. Send a message to start cooking!</div>`;
    return;
  }
  
  messages.forEach(msg => {
    const direction = msg.senderId === currentUser.uid ? "outgoing" : "incoming";
    
    if (msg.text.startsWith("MEET_SCHEDULED|")) {
      const parts = msg.text.split("|");
      const topic = parts[1];
      const date = parts[2];
      const time = parts[3];
      const meetLink = parts[4];
      const amount = parseFloat(parts[5] || "0");
      
      const card = document.createElement("div");
      card.className = `msg-bubble meet-invite-card ${amount > 0 ? "confirmed" : ""}`;
      
      let escrowHTML = amount > 0 
        ? `<span class="escrow-badge">🔒 Escrow Held ($${amount.toFixed(2)})</span>` 
        : "";
        
      card.innerHTML = `
        <div class="meet-invite-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle;">
            <path d="M23 7l-7 5 7 5V7z"></path>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
          Google Meet Scheduled
        </div>
        <div class="meet-invite-body">
          <strong>Topic:</strong> ${topic}<br>
          <strong>Date:</strong> ${formatDate(date)}<br>
          <strong>Time:</strong> ${formatTime(time)}
          ${escrowHTML}
        </div>
        <div class="meet-invite-footer">
          <a href="${meetLink}" target="_blank" class="meet-join-btn">
            Join Google Meet
          </a>
        </div>
      `;
      chatMessagesContainer.appendChild(card);
    } else {
      const bubble = document.createElement("div");
      bubble.className = `msg-bubble ${direction}`;
      bubble.textContent = msg.text;
      chatMessagesContainer.appendChild(bubble);
    }
  });
  
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

/**
 * Render conversation side list from user active chats.
 */
function renderConversationsList(rooms) {
  const container = document.getElementById("active-conversations-list");
  if (!container) return;
  
  if (rooms.length === 0) {
    container.innerHTML = `<div class="empty-conversations-text">No active conversations. Contact a helper to begin messaging!</div>`;
    return;
  }
  
  container.innerHTML = "";
  rooms.forEach(room => {
    const partnerId = room.participants.find(p => p !== currentUser.uid);
    const partnerName = room.participantNames[partnerId] || "Participant";
    
    // Choose appropriate avatar
    let avatarSymbol = "👤";
    if (partnerId.startsWith("chef-") || partnerId === "chef-1" || partnerId === "chef-2" || partnerId === "chef-3" || partnerId === "chef-4" || partnerId === "chef-5") {
      avatarSymbol = "👩‍🍳";
    }
    
    const item = document.createElement("button");
    item.className = `conversation-item ${room.id === activeChatId ? "active" : ""}`;
    item.setAttribute("data-id", room.id);
    
    // Slice long preview
    let preview = room.lastMessage || "New conversation";
    if (preview.startsWith("MEET_SCHEDULED|")) {
      preview = "📅 Google Meet Scheduled";
    }
    if (preview.length > 25) preview = preview.substring(0, 22) + "...";
    
    item.innerHTML = `
      <div class="conversation-item-avatar">${avatarSymbol}</div>
      <div class="conversation-item-info">
        <div class="conversation-item-name">${partnerName}</div>
        <div class="conversation-item-preview">${preview}</div>
      </div>
    `;
    
    item.addEventListener("click", () => {
      // Find approximate rate details
      let rate = 0;
      let costType = "free";
      if (partnerId.includes("chef-1") || partnerId === "chef-1") { rate = 30; costType = "paid"; }
      else if (partnerId.includes("chef-2") || partnerId === "chef-2") { rate = 0; costType = "free"; }
      else if (partnerId.includes("chef-3") || partnerId === "chef-3") { rate = 65; costType = "paid"; }
      else if (partnerId.includes("chef-4") || partnerId === "chef-4") { rate = 22; costType = "paid"; }
      else if (partnerId.includes("chef-5") || partnerId === "chef-5") { rate = 0; costType = "free"; }
      
      selectChatRoom(room.id, {
        uid: partnerId,
        name: partnerName,
        avatar: avatarSymbol,
        rate,
        costType
      });
    });
    
    container.appendChild(item);
  });
}

/**
 * Handle Auth changes, starting or stopping active listeners.
 */
export function handleAuthChange(user) {
  currentUser = user;
  
  if (unsubscribeChats) {
    unsubscribeChats();
    unsubscribeChats = null;
  }
  
  if (user) {
    // Subscribe to rooms list
    unsubscribeChats = subscribeToUserChats(user.uid, (rooms) => {
      renderConversationsList(rooms);
    });
  } else {
    renderConversationsList([]);
    closeActiveChatSession();
  }
}

/**
 * Reset active panels when signed out.
 */
function closeActiveChatSession() {
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
  activeChatId = null;
  activePartner = null;
  
  document.getElementById("chat-status-wrapper").style.display = "none";
  document.getElementById("chat-schedule-meet-btn").style.display = "none";
  document.getElementById("chat-suggestions").style.display = "none";
  document.getElementById("chat-form").style.display = "none";
  
  document.getElementById("chat-modal-title").textContent = "Select a Conversation";
  document.getElementById("chat-avatar").textContent = "💬";
  chatMessagesContainer.innerHTML = `<div class="chat-placeholder-text">Select a participant from the sidebar list or contact a cook to begin messaging!</div>`;
}

/**
 * Open chat simulator with a specific Chef.
 */
export async function startChefChat(chef) {
  if (!currentUser) {
    alert("Please sign in to message cooks!");
    document.getElementById("auth-modal").showModal();
    return;
  }
  
  const partnerId = chef.userId || chef.id;
  const partnerName = chef.name;
  
  chatModal.showModal();
  
  try {
    const chatId = await getOrCreateChatRoom(
      currentUser.uid,
      partnerId,
      currentUser.name || "Client",
      partnerName
    );
    
    selectChatRoom(chatId, {
      uid: partnerId,
      name: partnerName,
      avatar: chef.avatar || "👩‍🍳",
      rate: chef.rate || 0,
      costType: chef.costType || "free"
    });
  } catch (err) {
    console.error("Failed to start chef chat:", err);
  }
}

/**
 * Open chat simulator with a request poster.
 */
export async function startRequestChat(req) {
  if (!currentUser) {
    alert("Please sign in to offer cooking help!");
    document.getElementById("auth-modal").showModal();
    return;
  }
  
  const partnerId = req.userId || "client-user-id"; // fallback
  const partnerName = req.name;
  
  chatModal.showModal();
  
  try {
    const chatId = await getOrCreateChatRoom(
      currentUser.uid,
      partnerId,
      currentUser.name || "Cook",
      partnerName
    );
    
    selectChatRoom(chatId, {
      uid: partnerId,
      name: partnerName,
      avatar: "👤",
      rate: 0,
      costType: req.budgetType || "free"
    });
    
    // Automatically post greeting offer message
    const initialGreetingText = `Hi ${req.name}! I saw your request for "${req.title}" and would love to help you with it.`;
    await sendMessage(chatId, currentUser.uid, currentUser.name || "Cook", initialGreetingText);
  } catch (err) {
    console.error("Failed to start request chat:", err);
  }
}

/**
 * Send a message.
 */
export async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || !activeChatId || !currentUser) return;
  
  chatInput.value = "";
  
  try {
    await sendMessage(activeChatId, currentUser.uid, currentUser.name || "User", text);
  } catch (err) {
    console.error("Failed to send message:", err);
  }
}

/**
 * Format 24h time to 12h AM/PM.
 */
function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(":");
  const hrs = parseInt(hours);
  const ampm = hrs >= 12 ? "PM" : "AM";
  const formattedHrs = hrs % 12 || 12;
  return `${formattedHrs}:${minutes} ${ampm}`;
}

/**
 * Format ISO date to human readable date.
 */
function formatDate(dateStr) {
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', options);
}
