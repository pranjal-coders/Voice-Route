// Search Page JavaScript - VoiceRoute Transportation Search
// Authenticated search functionality with advanced filters and voice integration

// API Configuration
const API_BASE_URL = "http://localhost:5000/api";
let authToken = localStorage.getItem("authToken");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
let searchResults = [];
let currentPage = 1;
let totalResults = 0;

// Common Indian cities and stations for autocomplete
const commonLocations = [
  // Major Cities
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Surat",
  "Kanpur",
  "Nagpur",
  "Lucknow",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Pimpri-Chinchwad",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",

  // Major Railway Stations
  "New Delhi",
  "Mumbai Central",
  "Mumbai CST",
  "Bangalore City",
  "Chennai Central",
  "Howrah Junction",
  "Secunderabad",
  "Pune Junction",
  "Jaipur Junction",
  "Ahmedabad Junction",
  "Kanpur Central",
  "Nagpur Junction",
  "Lucknow Junction",

  // Bus Terminals
  "Delhi ISBT",
  "Mumbai Central Bus Terminal",
  "Bangalore Majestic",
  "Chennai CMBT",
  "Pune Bus Terminal",
  "Jaipur Bus Terminal",
  "Ahmedabad Bus Terminal",

  // Popular Tourist Destinations
  "Goa",
  "Manali",
  "Shimla",
  "Darjeeling",
  "Ooty",
  "Kodaikanal",
  "Mount Abu",
  "Udaipur",
  "Jodhpur",
  "Agra",
  "Varanasi",
  "Rishikesh",
  "Haridwar",
  "Amritsar",
];

// Initialize page when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("VoiceRoute Search Page initialized! 🚂🚌");

  // Check authentication
  // if (!checkAuthentication()) {
  //     redirectToLogin();
  //     return;
  // }

  // Initialize page components
  initializeSearchPage();
  setupEventListeners();
  updateUserInterface();
  setDefaultTravelDate();
});

// // ==================== AUTHENTICATION ====================

// function checkAuthentication() {
//     if (!authToken || !currentUser) {
//         console.log('User not authenticated, redirecting to login');
//         return false;
//     }

//     // Validate token (basic check)
//     try {
//         const tokenParts = authToken.split('.');
//         if (tokenParts.length !== 3) {
//             throw new Error('Invalid token format');
//         }
//         return true;
//     } catch (error) {
//         console.error('Token validation failed:', error);
//         localStorage.removeItem('authToken');
//         localStorage.removeItem('currentUser');
//         return false;
//     }
// }

// function redirectToLogin() {
//     // Show message and redirect
//     document.body.innerHTML = `
//         <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; text-align: center;">
//             <div class="glass-morphism" style="padding: 3rem; border-radius: 20px; max-width: 500px;">
//                 <i class="fas fa-lock" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
//                 <h2 style="margin-bottom: 1rem;">Authentication Required</h2>
//                 <p style="margin-bottom: 2rem; opacity: 0.8;">Please log in to access the route search feature.</p>
//                 <a href="index.html" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1rem 2rem; border-radius: 25px; text-decoration: none; font-weight: 600;">
//                     <i class="fas fa-arrow-left"></i> Go to Login
//                 </a>
//             </div>
//         </div>
//     `;
// }

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// ==================== PAGE INITIALIZATION ====================

function initializeSearchPage() {
  // Initialize transport type selection
  initializeTransportTypeSelector();

  // Initialize location autocomplete
  initializeLocationAutocomplete();

  // Initialize price range slider
  initializePriceRange();

  // Initialize form validation
  initializeFormValidation();

  // Load user preferences if available
  loadUserPreferences();
}

function setupEventListeners() {
  // Form submission
  const searchForm = document.getElementById("routeSearchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchSubmission);
  }

  // Mobile navigation
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }

  // Sort change handler
  const sortBy = document.getElementById("sortBy");
  if (sortBy) {
    sortBy.addEventListener("change", handleSortChange);
  }
}

function updateUserInterface() {
  // Update user info in navigation
  const userNavInfo = document.getElementById("userNavInfo");
  const navUserName = document.getElementById("navUserName");

  if (currentUser && userNavInfo && navUserName) {
    userNavInfo.style.display = "flex";
    navUserName.textContent =
      currentUser.full_name || currentUser.username || "User";
  }
}

function setDefaultTravelDate() {
  const travelDateInput = document.getElementById("travelDate");
  if (travelDateInput) {
    // Set default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    travelDateInput.value = tomorrow.toISOString().split("T")[0];
    travelDateInput.min = new Date().toISOString().split("T")[0]; // Can't select past dates
  }
}

// ==================== TRANSPORT TYPE SELECTOR ====================

function initializeTransportTypeSelector() {
  const transportOptions = document.querySelectorAll(".transport-option");

  transportOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Remove active class from all options
      transportOptions.forEach((opt) => opt.classList.remove("active"));

      // Add active class to clicked option
      option.classList.add("active");

      // Update form data
      const transportType = option.dataset.type;
      console.log("Transport type selected:", transportType);

      // Show/hide class preferences based on transport type
      updateClassPreferences(transportType);
    });
  });
}

function updateClassPreferences(transportType) {
  const classOptions = document.querySelectorAll(".class-option");

  classOptions.forEach((option) => {
    const input = option.querySelector("input");
    const value = input.value;

    // Show/hide options based on transport type
    if (transportType === "train") {
      // Show train-specific classes
      option.style.display = ["general", "sleeper", "ac"].includes(value)
        ? "flex"
        : "none";
    } else if (transportType === "bus") {
      // Show bus-specific classes
      option.style.display = ["general", "sleeper", "ac", "premium"].includes(
        value
      )
        ? "flex"
        : "none";
    } else {
      // Show all classes for 'both'
      option.style.display = "flex";
    }
  });
}

// ==================== LOCATION AUTOCOMPLETE ====================

function initializeLocationAutocomplete() {
  const fromLocationInput = document.getElementById("fromLocation");
  const toLocationInput = document.getElementById("toLocation");

  if (fromLocationInput) {
    setupLocationAutocomplete(fromLocationInput, "fromSuggestions");
  }

  if (toLocationInput) {
    setupLocationAutocomplete(toLocationInput, "toSuggestions");
  }
}

function setupLocationAutocomplete(input, suggestionsId) {
  const suggestionsContainer = document.getElementById(suggestionsId);

  input.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query.length < 2) {
      hideSuggestions(suggestionsContainer);
      return;
    }

    const matches = commonLocations
      .filter((location) => location.toLowerCase().includes(query))
      .slice(0, 8); // Limit to 8 suggestions

    showSuggestions(suggestionsContainer, matches, input);
  });

  input.addEventListener("blur", () => {
    // Hide suggestions after a short delay to allow clicking
    setTimeout(() => hideSuggestions(suggestionsContainer), 150);
  });
}

function showSuggestions(container, suggestions, input) {
  if (!suggestions.length) {
    hideSuggestions(container);
    return;
  }

  container.innerHTML = suggestions
    .map(
      (location) => `
        <div class="location-suggestion" onclick="selectLocation('${location}', '${input.id}')">
            <i class="fas fa-map-marker-alt"></i>
            <span>${location}</span>
        </div>
    `
    )
    .join("");

  container.style.display = "block";
}

function hideSuggestions(container) {
  container.style.display = "none";
  container.innerHTML = "";
}

function selectLocation(location, inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = location;
    input.focus();
  }

  // Hide all suggestion containers
  document.querySelectorAll(".location-suggestions").forEach((container) => {
    hideSuggestions(container);
  });
}

function swapLocations() {
  const fromInput = document.getElementById("fromLocation");
  const toInput = document.getElementById("toLocation");

  if (fromInput && toInput) {
    const fromValue = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = fromValue;

    // Add animation effect
    const swapBtn = document.querySelector(".swap-locations-btn");
    swapBtn.style.transform = "rotate(180deg)";
    setTimeout(() => {
      swapBtn.style.transform = "rotate(0deg)";
    }, 300);
  }
}

// ==================== PRICE RANGE SLIDER ====================

function initializePriceRange() {
  const priceRange = document.getElementById("priceRange");
  const currentPriceDisplay = document.querySelector(".current-price");

  if (priceRange && currentPriceDisplay) {
    priceRange.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      const displayValue =
        value >= 5000 ? "₹5,000+" : `₹${value.toLocaleString()}`;
      currentPriceDisplay.textContent = displayValue;
    });
  }
}

// ==================== ADVANCED FILTERS ====================

function toggleAdvancedFilters() {
  const content = document.getElementById("advancedFiltersContent");
  const toggleIcon = document.querySelector(".filters-toggle .toggle-icon");

  if (content.style.display === "none" || !content.style.display) {
    content.style.display = "block";
    toggleIcon.style.transform = "rotate(180deg)";
  } else {
    content.style.display = "none";
    toggleIcon.style.transform = "rotate(0deg)";
  }
}

// ==================== FORM VALIDATION ====================

function initializeFormValidation() {
  const fromLocation = document.getElementById("fromLocation");
  const toLocation = document.getElementById("toLocation");
  const travelDate = document.getElementById("travelDate");

  // Real-time validation
  if (fromLocation) {
    fromLocation.addEventListener("blur", () =>
      validateLocation(fromLocation, "From location")
    );
  }

  if (toLocation) {
    toLocation.addEventListener("blur", () =>
      validateLocation(toLocation, "Destination")
    );
  }

  if (travelDate) {
    travelDate.addEventListener("change", validateTravelDate);
  }
}

function validateLocation(input, fieldName) {
  const value = input.value.trim();

  if (!value) {
    showFieldError(input, `${fieldName} is required`);
    return false;
  }

  if (value.length < 2) {
    showFieldError(input, `${fieldName} must be at least 2 characters`);
    return false;
  }

  clearFieldError(input);
  return true;
}

function validateTravelDate() {
  const travelDate = document.getElementById("travelDate");
  const selectedDate = new Date(travelDate.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    showFieldError(travelDate, "Travel date cannot be in the past");
    return false;
  }

  clearFieldError(travelDate);
  return true;
}

function showFieldError(input, message) {
  clearFieldError(input);

  input.classList.add("error");
  const errorDiv = document.createElement("div");
  errorDiv.className = "field-error-message";
  errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

  input.parentNode.appendChild(errorDiv);
}

function clearFieldError(input) {
  input.classList.remove("error");
  const existingError = input.parentNode.querySelector(".field-error-message");
  if (existingError) {
    existingError.remove();
  }
}

// ==================== SEARCH FORM SUBMISSION ====================

async function handleSearchSubmission(e) {
  e.preventDefault();

  if (!validateSearchForm()) {
    return;
  }

  const searchData = collectSearchFormData();
  console.log("Search form data:", searchData);

  // Show loading
  showSearchLoading();

  try {
    // Perform search
    await performRouteSearch(searchData);
  } catch (error) {
    console.error("Search error:", error);
    hideSearchLoading();
    showSearchError("Search failed. Please try again.");
  }
}

function validateSearchForm() {
  const fromLocation = document.getElementById("fromLocation");
  const toLocation = document.getElementById("toLocation");
  const travelDate = document.getElementById("travelDate");

  let isValid = true;

  if (!validateLocation(fromLocation, "From location")) isValid = false;
  if (!validateLocation(toLocation, "Destination")) isValid = false;
  if (!validateTravelDate()) isValid = false;

  // Check if from and to are the same
  if (
    fromLocation.value.trim().toLowerCase() ===
    toLocation.value.trim().toLowerCase()
  ) {
    showFieldError(
      toLocation,
      "Destination must be different from departure location"
    );
    isValid = false;
  }

  return isValid;
}

function collectSearchFormData() {
  const form = document.getElementById("routeSearchForm");
  const formData = new FormData(form);

  // Get selected transport type
  const activeTransportType = document.querySelector(
    ".transport-option.active"
  );
  const transportType = activeTransportType
    ? activeTransportType.dataset.type
    : "both";

  // Get selected departure times
  const selectedTimes = Array.from(
    document.querySelectorAll('input[name="departure_time"]:checked')
  ).map((input) => input.value);

  // Get selected class preferences
  const selectedClasses = Array.from(
    document.querySelectorAll('input[name="class_preference"]:checked')
  ).map((input) => input.value);

  return {
    from_location: formData.get("from_location").trim(),
    to_location: formData.get("to_location").trim(),
    travel_date: formData.get("travel_date"),
    passenger_count: parseInt(formData.get("passenger_count")),
    transport_type: transportType,
    departure_times: selectedTimes,
    class_preferences: selectedClasses,
    max_price: parseInt(document.getElementById("priceRange").value),
    duration_preference: formData.get("duration_preference"),
    sort_by: "departure_time",
  };
}

// ==================== API SEARCH FUNCTIONALITY ====================

async function performRouteSearch(searchData) {
  const progressSteps = [
    "Initializing search...",
    "Searching train routes...",
    "Searching bus routes...",
    "Applying filters...",
    "Sorting results...",
    "Loading complete!",
  ];

  let currentStep = 0;

  // Simulate progress updates
  const progressInterval = setInterval(() => {
    if (currentStep < progressSteps.length - 1) {
      updateSearchProgress((currentStep + 1) * 20, progressSteps[currentStep]);
      currentStep++;
    }
  }, 800);

  try {
    const response = await fetch(`${API_BASE_URL}/search/routes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        source: searchData.from_location,
        destination: searchData.to_location,
        transport_type: searchData.transport_type,
        query_text: `Find ${searchData.transport_type} from ${searchData.from_location} to ${searchData.to_location} on ${searchData.travel_date}`,
      }),
    });

    clearInterval(progressInterval);
    updateSearchProgress(100, "Loading complete!");

    if (response.ok) {
      const result = await response.json();
      searchResults = result.data || [];
      totalResults = searchResults.length;

      setTimeout(() => {
        hideSearchLoading();
        displaySearchResults(searchResults, searchData);
      }, 500);
    } else {
      throw new Error("Search request failed");
    }
  } catch (error) {
    clearInterval(progressInterval);
    console.error("Search API error:", error);

    // Fallback to demo data if API fails
    searchResults = generateDemoResults(searchData);
    totalResults = searchResults.length;

    setTimeout(() => {
      hideSearchLoading();
      displaySearchResults(searchResults, searchData);
    }, 1000);
  }
}

function generateDemoResults(searchData) {
  // Generate realistic demo results based on search parameters
  const demoResults = [];
  const { from_location, to_location, transport_type } = searchData;

  if (transport_type === "train" || transport_type === "both") {
    demoResults.push({
      route_id: 1,
      transport_type: "train",
      operator_name: "Indian Railways",
      route_name: "Rajdhani Express",
      route_number: "12951",
      source: from_location,
      destination: to_location,
      departure_time: "16:55",
      arrival_time: "08:35",
      journey_duration: 945,
      fare_base: 1200,
      fare_sleeper: 2500,
      fare_ac: 4500,
      available_seats: 45,
      avg_rating: 4.2,
    });

    demoResults.push({
      route_id: 2,
      transport_type: "train",
      operator_name: "Indian Railways",
      route_name: "Shatabdi Express",
      route_number: "12007",
      source: from_location,
      destination: to_location,
      departure_time: "06:00",
      arrival_time: "11:00",
      journey_duration: 300,
      fare_base: 450,
      fare_ac: 850,
      available_seats: 23,
      avg_rating: 4.5,
    });
  }

  if (transport_type === "bus" || transport_type === "both") {
    demoResults.push({
      route_id: 3,
      transport_type: "bus",
      operator_name: "VRL Travels",
      route_name: "AC Sleeper Coach",
      route_number: "VRL-301",
      source: from_location,
      destination: to_location,
      departure_time: "21:30",
      arrival_time: "09:15",
      journey_duration: 705,
      fare_base: 850,
      fare_sleeper: 1300,
      fare_ac: 1600,
      available_seats: 15,
      avg_rating: 4.0,
    });

    demoResults.push({
      route_id: 4,
      transport_type: "bus",
      operator_name: "MSRTC",
      route_name: "Shivneri Bus",
      route_number: "MSRTC-201",
      source: from_location,
      destination: to_location,
      departure_time: "08:00",
      arrival_time: "11:30",
      journey_duration: 210,
      fare_base: 200,
      fare_ac: 300,
      available_seats: 28,
      avg_rating: 3.8,
    });
  }

  return demoResults;
}

// ==================== SEARCH RESULTS DISPLAY ====================

function displaySearchResults(results, searchData) {
  const resultsSection = document.getElementById("searchResultsSection");
  const resultsContainer = document.getElementById("resultsContainer");
  const resultsCount = document.getElementById("resultsCount");
  const noResultsContainer = document.getElementById("noResultsContainer");

  if (!results || results.length === 0) {
    // Show no results found
    resultsSection.style.display = "none";
    noResultsContainer.style.display = "flex";
    return;
  }

  // Hide no results and show results section
  noResultsContainer.style.display = "none";
  resultsSection.style.display = "block";

  // Update results count
  resultsCount.textContent = `${results.length} route${
    results.length !== 1 ? "s" : ""
  } found`;

  // Generate results HTML
  resultsContainer.innerHTML = results
    .map((route) => generateRouteCard(route, searchData))
    .join("");

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function generateRouteCard(route, searchData) {
  const duration = formatDuration(route.journey_duration);
  const transportIcon =
    route.transport_type === "train" ? "fas fa-train" : "fas fa-bus";
  const rating = route.avg_rating ? route.avg_rating.toFixed(1) : "N/A";

  // Format fare options
  const fareOptions = [];
  if (route.fare_base) fareOptions.push(`General: ₹${route.fare_base}`);
  if (route.fare_sleeper) fareOptions.push(`Sleeper: ₹${route.fare_sleeper}`);
  if (route.fare_ac) fareOptions.push(`AC: ₹${route.fare_ac}`);

  return `
        <div class="route-card glass-morphism" data-route-id="${
          route.route_id
        }">
            <div class="route-header">
                <div class="route-type">
                    <i class="${transportIcon}"></i>
                    <span class="transport-badge ${
                      route.transport_type
                    }">${route.transport_type.toUpperCase()}</span>
                </div>
                <div class="route-rating">
                    <i class="fas fa-star"></i>
                    <span>${rating}</span>
                </div>
            </div>

            <div class="route-main-info">
                <div class="route-name">
                    <h3>${route.route_name}</h3>
                    <p>${route.operator_name} • ${route.route_number || ""}</p>
                </div>

                <div class="route-timing">
                    <div class="timing-item">
                        <div class="time">${route.departure_time}</div>
                        <div class="location">${route.source}</div>
                    </div>
                    <div class="timing-arrow">
                        <i class="fas fa-arrow-right"></i>
                        <div class="duration">${duration}</div>
                    </div>
                    <div class="timing-item">
                        <div class="time">${route.arrival_time}</div>
                        <div class="location">${route.destination}</div>
                    </div>
                </div>
            </div>

            <div class="route-details">
                <div class="fare-options">
                    ${fareOptions
                      .map((fare) => `<span class="fare-option">${fare}</span>`)
                      .join("")}
                </div>
                <div class="availability">
                    <i class="fas fa-users"></i>
                    <span>${route.available_seats || 0} seats available</span>
                </div>
            </div>

            <div class="route-actions">
                <button class="action-btn secondary" onclick="addToFavorites(${
                  route.route_id
                })">
                    <i class="fas fa-heart"></i>
                    Save
                </button>
                <button class="action-btn secondary" onclick="shareRoute(${
                  route.route_id
                })">
                    <i class="fas fa-share"></i>
                    Share
                </button>
                <button class="action-btn primary" onclick="viewRouteDetails(${
                  route.route_id
                })">
                    <i class="fas fa-info-circle"></i>
                    Details
                </button>
                <button class="action-btn primary" onclick="bookRoute(${
                  route.route_id
                })">
                    <i class="fas fa-ticket-alt"></i>
                    Book Now
                </button>
            </div>
        </div>
    `;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

// ==================== SEARCH LOADING & PROGRESS ====================

function showSearchLoading() {
  const overlay = document.getElementById("searchLoadingOverlay");
  if (overlay) {
    overlay.style.display = "flex";
  }
}

function hideSearchLoading() {
  const overlay = document.getElementById("searchLoadingOverlay");
  if (overlay) {
    overlay.style.display = "none";
  }
}

function updateSearchProgress(percent, text) {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  if (progressFill) {
    progressFill.style.width = `${percent}%`;
  }

  if (progressText) {
    progressText.textContent = text;
  }
}

function showSearchError(message) {
  // Create and show error notification
  const errorDiv = document.createElement("div");
  errorDiv.className = "search-error-notification glass-morphism";
  errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

  document.body.appendChild(errorDiv);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentElement) {
      errorDiv.remove();
    }
  }, 5000);
}

// ==================== QUICK SEARCH FUNCTIONALITY ====================

function fillQuickSearch(from, to, transportType) {
  // Fill form fields
  document.getElementById("fromLocation").value = from;
  document.getElementById("toLocation").value = to;

  // Select transport type
  document.querySelectorAll(".transport-option").forEach((option) => {
    option.classList.remove("active");
    if (option.dataset.type === transportType) {
      option.classList.add("active");
    }
  });

  // Trigger search
  document.getElementById("routeSearchForm").dispatchEvent(new Event("submit"));
}

// ==================== VOICE SEARCH FUNCTIONALITY ====================

let voiceRecognition;
let isVoiceSearchActive = false;

function startVoiceSearch() {
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    alert(
      "Voice search is not supported in your browser. Please use Chrome or Firefox."
    );
    return;
  }

  const modal = document.getElementById("voiceSearchModal");
  modal.style.display = "flex";

  initializeVoiceRecognition();
  voiceRecognition.start();
  isVoiceSearchActive = true;

  updateVoiceStatus("Listening... Say your search query");
  animateVoiceBars(true);
}

function initializeVoiceRecognition() {
  if (voiceRecognition) return;

  if ("webkitSpeechRecognition" in window) {
    voiceRecognition = new webkitSpeechRecognition();
  } else if ("SpeechRecognition" in window) {
    voiceRecognition = new SpeechRecognition();
  }

  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = true;
  voiceRecognition.lang = currentUser?.preferences?.language || "en-US";

  voiceRecognition.onstart = () => {
    console.log("Voice recognition started");
  };

  voiceRecognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    updateVoiceStatus(`Heard: "${transcript}"`);

    if (event.results[event.results.length - 1].isFinal) {
      processVoiceCommand(transcript);
    }
  };

  voiceRecognition.onerror = (event) => {
    console.error("Voice recognition error:", event.error);
    updateVoiceStatus("Error occurred. Please try again.");
    stopVoiceSearch();
  };

  voiceRecognition.onend = () => {
    if (isVoiceSearchActive) {
      stopVoiceSearch();
    }
  };
}

function processVoiceCommand(command) {
  updateVoiceStatus("Processing your request...");

  // Simple NLP to extract search parameters
  const lowerCommand = command.toLowerCase();

  // Extract locations using common patterns
  const fromMatch = lowerCommand.match(
    /from\s+([a-zA-Z\s]+?)(?:\s+to|\s+and|$)/
  );
  const toMatch = lowerCommand.match(/to\s+([a-zA-Z\s]+?)(?:\s|$)/);

  // Extract transport type
  let transportType = "both";
  if (lowerCommand.includes("train") && !lowerCommand.includes("bus")) {
    transportType = "train";
  } else if (lowerCommand.includes("bus") && !lowerCommand.includes("train")) {
    transportType = "bus";
  }

  // Fill the form if locations are found
  if (fromMatch && toMatch) {
    const fromLocation = fromMatch[1].trim();
    const toLocation = toMatch[1].trim();

    // Capitalize first letter of each word
    const formatLocation = (loc) =>
      loc
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    document.getElementById("fromLocation").value =
      formatLocation(fromLocation);
    document.getElementById("toLocation").value = formatLocation(toLocation);

    // Select transport type
    document.querySelectorAll(".transport-option").forEach((option) => {
      option.classList.remove("active");
      if (option.dataset.type === transportType) {
        option.classList.add("active");
      }
    });

    updateVoiceStatus("Search parameters filled! Click search to continue.");

    // Auto-close modal after 3 seconds
    setTimeout(() => {
      closeVoiceSearch();
    }, 3000);
  } else {
    updateVoiceStatus(
      'Could not understand the query. Please try: "Find trains from Delhi to Mumbai"'
    );

    setTimeout(() => {
      stopVoiceSearch();
    }, 3000);
  }
}

function updateVoiceStatus(message) {
  const statusElement = document.getElementById("voiceStatus");
  if (statusElement) {
    statusElement.textContent = message;
  }
}

function animateVoiceBars(animate) {
  const bars = document.querySelectorAll(".voice-bar");
  if (animate) {
    bars.forEach((bar, index) => {
      bar.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
      bar.style.animationDelay = `${index * 0.1}s`;
    });
  }
}

function stopVoiceSearch() {
  isVoiceSearchActive = false;
  if (voiceRecognition) {
    voiceRecognition.stop();
  }
  animateVoiceBars(false);
}

function closeVoiceSearch() {
  stopVoiceSearch();
  const modal = document.getElementById("voiceSearchModal");
  modal.style.display = "none";
}

// ==================== RESULT ACTIONS ====================

async function addToFavorites(routeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        route_id: routeId,
        alias: null,
      }),
    });

    if (response.ok) {
      showNotification("Route added to favorites! ❤️", "success");
    } else {
      throw new Error("Failed to add to favorites");
    }
  } catch (error) {
    console.error("Add to favorites error:", error);
    showNotification("Failed to add to favorites", "error");
  }
}

function shareRoute(routeId) {
  const route = searchResults.find((r) => r.route_id === routeId);
  if (!route) return;

  const shareText = `Check out this ${route.transport_type} route: ${route.route_name} from ${route.source} to ${route.destination} at ${route.departure_time}`;

  if (navigator.share) {
    navigator.share({
      title: "VoiceRoute - Route Sharing",
      text: shareText,
      url: window.location.href,
    });
  } else {
    // Fallback - copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      showNotification("Route details copied to clipboard!", "success");
    });
  }
}

function viewRouteDetails(routeId) {
  const route = searchResults.find((r) => r.route_id === routeId);
  if (!route) return;

  // Create and show detailed modal
  const modal = createRouteDetailsModal(route);
  document.body.appendChild(modal);
}

function bookRoute(routeId) {
  const route = searchResults.find((r) => r.route_id === routeId);
  if (!route) return;

  // In a real application, this would redirect to booking page
  showNotification(
    `Booking feature coming soon! Route: ${route.route_name}`,
    "info"
  );
}

// ==================== UTILITY FUNCTIONS ====================

function handleSortChange() {
  const sortBy = document.getElementById("sortBy").value;
  const sortedResults = [...searchResults].sort((a, b) => {
    switch (sortBy) {
      case "duration":
        return a.journey_duration - b.journey_duration;
      case "price":
        return (a.fare_base || 0) - (b.fare_base || 0);
      case "price_desc":
        return (b.fare_base || 0) - (a.fare_base || 0);
      case "rating":
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      default: // departure_time
        return a.departure_time.localeCompare(b.departure_time);
    }
  });

  displaySearchResults(sortedResults);
}

function clearAndRetrySearch() {
  // Clear form
  document.getElementById("routeSearchForm").reset();
  setDefaultTravelDate();

  // Reset transport type
  document.querySelectorAll(".transport-option").forEach((option) => {
    option.classList.remove("active");
  });
  document
    .querySelector('.transport-option[data-type="both"]')
    .classList.add("active");

  // Hide results
  document.getElementById("searchResultsSection").style.display = "none";
  document.getElementById("noResultsContainer").style.display = "none";

  // Focus on first input
  document.getElementById("fromLocation").focus();
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.add("show"), 100);

  // Auto remove
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function loadUserPreferences() {
  if (!currentUser?.preferences) return;

  const prefs = currentUser.preferences;

  // Set preferred transport type
  if (prefs.preferred_transport && prefs.preferred_transport !== "both") {
    document.querySelectorAll(".transport-option").forEach((option) => {
      option.classList.remove("active");
      if (option.dataset.type === prefs.preferred_transport) {
        option.classList.add("active");
      }
    });
  }

  // Set max budget
  if (prefs.max_budget) {
    const priceRange = document.getElementById("priceRange");
    if (priceRange && prefs.max_budget <= 5000) {
      priceRange.value = prefs.max_budget;
      document.querySelector(
        ".current-price"
      ).textContent = `₹${prefs.max_budget.toLocaleString()}`;
    }
  }
}

// Console welcome message
console.log(
  "%c🚂 VoiceRoute Search Page Loaded! 🚌",
  "color: #667eea; font-size: 18px; font-weight: bold;"
);
console.log("%cUser authenticated:", currentUser?.username || "Unknown");
console.log(
  "%cReady to search for transportation routes!",
  "color: #4ecdc4; font-size: 12px;"
);
