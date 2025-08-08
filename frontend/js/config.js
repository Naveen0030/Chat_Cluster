// Global configuration
window.API_BASE = "https://chat-cluster.onrender.com";
const API_BASE = window.API_BASE;
const apiUrl = `${API_BASE}/api`;

// Initialize Socket.IO
const socket = io(API_BASE, {
  transports: ['websocket'],
  withCredentials: true
});

// Global state variables
let currentUser = null;
let currentChatUser = null;
let friends = [];
let messages = [];
let typingTimer;
let isTyping = false;
