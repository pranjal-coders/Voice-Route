// DOM Elements
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");
const voiceBtn = document.getElementById("voiceBtn");
const navLinks = document.querySelectorAll(".nav-link");

// Authentication Modal Elements
const authModal = document.getElementById("authModal");
const authModalOverlay = document.getElementById("authModalOverlay");
const authCloseBtn = document.getElementById("authCloseBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginFormElement = document.getElementById("loginFormElement");
const registerFormElement = document.getElementById("registerFormElement");
const successModal = document.getElementById("successModal");
const loadingSpinner = document.getElementById("loadingSpinner");
const userProfileCard = document.getElementById("userProfileCard");

// API Base URL - Update this to match your backend server
const API_BASE_URL = "http://localhost:5000/api";

// Global variables
let currentUser = null;
let authToken = localStorage.getItem("authToken");

// Initialize app when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("VoiceRoute application initialized! 🚀");

  // Check if user is already logged in
  if (authToken) {
    validateToken();
  }

  // Initialize authentication event listeners
  initAuthEventListeners();

  // Add loading animation to initial elements
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

// ==================== AUTHENTICATION MODAL FUNCTIONS ====================

// Initialize authentication event listeners
function initAuthEventListeners() {
  // Open login modal
  if (loginBtn) {
    loginBtn.addEventListener("click", () => openAuthModal("login"));
  }

  // Open register modal
  if (registerBtn) {
    registerBtn.addEventListener("click", () => openAuthModal("register"));
  }

  // Close modal events
  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", closeAuthModal);
  }

  if (authModalOverlay) {
    authModalOverlay.addEventListener("click", closeAuthModal);
  }

  // Form submissions
  if (loginFormElement) {
    loginFormElement.addEventListener("submit", handleLogin);
  }

  if (registerFormElement) {
    registerFormElement.addEventListener("submit", handleRegistration);
  }

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal.classList.contains("active")) {
      closeAuthModal();
    }
  });
}

// Open authentication modal
function openAuthModal(mode = "login") {
  if (!authModal) {
    console.error("Auth modal not found");
    return;
  }

  authModal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scrolling

  // Switch to appropriate form
  switchAuthMode(mode);

  // Focus first input after animation
  setTimeout(() => {
    const firstInput = authModal.querySelector("input");
    if (firstInput) firstInput.focus();
  }, 300);
}

// Close authentication modal
function closeAuthModal() {
  if (!authModal) return;

  authModal.classList.remove("active");
  document.body.style.overflow = ""; // Restore scrolling

  // Clear form errors
  clearFormErrors();
}

// Switch between login and register forms
function switchAuthMode(mode) {
  if (mode === "login") {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }

  // Clear any existing errors
  clearFormErrors();
}

// ==================== FORM VALIDATION ====================

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
  return password.length >= 6;
}

// Show field error
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add("error");

  // Remove existing error message
  const existingError = field.parentNode.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // Add new error message
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  field.parentNode.appendChild(errorDiv);
}

// Clear form errors
function clearFormErrors() {
  const errorFields = document.querySelectorAll(".form-group input.error");
  const errorMessages = document.querySelectorAll(".error-message");

  errorFields.forEach((field) => field.classList.remove("error"));
  errorMessages.forEach((message) => message.remove());
}

// Toggle password visibility
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const toggle = field.parentNode.querySelector(".password-toggle i");

  if (field.type === "password") {
    field.type = "text";
    toggle.className = "fas fa-eye-slash";
  } else {
    field.type = "password";
    toggle.className = "fas fa-eye";
  }
}

// ==================== AUTHENTICATION HANDLERS ====================

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const loginData = {
    email: formData.get("email").trim(),
    password: formData.get("password"),
  };

  // Validate inputs
  let hasErrors = false;

  if (!loginData.email) {
    showFieldError("loginEmail", "Email is required");
    hasErrors = true;
  } else if (!validateEmail(loginData.email)) {
    showFieldError("loginEmail", "Please enter a valid email address");
    hasErrors = true;
  }

  if (!loginData.password) {
    showFieldError("loginPassword", "Password is required");
    hasErrors = true;
  }

  if (hasErrors) return;

  // Show loading
  showLoading();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();
    hideLoading();

    if (response.ok) {
      // Login successful
      authToken = result.token;
      currentUser = result.user;
      localStorage.setItem("authToken", authToken);

      closeAuthModal();
      showUserProfile();
      showSuccessMessage(
        "Welcome back!",
        `Hello ${
          currentUser.full_name || currentUser.username
        }, you're now logged in.`
      );
    } else {
      // Login failed
      showFieldError("loginPassword", result.error || "Invalid credentials");
    }
  } catch (error) {
    hideLoading();
    console.error("Login error:", error);
    showFieldError(
      "loginPassword",
      "Unable to connect to server. Please try again."
    );
  }
}

// Handle registration form submission
async function handleRegistration(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const registerData = {
    full_name: formData.get("full_name").trim(),
    username: formData.get("username").trim(),
    email: formData.get("email").trim(),
    password: formData.get("password"),
    phone: formData.get("phone").trim(),
    preferences: {
      preferred_transport: formData.get("preferred_transport"),
      max_budget: parseInt(formData.get("max_budget")),
      preferred_time: formData.get("preferred_time"),
      language: formData.get("language"),
    },
  };

  // Validate inputs
  let hasErrors = false;

  if (!registerData.full_name) {
    showFieldError("registerFullName", "Full name is required");
    hasErrors = true;
  }

  if (!registerData.username) {
    showFieldError("registerUsername", "Username is required");
    hasErrors = true;
  } else if (registerData.username.length < 3) {
    showFieldError(
      "registerUsername",
      "Username must be at least 3 characters"
    );
    hasErrors = true;
  }

  if (!registerData.email) {
    showFieldError("registerEmail", "Email is required");
    hasErrors = true;
  } else if (!validateEmail(registerData.email)) {
    showFieldError("registerEmail", "Please enter a valid email address");
    hasErrors = true;
  }

  if (!registerData.password) {
    showFieldError("registerPassword", "Password is required");
    hasErrors = true;
  } else if (!validatePassword(registerData.password)) {
    showFieldError(
      "registerPassword",
      "Password must be at least 6 characters"
    );
    hasErrors = true;
  }

  const confirmPassword = formData.get("confirm_password");
  if (registerData.password !== confirmPassword) {
    showFieldError("registerConfirmPassword", "Passwords do not match");
    hasErrors = true;
  }

  if (!formData.get("agree_terms")) {
    const checkbox = document.getElementById("agreeTerms");
    if (checkbox) {
      checkbox.parentNode.style.color = "#ff6b6b";
      setTimeout(() => {
        checkbox.parentNode.style.color = "";
      }, 3000);
    }
    hasErrors = true;
  }

  if (hasErrors) return;

  // Show loading
  showLoading();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });

    const result = await response.json();
    hideLoading();

    if (response.ok) {
      // Registration successful
      authToken = result.token;
      currentUser = result.user;
      localStorage.setItem("authToken", authToken);

      closeAuthModal();
      showUserProfile();
      showSuccessMessage(
        "Welcome to VoiceRoute!",
        `Account created successfully! Hello ${currentUser.full_name}, you can now access personalized travel recommendations.`
      );
    } else {
      // Registration failed
      if (result.error.includes("email")) {
        showFieldError("registerEmail", result.error);
      } else if (result.error.includes("username")) {
        showFieldError("registerUsername", result.error);
      } else {
        showFieldError(
          "registerPassword",
          result.error || "Registration failed"
        );
      }
    }
  } catch (error) {
    hideLoading();
    console.error("Registration error:", error);
    showFieldError(
      "registerPassword",
      "Unable to connect to server. Please try again."
    );
  }
}

// ==================== USER INTERFACE UPDATES ====================

// Show user profile after login
function showUserProfile() {
  if (!currentUser || !userProfileCard) return;

  // Update profile information
  const fullNameEl = document.getElementById("userFullName");
  const emailEl = document.getElementById("userEmail");

  if (fullNameEl)
    fullNameEl.textContent = currentUser.full_name || currentUser.username;
  if (emailEl) emailEl.textContent = currentUser.email;

  // Show profile card
  userProfileCard.style.display = "flex";

  // Hide auth buttons, show logout
  if (loginBtn) loginBtn.style.display = "none";
  if (registerBtn) {
    registerBtn.textContent = "Profile";
    registerBtn.onclick = () => showUserProfile();
  }

  // Load user stats
  loadUserStats();
}

// Load user statistics
async function loadUserStats() {
  if (!authToken) return;

  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      // Update stats in profile card
      const searchCountEl = document.getElementById("userSearchCount");
      const favoritesCountEl = document.getElementById("userFavoritesCount");

      if (searchCountEl) searchCountEl.textContent = userData.search_count || 0;
      if (favoritesCountEl)
        favoritesCountEl.textContent = userData.favorites_count || 0;
    }
  } catch (error) {
    console.error("Failed to load user stats:", error);
  }
}

// Logout function
function logout() {
  // Clear stored data
  localStorage.removeItem("authToken");
  authToken = null;
  currentUser = null;

  // Hide profile card
  if (userProfileCard) userProfileCard.style.display = "none";

  // Show auth buttons
  if (loginBtn) loginBtn.style.display = "inline-block";
  if (registerBtn) {
    registerBtn.textContent = "Get Started";
    registerBtn.onclick = () => openAuthModal("register");
  }

  showSuccessMessage(
    "Logged Out",
    "You have been successfully logged out. Thank you for using VoiceRoute!"
  );
}

// Validate stored token
async function validateToken() {
  if (!authToken) return;

  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      currentUser = userData.data;
      showUserProfile();
    } else {
      // Token is invalid
      localStorage.removeItem("authToken");
      authToken = null;
    }
  } catch (error) {
    console.error("Token validation error:", error);
    localStorage.removeItem("authToken");
    authToken = null;
  }
}

// ==================== UI HELPER FUNCTIONS ====================

// Show loading spinner
function showLoading() {
  if (loadingSpinner) {
    loadingSpinner.style.display = "flex";
  }
}

// Hide loading spinner
function hideLoading() {
  if (loadingSpinner) {
    loadingSpinner.style.display = "none";
  }
}

// Show success message modal
function showSuccessMessage(title, message) {
  const successModal = document.getElementById("successModal");
  const successTitle = document.getElementById("successTitle");
  const successMessage = document.getElementById("successMessage");

  if (successModal && successTitle && successMessage) {
    successTitle.textContent = title;
    successMessage.textContent = message;
    successModal.style.display = "flex";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      closeSuccessModal();
    }, 5000);
  }
}

// Close success modal
function closeSuccessModal() {
  const successModal = document.getElementById("successModal");
  if (successModal) {
    successModal.style.display = "none";
  }
}

// Scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const offsetTop = section.offsetTop - 100;
    window.scrollTo({
      top: offsetTop,
      behavior: "smooth",
    });
  }
}

// ==================== ORIGINAL VOICE FUNCTIONALITY ====================

// Mobile Navigation Toggle
if (hamburger) {
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    hamburger.classList.toggle("active");
  });
}

// Close mobile menu when clicking on a link
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active");
    hamburger.classList.remove("active");
  });
});

// Active Navigation Link on Scroll
window.addEventListener("scroll", () => {
  let current = "";
  const sections = document.querySelectorAll("section");

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;

    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href").substring(1) === current) {
      link.classList.add("active");
    }
  });
});

// Voice Button Functionality
let isListening = false;
let recognition;

// Check if browser supports speech recognition
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
} else if ("SpeechRecognition" in window) {
  recognition = new SpeechRecognition();
}

if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add("listening");
    updateVoiceStatus("Listening... Speak now");
    animateVoiceBars(true);
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    if (event.results[event.results.length - 1].isFinal) {
      handleVoiceCommand(transcript);
    } else {
      updateVoiceStatus(`Hearing: "${transcript}"`);
    }
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn.classList.remove("listening");
    updateVoiceStatus("Ready to listen...");
    animateVoiceBars(false);
  };

  recognition.onerror = (event) => {
    console.log("Speech recognition error:", event.error);
    isListening = false;
    voiceBtn.classList.remove("listening");
    updateVoiceStatus("Error occurred. Try again.");
    animateVoiceBars(false);
  };
}

if (voiceBtn) {
  voiceBtn.addEventListener("click", () => {
    if (!recognition) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome or Firefox."
      );
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });
}

// Handle Voice Commands with API integration
async function handleVoiceCommand(command) {
  console.log("Voice command received:", command);
  updateVoiceStatus("Processing your request...");

  try {
    const response = await fetch(`${API_BASE_URL}/voice/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify({
        voice_command: command,
        confidence_score: 0.9,
        language: "en-US",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const responseMessage = result.response.message;

      updateVoiceStatus(responseMessage);

      // Text-to-speech response
      if ("speechSynthesis" in window && result.response.speak) {
        const utterance = new SpeechSynthesisUtterance(responseMessage);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }

      // If route data is available, could display it
      if (result.response.data) {
        console.log("Route data received:", result.response.data);
        // TODO: Display route results in UI
      }
    } else {
      throw new Error("Voice processing failed");
    }
  } catch (error) {
    console.error("Voice command error:", error);

    // Fallback to demo responses
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes("train") || lowerCommand.includes("railway")) {
      showVoiceResponse(
        `I found several train options. For example, if you're looking for trains from Delhi to Mumbai, the Rajdhani Express departs at 4:55 PM and arrives at 8:35 AM next day. Would you like me to check availability?`
      );
    } else if (lowerCommand.includes("bus")) {
      showVoiceResponse(
        `I found multiple bus routes. State transport and private buses are available. AC Volvo buses depart every 2 hours. Shall I show you the schedule?`
      );
    } else if (lowerCommand.includes("hello") || lowerCommand.includes("hi")) {
      showVoiceResponse(
        `Hello! I'm VoiceRoute assistant. Ask me about train or bus routes, and I'll help you plan your journey.`
      );
    } else if (lowerCommand.includes("help")) {
      showVoiceResponse(
        `You can ask me things like: "Find trains from Delhi to Mumbai", "Show bus routes to Pune", or "What's the fastest way to Bangalore?"`
      );
    } else {
      showVoiceResponse(
        `I heard "${command}". This is a demo - in the full version, I'll search our database for real-time transportation information based on your query.`
      );
    }
  }

  // Reset after a few seconds
  setTimeout(() => {
    updateVoiceStatus("Ready to listen...");
  }, 8000);
}

// Show Voice Response
function showVoiceResponse(response) {
  updateVoiceStatus(response);

  // Text-to-speech response (if supported)
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(response);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }
}

// Update Voice Status
function updateVoiceStatus(message) {
  const statusElement = document.querySelector(".listening-status span");
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// Animate Voice Bars
function animateVoiceBars(animate) {
  const bars = document.querySelectorAll(".bar");
  if (animate) {
    bars.forEach((bar, index) => {
      bar.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
      bar.style.animationDelay = `${index * 0.1}s`;
    });
  }
}

// Smooth Scroll for Navigation Links
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.getAttribute("href").substring(1);
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      const offsetTop = targetSection.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  });
});

// Intersection Observer for Animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("loading");
    }
  });
}, observerOptions);

// Observe elements for animation
document.addEventListener("DOMContentLoaded", () => {
  const elementsToObserve = document.querySelectorAll(
    ".about-card, .service-card, .feature-item, .cta-content"
  );
  elementsToObserve.forEach((el) => observer.observe(el));
});

// Parallax Effect for Background
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const parallax = scrolled * 0.5;

  const bgOverlay = document.querySelector(".bg-overlay");
  if (bgOverlay) {
    bgOverlay.style.transform = `translateY(${parallax}px)`;
  }
});

// Particle Mouse Interaction
document.addEventListener("mousemove", (e) => {
  const particles = document.querySelectorAll(".particle");
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  particles.forEach((particle, index) => {
    const rect = particle.getBoundingClientRect();
    const particleX = rect.left + rect.width / 2;
    const particleY = rect.top + rect.height / 2;

    const distance = Math.sqrt(
      Math.pow(mouseX - particleX, 2) + Math.pow(mouseY - particleY, 2)
    );

    if (distance < 150) {
      const angle = Math.atan2(mouseY - particleY, mouseX - particleX);
      const force = (150 - distance) / 150;
      const moveX = Math.cos(angle) * force * 20;
      const moveY = Math.sin(angle) * force * 20;

      particle.style.transform = `translate(${-moveX}px, ${-moveY}px)`;
    } else {
      particle.style.transform = "translate(0px, 0px)";
    }
  });
});

// Button Click Effects
document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - button.offsetLeft - radius}px`;
    ripple.style.top = `${e.clientY - button.offsetTop - radius}px`;
    ripple.classList.add("ripple");

    const rippleElement = button.getElementsByClassName("ripple")[0];
    if (rippleElement) {
      rippleElement.remove();
    }

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// Performance Optimization - Throttle scroll events
function throttle(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Console Welcome Message
console.log(
  "%c🎤 Welcome to VoiceRoute!",
  "color: #667eea; font-size: 20px; font-weight: bold;"
);
console.log(
  "%cBuilt with modern web technologies and glassmorphism UI",
  "color: #764ba2; font-size: 14px;"
);
console.log(
  "%cTry clicking the voice button to test speech recognition!",
  "color: #ff6b6b; font-size: 12px;"
);
console.log(
  '%cAuthentication system ready! Click "Sign In" or "Get Started" to test.',
  "color: #4ecdc4; font-size: 12px;"
);

// ==================== FIXES FOR VOICE VISUALIZER & NAVIGATION ====================

// Enhanced user interface updates that preserve original functionality
function updateUserInterfaceEnhanced() {
  const userNavInfo = document.getElementById("userNavInfo");
  const navUserName = document.getElementById("navUserName");
  const searchNavLink = document.getElementById("searchNavLink");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (currentUser && authToken) {
    // Show user info in navigation
    if (userNavInfo) userNavInfo.style.display = "flex";
    if (navUserName)
      navUserName.textContent =
        currentUser.full_name || currentUser.username || "User";
    if (searchNavLink) searchNavLink.style.display = "flex";

    // Hide auth buttons
    if (loginBtn) loginBtn.style.display = "none";
    if (registerBtn) {
      registerBtn.textContent = "Dashboard";
      registerBtn.onclick = () => (window.location.href = "search.html");
    }
  } else {
    // Hide user-specific elements
    if (userNavInfo) userNavInfo.style.display = "none";
    if (searchNavLink) searchNavLink.style.display = "none";

    // Show auth buttons
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (registerBtn) {
      registerBtn.textContent = "Get Started";
      registerBtn.onclick = () => openAuthModal("register");
      registerBtn.style.display = "inline-block";
    }
  }
}

// Fix voice visualizer animations
function animateVoiceBarsFixed(animate) {
  const bars = document.querySelectorAll(".voice-bars .bar");

  if (animate) {
    bars.forEach((bar, index) => {
      bar.style.animationPlayState = "running";
      bar.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;
      bar.style.animationDelay = `${index * 0.1}s`;
    });
  } else {
    bars.forEach((bar) => {
      bar.style.animationPlayState = "paused";
    });
  }
}

// Enhanced logout function
function logoutEnhanced() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  authToken = null;
  currentUser = null;
  updateUserInterfaceEnhanced();
  showSuccessMessage("Logged Out", "You have been successfully logged out.");
}

// Override existing logout
window.logout = logoutEnhanced;

// Initialize fixes when DOM loads
setTimeout(() => {
  // Check authentication state
  if (authToken && localStorage.getItem("currentUser")) {
    try {
      currentUser = JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
      console.error("Error parsing stored user:", e);
    }
  }

  // Update UI based on auth state
  updateUserInterfaceEnhanced();

  // Fix voice visualizer on load
  const bars = document.querySelectorAll(".voice-bars .bar");
  bars.forEach((bar) => {
    if (!bar.style.height) {
      bar.style.height = "20px";
    }
  });
}, 1000);

console.log("🔧 VoiceRoute fixes applied - Everything should work now!");

// ==================== ENHANCED VOICE CHAT SYSTEM ====================

// Voice Chat Global Variables
let voiceChatHistory = [];
let currentVoiceRecognition = null;
let isVoiceListening = false;
let isVoiceProcessing = false;
let voiceSettings = {
  language: "en-IN",
  speed: 1.0,
  autoListen: false,
};
let lastResponse = "";
let conversationId = null;

// Initialize Voice Chat System
document.addEventListener("DOMContentLoaded", function () {
  initializeVoiceChatSystem();
  loadVoiceChatHistory();
  loadVoiceSettings();
});

// ==================== VOICE CHAT INITIALIZATION ====================

function initializeVoiceChatSystem() {
  // Generate conversation ID for this session
  conversationId = "voice_chat_" + Date.now();

  // Initialize voice recognition if supported
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    setupVoiceRecognition();
  }

  // Set up voice settings listeners
  setupVoiceSettingsListeners();

  // Set up example query clicks
  setupExampleQueries();

  console.log("🎤 Enhanced Voice Chat System initialized!");
}

function setupVoiceRecognition() {
  try {
    if ("webkitSpeechRecognition" in window) {
      currentVoiceRecognition = new webkitSpeechRecognition();
    } else if ("SpeechRecognition" in window) {
      currentVoiceRecognition = new SpeechRecognition();
    }

    if (!currentVoiceRecognition) return;

    currentVoiceRecognition.continuous = false;
    currentVoiceRecognition.interimResults = true;
    currentVoiceRecognition.maxAlternatives = 1;
    currentVoiceRecognition.lang = voiceSettings.language;

    currentVoiceRecognition.onstart = handleVoiceStart;
    currentVoiceRecognition.onresult = handleVoiceResult;
    currentVoiceRecognition.onend = handleVoiceEnd;
    currentVoiceRecognition.onerror = handleVoiceError;
  } catch (error) {
    console.error("Voice recognition setup error:", error);
  }
}

// ==================== VOICE CHAT MODAL MANAGEMENT ====================

function openVoiceChat() {
  const modal = document.getElementById("voiceChatModal");
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Focus on the voice chat
    setTimeout(() => {
      const chatHistory = document.getElementById("voiceChatHistory");
      if (chatHistory) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }
    }, 100);
  }
}

function closeVoiceChat() {
  const modal = document.getElementById("voiceChatModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";

    // Stop any ongoing voice recognition
    if (isVoiceListening) {
      stopVoiceRecognition();
    }
  }
}

function toggleVoiceSettings() {
  const panel = document.getElementById("voiceSettingsPanel");
  if (panel) {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
}

function clearVoiceHistory() {
  if (confirm("Are you sure you want to clear the chat history?")) {
    voiceChatHistory = [];
    localStorage.removeItem("voiceChatHistory");
    renderChatHistory();

    // Show success message
    addChatMessage(
      "system",
      "✨ Chat history cleared! Ready for a fresh start."
    );
  }
}

// ==================== VOICE RECOGNITION HANDLERS ====================

function toggleVoiceRecognition() {
  if (!currentVoiceRecognition) {
    addChatMessage(
      "system",
      "❌ Voice recognition is not supported in this browser. Please use Chrome or Firefox."
    );
    return;
  }

  if (isVoiceListening) {
    stopVoiceRecognition();
  } else {
    startVoiceRecognition();
  }
}

function startVoiceRecognition() {
  if (isVoiceProcessing) return;

  try {
    updateVoiceUI("listening");
    currentVoiceRecognition.lang = voiceSettings.language;
    currentVoiceRecognition.start();
    isVoiceListening = true;

    updateVoiceStatusText("🎤 Listening... Speak now!");
  } catch (error) {
    console.error("Voice recognition start error:", error);
    updateVoiceUI("ready");
    addChatMessage(
      "system",
      "❌ Failed to start voice recognition. Please try again."
    );
  }
}

function stopVoiceRecognition() {
  if (currentVoiceRecognition && isVoiceListening) {
    currentVoiceRecognition.stop();
    isVoiceListening = false;
    updateVoiceUI("ready");
  }
}

function handleVoiceStart() {
  console.log("Voice recognition started");
  updateVoiceStatusText("🎤 Listening... I can hear you!");
}

function handleVoiceResult(event) {
  let interimTranscript = "";
  let finalTranscript = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;

    if (event.results[i].isFinal) {
      finalTranscript += transcript;
    } else {
      interimTranscript += transcript;
    }
  }

  // Show interim results
  if (interimTranscript) {
    updateVoiceStatusText(`🎤 Hearing: "${interimTranscript}"`);
  }

  // Process final transcript
  if (finalTranscript) {
    processVoiceInput(finalTranscript.trim());
  }
}

function handleVoiceEnd() {
  isVoiceListening = false;
  updateVoiceUI("ready");

  if (!isVoiceProcessing) {
    updateVoiceStatusText(
      "Ready to listen... Click the microphone button to speak again."
    );
  }
}

function handleVoiceError(event) {
  console.error("Voice recognition error:", event.error);
  isVoiceListening = false;
  updateVoiceUI("ready");

  let errorMessage = "Voice recognition error occurred.";
  switch (event.error) {
    case "no-speech":
      errorMessage = "🔇 No speech detected. Please try again.";
      break;
    case "audio-capture":
      errorMessage = "🎤 Microphone not accessible. Please check permissions.";
      break;
    case "not-allowed":
      errorMessage = "🚫 Microphone permission denied. Please allow access.";
      break;
    case "network":
      errorMessage = "🌐 Network error. Please check your connection.";
      break;
    default:
      errorMessage = `❌ Error: ${event.error}. Please try again.`;
  }

  updateVoiceStatusText(errorMessage);
}

// ==================== VOICE INPUT PROCESSING ====================

async function processVoiceInput(transcript) {
  if (!transcript || transcript.length === 0) return;

  // Add user message to chat
  addChatMessage("user", transcript);

  // Update UI to processing state
  updateVoiceUI("processing");
  updateVoiceStatusText("🧠 Processing your request...");

  // Show typing indicator
  showTypingIndicator();

  try {
    // Process the voice command
    const response = await processVoiceCommand(transcript);

    // Hide typing indicator
    hideTypingIndicator();

    // Add assistant response to chat
    addChatMessage("assistant", response);

    // Speak the response if text-to-speech is available
    speakResponse(response);

    // Auto-listen if enabled
    if (voiceSettings.autoListen && !isVoiceProcessing) {
      setTimeout(() => {
        if (
          document.getElementById("voiceChatModal").style.display === "flex"
        ) {
          startVoiceRecognition();
        }
      }, 2000);
    }
  } catch (error) {
    console.error("Voice processing error:", error);
    hideTypingIndicator();

    const errorResponse =
      "I'm sorry, I encountered an error processing your request. Please try again or rephrase your question.";
    addChatMessage("assistant", errorResponse);
    speakResponse(errorResponse);
  } finally {
    isVoiceProcessing = false;
    updateVoiceUI("ready");
    updateVoiceStatusText(
      "Ready to listen... Click the microphone to speak again."
    );
  }
}

async function processVoiceCommand(command) {
  const lowerCommand = command.toLowerCase();

  // Enhanced NLP for route searching
  const routePatterns = {
    from: /(?:from|leaving\\s+from|starting\\s+from|depart(?:ing)?\\s+from)\\s+([a-zA-Z\\s]+?)(?:\\s+to|\\s+and|\\s+destination|$)/i,
    to: /(?:to|going\\s+to|heading\\s+to|destination|arrive\\s+at|arriving\\s+at)\\s+([a-zA-Z\\s]+?)(?:\\s|\\.|$)/i,
    transport: /(train|trains|railway|bus|buses|flight|flights|plane)/i,
    time: /(today|tomorrow|this\\s+evening|morning|afternoon|evening|night|\\d{1,2}\\s*(?:am|pm))/i,
  };

  // Extract route information
  const fromMatch = lowerCommand.match(routePatterns.from);
  const toMatch = lowerCommand.match(routePatterns.to);
  const transportMatch = lowerCommand.match(routePatterns.transport);
  const timeMatch = lowerCommand.match(routePatterns.time);

  let response = "";

  if (fromMatch && toMatch) {
    // Route search query
    const fromLocation = fromMatch[1].trim();
    const toLocation = toMatch[1].trim();
    const transportType = transportMatch ? transportMatch[1] : "both";

    response = await handleRouteSearchQuery(
      fromLocation,
      toLocation,
      transportType,
      timeMatch
    );
  } else if (
    lowerCommand.includes("help") ||
    lowerCommand.includes("what can you do")
  ) {
    // Help query
    response = `I'm VoiceRoute Assistant! I can help you with:
        
🚂 **Finding Trains & Buses**: Say "Find trains from Delhi to Mumbai" or "Show buses to Bangalore"
🕐 **Time-specific searches**: "Morning trains to Chennai" or "Evening buses tomorrow"
💰 **Budget options**: "Cheapest way to Pune" or "AC buses under 1000 rupees"
📍 **Route information**: "How long does it take to reach Goa?" or "Best route to Kerala"
⭐ **Recommendations**: "Popular destinations from Mumbai" or "Weekend trips from Delhi"

Just speak naturally - I'll understand your travel needs! Try saying something like "Find tomorrow's trains from your city to any destination you want to visit."`;
  } else if (
    lowerCommand.includes("hello") ||
    lowerCommand.includes("hi") ||
    lowerCommand.includes("hey")
  ) {
    // Greeting
    const greetings = [
      "Hello! I'm your VoiceRoute Assistant. How can I help you plan your journey today?",
      "Hi there! Ready to find the perfect route for your travel? Just tell me where you want to go!",
      "Hey! I'm here to help you discover trains and buses across India. What's your destination?",
    ];
    response = greetings[Math.floor(Math.random() * greetings.length)];
  } else if (lowerCommand.includes("thank")) {
    // Thank you
    response =
      "You're welcome! I'm always here to help you find the best routes. Have a great journey! 🚀";
  } else if (lowerCommand.includes("bye") || lowerCommand.includes("goodbye")) {
    // Goodbye
    response =
      "Goodbye! Safe travels, and feel free to ask me anytime you need help planning your journey! 👋";
  } else {
    // Try to interpret as a general travel query
    response = await handleGeneralTravelQuery(command);
  }

  // Store the last response for replay
  lastResponse = response;

  return response;
}

async function handleRouteSearchQuery(
  fromLocation,
  toLocation,
  transportType,
  timeMatch
) {
  // Format locations
  const formatLocation = (location) => {
    return location
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formattedFrom = formatLocation(fromLocation);
  const formattedTo = formatLocation(toLocation);

  // Try to call the backend API
  try {
    const authToken = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE_URL || "http://localhost:5000/api"}/search/routes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          source: formattedFrom,
          destination: formattedTo,
          transport_type:
            transportType === "train" ||
            transportType === "trains" ||
            transportType === "railway"
              ? "train"
              : transportType === "bus" || transportType === "buses"
              ? "bus"
              : "both",
          query_text: `Find ${transportType} from ${formattedFrom} to ${formattedTo}`,
          voice_query: true,
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      return formatRouteSearchResults(
        result.data || [],
        formattedFrom,
        formattedTo,
        transportType
      );
    }
  } catch (error) {
    console.error("API call failed:", error);
  }

  // Fallback response with realistic information
  return generateFallbackRouteResponse(
    formattedFrom,
    formattedTo,
    transportType,
    timeMatch
  );
}

function formatRouteSearchResults(routes, from, to, transportType) {
  if (!routes || routes.length === 0) {
    return `I couldn't find any specific routes from ${from} to ${to} right now. This might be because:

🔍 The route database is still loading
📍 The location names might need to be more specific
🕐 Routes might not be available for today

**Suggestion**: Try using the Dashboard to search with filters, or ask me about popular routes like "Delhi to Mumbai" or "Bangalore to Chennai".`;
  }

  let response = `Great! I found ${routes.length} ${
    transportType === "both" ? "" : transportType
  } routes from **${from}** to **${to}**:\\n\\n`;

  // Show top 3 routes
  const topRoutes = routes.slice(0, 3);

  topRoutes.forEach((route, index) => {
    const routeType = route.transport_type.toUpperCase();
    const duration = formatDuration(route.journey_duration || 300);
    const price = route.fare_base || "Price varies";

    response += `**${index + 1}. ${
      route.route_name || route.operator_name
    }** (${routeType})\\n`;
    response += `   ⏰ ${route.departure_time} → ${route.arrival_time} (${duration})\\n`;
    response += `   💰 Starting from ₹${price}\\n`;
    if (route.available_seats) {
      response += `   🎫 ${route.available_seats} seats available\\n`;
    }
    response += `\\n`;
  });

  if (routes.length > 3) {
    response += `📋 **${
      routes.length - 3
    } more options** available in the Dashboard.\\n\\n`;
  }

  response += `🔍 **Want more details?** Open the Dashboard to see all options, apply filters, and book your tickets!`;

  return response;
}

function generateFallbackRouteResponse(from, to, transportType, timeMatch) {
  const timeText = timeMatch ? ` ${timeMatch[0]}` : "";
  const transportText =
    transportType === "both"
      ? "trains and buses"
      : transportType.includes("train")
      ? "trains"
      : "buses";

  return `I'll help you find ${transportText} from **${from}** to **${to}**${timeText}! 

🚂 **For Trains**: Major routes typically run multiple times daily with options from general class to AC coaches.

🚌 **For Buses**: State and private operators provide regular services with various comfort levels.

⏰ **Typical Journey Time**: Varies from 3-15 hours depending on distance and transport type.

💰 **Price Range**: Usually ₹200-₹2000 based on class and distance.

🎯 **Recommendation**: Use the Dashboard to:
   ✅ See real-time availability
   ✅ Compare prices and timings  
   ✅ Apply filters for your preferences
   ✅ Book tickets directly

Would you like me to help you with anything else about this route or plan a different journey?`;
}

async function handleGeneralTravelQuery(command) {
  const lowerCommand = command.toLowerCase();

  if (
    lowerCommand.includes("popular") ||
    lowerCommand.includes("famous") ||
    lowerCommand.includes("tourist")
  ) {
    return `Here are some **popular travel routes** in India:

🏔️ **Hill Stations**: Delhi→Manali, Mumbai→Lonavala, Bangalore→Ooty
🏖️ **Beaches**: Mumbai→Goa, Chennai→Pondicherry, Bangalore→Gokarna  
🏛️ **Heritage**: Delhi→Agra→Jaipur (Golden Triangle), Mumbai→Aurangabad
🌴 **South India**: Bangalore→Chennai→Kochi, Hyderabad→Tirupati

Which type of destination interests you? I can help find the best routes!`;
  } else if (
    lowerCommand.includes("cheap") ||
    lowerCommand.includes("budget") ||
    lowerCommand.includes("affordable")
  ) {
    return `💰 **Budget Travel Tips**:

🚂 **Trains**: General/Sleeper class for longer distances
🚌 **Buses**: State transport buses are usually cheapest
🕐 **Timing**: Off-peak hours often have lower prices
📅 **Booking**: Advance booking can save 10-30%

**Example Budget Routes**:
• Delhi→Agra: ₹50-₹200 (train)
• Mumbai→Pune: ₹100-₹300 (bus)
• Bangalore→Chennai: ₹150-₹400 (both)

Tell me your route, and I'll find the most affordable options!`;
  } else {
    // Default response for unclear queries
    return `I'd love to help you with your travel plans! 

To give you the best suggestions, try asking me:

🗺️ **Route searches**: "Find trains from [your city] to [destination]"
⏰ **Time-specific**: "Morning buses to Pune tomorrow"  
💰 **Budget options**: "Cheapest way to reach Goa"
🎯 **Recommendations**: "Popular weekend trips from Mumbai"

You can also say things like "Help" for more options, or just tell me where you want to go and I'll guide you!

What journey are you planning?`;
  }
}

// ==================== CHAT INTERFACE MANAGEMENT ====================

function addChatMessage(sender, text, timestamp = new Date()) {
  const messageId = Date.now() + Math.random();

  const message = {
    id: messageId,
    sender: sender, // 'user', 'assistant', or 'system'
    text: text,
    timestamp: timestamp,
    conversationId: conversationId,
  };

  voiceChatHistory.push(message);
  renderChatMessage(message);

  // Save to localStorage
  localStorage.setItem(
    "voiceChatHistory",
    JSON.stringify(voiceChatHistory.slice(-100))
  ); // Keep last 100 messages

  // Scroll to bottom
  setTimeout(() => {
    const chatHistory = document.getElementById("voiceChatHistory");
    if (chatHistory) {
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  }, 100);
}

function renderChatMessage(message) {
  const chatHistory = document.getElementById("voiceChatHistory");
  if (!chatHistory) return;

  // Remove welcome message if this is the first real message
  const welcomeMessage = chatHistory.querySelector(".chat-welcome");
  if (welcomeMessage && message.sender !== "system") {
    welcomeMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${message.sender}`;
  messageDiv.dataset.messageId = message.id;

  let senderIcon = "👤";
  let senderName = "You";

  if (message.sender === "assistant") {
    senderIcon = "🤖";
    senderName = "VoiceRoute Assistant";
  } else if (message.sender === "system") {
    senderIcon = "⚙️";
    senderName = "System";
  }

  const timeString =
    message.timestamp instanceof Date
      ? message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

  messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <span>${senderIcon}</span>
                <span>${senderName}</span>
            </div>
            <div class="message-text">${formatMessageText(message.text)}</div>
            <div class="message-timestamp">${timeString}</div>
            ${
              message.sender === "assistant"
                ? `
                <div class="message-actions">
                    <button class="message-action-btn" onclick="speakText('${message.text.replace(
                      /'/g,
                      "\\'"
                    )}')">
                        <i class="fas fa-volume-up"></i> Speak
                    </button>
                    <button class="message-action-btn" onclick="copyMessageText('${message.text.replace(
                      /'/g,
                      "\\'"
                    )}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            `
                : ""
            }
        </div>
    `;

  chatHistory.appendChild(messageDiv);
}

function formatMessageText(text) {
  // Convert markdown-style formatting to HTML
  return text
    .replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>") // **bold**
    .replace(/\\*([^*]+)\\*/g, "<em>$1</em>") // *italic*
    .replace(/\\n\\n/g, "</p><p>") // Double line breaks
    .replace(/\\n/g, "<br>") // Single line breaks
    .replace(/^/, "<p>") // Start paragraph
    .replace(/$/, "</p>"); // End paragraph
}

function renderChatHistory() {
  const chatHistory = document.getElementById("voiceChatHistory");
  if (!chatHistory) return;

  // Clear existing messages except welcome
  const existingMessages = chatHistory.querySelectorAll(".chat-message");
  existingMessages.forEach((msg) => msg.remove());

  // Render all messages
  voiceChatHistory.forEach((message) => {
    renderChatMessage(message);
  });

  // Scroll to bottom
  setTimeout(() => {
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }, 100);
}

function showTypingIndicator() {
  const chatHistory = document.getElementById("voiceChatHistory");
  if (!chatHistory) return;

  const typingDiv = document.createElement("div");
  typingDiv.className = "chat-message assistant";
  typingDiv.id = "typingIndicator";

  typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;

  chatHistory.appendChild(typingDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// ==================== TEXT-TO-SPEECH ====================

function speakResponse(text) {
  if ("speechSynthesis" in window && text) {
    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Clean text for speech
    const cleanText = text.replace(/[*_#]/g, "").replace(/\\n/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = voiceSettings.speed;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use Indian English voice if available
    const voices = speechSynthesis.getVoices();
    const indianVoice =
      voices.find((voice) => voice.lang.includes("en-IN")) ||
      voices.find((voice) => voice.lang.includes("en-")) ||
      voices[0];

    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => {
      updateVoiceStatusText("🔊 Speaking response...");
    };

    utterance.onend = () => {
      updateVoiceStatusText(
        "Ready to listen... Click the microphone to speak again."
      );
    };

    speechSynthesis.speak(utterance);
  }
}

function speakText(text) {
  speakResponse(text);
}

function playLastResponse() {
  if (lastResponse) {
    speakResponse(lastResponse);
  } else {
    updateVoiceStatusText("No previous response to replay.");
  }
}

// ==================== TEXT INPUT FUNCTIONALITY ====================

function sendTextMessage() {
  const textInputArea = document.getElementById("textInputArea");
  const textInput = document.getElementById("textInput");

  if (textInputArea.style.display === "none") {
    // Show text input
    textInputArea.style.display = "flex";
    textInput.focus();
  } else {
    // Send text message
    const text = textInput.value.trim();
    if (text) {
      processVoiceInput(text);
      textInput.value = "";
      hideTextInput();
    }
  }
}

function hideTextInput() {
  const textInputArea = document.getElementById("textInputArea");
  if (textInputArea) {
    textInputArea.style.display = "none";
  }
}

function handleTextInputKeypress(event) {
  if (event.key === "Enter") {
    sendTextMessage();
  }
}

// ==================== VOICE SETTINGS MANAGEMENT ====================

function setupVoiceSettingsListeners() {
  // Language change
  const languageSelect = document.getElementById("voiceLanguage");
  if (languageSelect) {
    languageSelect.addEventListener("change", (e) => {
      voiceSettings.language = e.target.value;
      saveVoiceSettings();
      if (currentVoiceRecognition) {
        currentVoiceRecognition.lang = voiceSettings.language;
      }
    });
  }

  // Voice speed change
  const speedSlider = document.getElementById("voiceSpeed");
  const speedValue = document.getElementById("voiceSpeedValue");
  if (speedSlider && speedValue) {
    speedSlider.addEventListener("input", (e) => {
      voiceSettings.speed = parseFloat(e.target.value);
      speedValue.textContent = voiceSettings.speed.toFixed(1) + "x";
      saveVoiceSettings();
    });
  }

  // Auto-listen toggle
  const autoListenCheckbox = document.getElementById("autoListen");
  if (autoListenCheckbox) {
    autoListenCheckbox.addEventListener("change", (e) => {
      voiceSettings.autoListen = e.target.checked;
      saveVoiceSettings();
    });
  }
}

function saveVoiceSettings() {
  localStorage.setItem("voiceSettings", JSON.stringify(voiceSettings));
}

function loadVoiceSettings() {
  const saved = localStorage.getItem("voiceSettings");
  if (saved) {
    try {
      voiceSettings = { ...voiceSettings, ...JSON.parse(saved) };

      // Apply settings to UI
      const languageSelect = document.getElementById("voiceLanguage");
      const speedSlider = document.getElementById("voiceSpeed");
      const speedValue = document.getElementById("voiceSpeedValue");
      const autoListenCheckbox = document.getElementById("autoListen");

      if (languageSelect) languageSelect.value = voiceSettings.language;
      if (speedSlider) speedSlider.value = voiceSettings.speed;
      if (speedValue)
        speedValue.textContent = voiceSettings.speed.toFixed(1) + "x";
      if (autoListenCheckbox)
        autoListenCheckbox.checked = voiceSettings.autoListen;
    } catch (error) {
      console.error("Error loading voice settings:", error);
    }
  }
}

function loadVoiceChatHistory() {
  const saved = localStorage.getItem("voiceChatHistory");
  if (saved) {
    try {
      voiceChatHistory = JSON.parse(saved);
    } catch (error) {
      console.error("Error loading chat history:", error);
      voiceChatHistory = [];
    }
  }
}

// ==================== EXAMPLE QUERIES ====================

function setupExampleQueries() {
  const exampleQueries = document.querySelectorAll(".example-query");
  exampleQueries.forEach((query) => {
    query.addEventListener("click", () => {
      const queryText = query.textContent.replace(/"/g, "");
      processVoiceInput(queryText);
    });
  });
}

// ==================== UI UPDATE FUNCTIONS ====================

function updateVoiceUI(state) {
  const statusIndicator = document.getElementById("voiceStatusIndicator");
  const voiceCircle = document.getElementById("voiceCircle");
  const voiceBars = document.getElementById("voiceBars");
  const mainBtn = document.getElementById("voiceMainBtn");
  const mainIcon = document.getElementById("voiceMainIcon");
  const mainText = document.getElementById("voiceMainText");

  // Remove all state classes
  if (statusIndicator) {
    statusIndicator.className = "voice-status-indicator";
    statusIndicator.classList.add(state);
  }

  if (voiceCircle) {
    voiceCircle.className = "voice-circle";
    if (state === "listening" || state === "processing") {
      voiceCircle.classList.add(state);
    }
  }

  if (voiceBars) {
    voiceBars.className = "voice-bars";
    if (state === "listening") {
      voiceBars.classList.add("active");
    }
  }

  if (mainBtn) {
    mainBtn.className = "voice-main-btn";
    if (state === "listening" || state === "processing") {
      mainBtn.classList.add(state);
    }
  }

  // Update button text and icon
  if (mainIcon && mainText) {
    switch (state) {
      case "listening":
        statusIndicator && (statusIndicator.textContent = "LISTENING");
        mainIcon.className = "fas fa-stop";
        mainText.textContent = "Stop Listening";
        break;
      case "processing":
        statusIndicator && (statusIndicator.textContent = "PROCESSING");
        mainIcon.className = "fas fa-spinner fa-spin";
        mainText.textContent = "Processing...";
        isVoiceProcessing = true;
        break;
      default: // ready
        statusIndicator && (statusIndicator.textContent = "READY");
        mainIcon.className = "fas fa-microphone";
        mainText.textContent = "Start Speaking";
        isVoiceProcessing = false;
    }
  }
}

function updateVoiceStatusText(text) {
  const statusText = document.getElementById("voiceStatusText");
  if (statusText) {
    statusText.textContent = text;
  }
}

// ==================== UTILITY FUNCTIONS ====================

function formatDuration(minutes) {
  if (!minutes) return "Duration varies";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

function copyMessageText(text) {
  navigator.clipboard
    .writeText(text.replace(/[*_]/g, ""))
    .then(() => {
      updateVoiceStatusText("✅ Message copied to clipboard!");
      setTimeout(() => {
        updateVoiceStatusText(
          "Ready to listen... Click the microphone to speak again."
        );
      }, 2000);
    })
    .catch((err) => {
      console.error("Copy failed:", err);
    });
}

// ==================== NAVIGATION FIXES ====================

// Always show Dashboard link (no authentication required)
function updateNavigationForAllUsers() {
  const searchNavLink = document.getElementById("searchNavLink");
  const userNavInfo = document.getElementById("userNavInfo");
  const navUserName = document.getElementById("navUserName");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  // Always show dashboard
  if (searchNavLink) {
    searchNavLink.style.display = "flex";
    searchNavLink.textContent = "🔍 Dashboard";
  }

  // Check if user is logged in
  const authToken = localStorage.getItem("authToken");
  const storedUser = localStorage.getItem("currentUser");

  if (authToken && storedUser) {
    try {
      const currentUser = JSON.parse(storedUser);

      // Show user info
      if (userNavInfo) userNavInfo.style.display = "flex";
      if (navUserName)
        navUserName.textContent =
          currentUser.full_name || currentUser.username || "User";

      // Hide auth buttons
      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
  } else {
    // Show auth buttons
    if (userNavInfo) userNavInfo.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (registerBtn) registerBtn.style.display = "inline-block";
  }
}

// Update navigation on page load
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(updateNavigationForAllUsers, 500);
});

if (searchNavLink) {
  searchNavLink.onclick = () => (window.location.href = "search.html");
}

// ==================== FIXED NAVIGATION FUNCTIONALITY ====================

// Fix navigation click handlers
document.addEventListener("DOMContentLoaded", function () {
  // Voice Chat Navigation Handler
  const voiceChatNavLink = document.getElementById("voiceChatNavLink");
  if (voiceChatNavLink) {
    voiceChatNavLink.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Voice Chat clicked!");
      openVoiceChat();
    });
  }

  // Dashboard Navigation Handler
  const searchNavLink = document.getElementById("searchNavLink");
  if (searchNavLink) {
    searchNavLink.addEventListener("click", function (e) {
      console.log("Dashboard clicked!");
      // Let it navigate normally to search.html
    });
  }

  // Mobile menu toggle
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", function () {
      navMenu.classList.toggle("active");
      console.log("Mobile menu toggled");
    });
  }

  // Update navigation state
  updateNavigationForAllUsers();

  console.log("✅ Navigation handlers setup complete!");
});

// Voice Chat Modal Functions
function openVoiceChat() {
  console.log("Opening voice chat...");

  const modal = document.getElementById("voiceChatModal");
  if (!modal) {
    console.error("Voice chat modal not found!");
    alert(
      "Voice chat is not available. Please add the voice chat modal to your HTML."
    );
    return;
  }

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    const chatHistory = document.getElementById("voiceChatHistory");
    if (chatHistory) {
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  }, 100);

  console.log("✅ Voice chat opened successfully!");
}

function closeVoiceChat() {
  const modal = document.getElementById("voiceChatModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
}

// Always show Dashboard and Voice Chat links
function updateNavigationForAllUsers() {
  const searchNavLink = document.getElementById("searchNavLink");
  const voiceChatNavLink = document.getElementById("voiceChatNavLink");
  const userNavInfo = document.getElementById("userNavInfo");
  const navUserName = document.getElementById("navUserName");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  // Always show dashboard and voice chat
  if (searchNavLink) {
    searchNavLink.style.display = "flex";
    searchNavLink.innerHTML = '<i class="fas fa-search"></i> Dashboard';
  }

  if (voiceChatNavLink) {
    voiceChatNavLink.style.display = "flex";
    voiceChatNavLink.innerHTML = '<i class="fas fa-comments"></i> Voice Chat';
  }

  // Check if user is logged in
  const authToken = localStorage.getItem("authToken");
  const storedUser = localStorage.getItem("currentUser");

  if (authToken && storedUser) {
    try {
      const currentUser = JSON.parse(storedUser);
      if (userNavInfo) userNavInfo.style.display = "flex";
      if (navUserName)
        navUserName.textContent =
          currentUser.full_name || currentUser.username || "User";
      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
  } else {
    if (userNavInfo) userNavInfo.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (registerBtn) registerBtn.style.display = "inline-block";
  }
}

console.log("🎯 Fixed Navigation JavaScript loaded!");

// Console message
console.log(
  "%c🎤 Enhanced Voice Chat System Ready!",
  "color: #ff6b6b; font-size: 18px; font-weight: bold;"
);
console.log(
  "%c• Dashboard available for everyone",
  "color: #4ecdc4; font-size: 14px;"
);
console.log(
  "%c• Voice Chat with conversation history",
  "color: #4ecdc4; font-size: 14px;"
);
console.log(
  "%c• Smart NLP for route queries",
  "color: #4ecdc4; font-size: 14px;"
);
console.log("%c• Multi-language support", "color: #4ecdc4; font-size: 14px;");


if (voiceChatNavLink) {
  voiceChatNavLink.onclick = () => (window.location.href = "chat.html");
}
