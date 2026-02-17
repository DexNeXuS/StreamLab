// ============================================
// King & Queen Overlay - Main Script
// ============================================
// This file contains the overlay-specific logic.
// WebSocket is provided by ../../../tools/streamerbot-websocket.js

// ============================================
// Debug UI (optional; passed to connectWebSocket)
// ============================================
function updateStatusContainer(status) {
  var statusContainer = document.getElementById('statusContainer');
  if (!statusContainer) return;
  if (!CONFIG || !CONFIG.DEBUG_ENABLED) {
    statusContainer.style.display = 'none';
    statusContainer.style.visibility = 'hidden';
    statusContainer.style.opacity = '0';
    statusContainer.classList.add('hidden');
    console.log('[STATUS]', status);
    return;
  }
  statusContainer.textContent = status;
  statusContainer.style.display = 'block';
  statusContainer.style.visibility = 'visible';
  statusContainer.classList.remove('connected', 'hidden');
  if (status === 'CONNECTED') {
    statusContainer.classList.add('connected');
    setTimeout(function () { statusContainer.classList.add('hidden'); }, 3000);
  }
  console.log('[STATUS]', status);
}

function logMessage(message, type) {
  type = type || 'info';
  console.log('[LOG ' + (type || 'info').toUpperCase() + ']', message);
  if (!CONFIG || !CONFIG.DEBUG_ENABLED) return;
  var messageLog = document.getElementById('messageLog');
  if (messageLog) {
    var messageEl = document.createElement('div');
    messageEl.className = 'message ' + (type || 'info');
    messageEl.innerHTML = '<span class="timestamp">[' + new Date().toLocaleTimeString() + ']</span> ' + message;
    messageLog.insertBefore(messageEl, messageLog.firstChild);
    messageLog.classList.add('visible');
    messageLog.classList.remove('hidden');
    while (messageLog.children.length > 50) messageLog.removeChild(messageLog.lastChild);
    messageLog.scrollTop = 0;
  }
}

// ============================================
// Sound Effect Management
// ============================================
let redeemSound = null;
let tickSound = null;

function initSound() {
  // Initialize redeem sound effect if configured
  if (CONFIG.REDEEM_SOUND && CONFIG.REDEEM_SOUND.trim() !== '') {
    console.log('[Overlay] Initializing redeem sound effect:', CONFIG.REDEEM_SOUND);
    redeemSound = new Audio(CONFIG.REDEEM_SOUND);
    redeemSound.volume = Math.max(0, Math.min(1, CONFIG.SOUND_VOLUME || 0.7));
    redeemSound.preload = 'auto';
    
    // Handle successful load
    redeemSound.addEventListener('canplaythrough', () => {
      console.log('[Overlay] ✅ Redeem sound effect ready to play');
    });
    
    // Handle loading errors gracefully
    redeemSound.addEventListener('error', (e) => {
      console.error('[Overlay] ❌ Failed to load redeem sound effect:', CONFIG.REDEEM_SOUND);
      console.error('[Overlay] Error details:', e);
      console.error('[Overlay] Make sure the file path is correct and the file exists');
      console.error('[Overlay] Sound will be disabled');
      redeemSound = null;
    });
    
    console.log('[Overlay] Redeem sound effect loading...');
  } else {
    console.log('[Overlay] Redeem sound effect disabled (REDEEM_SOUND not set)');
  }
  
  // Initialize tick sound effect if configured
  if (CONFIG.TICK_SOUND && CONFIG.TICK_SOUND.trim() !== '') {
    console.log('[Overlay] Initializing tick sound effect:', CONFIG.TICK_SOUND);
    tickSound = new Audio(CONFIG.TICK_SOUND);
    tickSound.volume = Math.max(0, Math.min(1, CONFIG.SOUND_VOLUME || 0.7));
    tickSound.preload = 'auto';
    
    // Handle successful load
    tickSound.addEventListener('canplaythrough', () => {
      console.log('[Overlay] ✅ Tick sound effect ready to play');
    });
    
    // Handle loading errors gracefully
    tickSound.addEventListener('error', (e) => {
      console.error('[Overlay] ❌ Failed to load tick sound effect:', CONFIG.TICK_SOUND);
      console.error('[Overlay] Error details:', e);
      console.error('[Overlay] Make sure the file path is correct and the file exists');
      console.error('[Overlay] Tick sound will be disabled');
      tickSound = null;
    });
    
    console.log('[Overlay] Tick sound effect loading...');
  } else {
    console.log('[Overlay] Tick sound effect disabled (TICK_SOUND not set)');
  }
}

function playRedeemSound() {
  if (!redeemSound) {
    console.log('[Overlay] Sound not available (not loaded or disabled)');
    return;
  }
  
  try {
    // Reset to beginning and play
    redeemSound.currentTime = 0;
    const playPromise = redeemSound.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[Overlay] 🔊 Sound playing');
        })
        .catch((error) => {
          // Some browsers require user interaction before playing audio
          // This is expected behavior and not a real error
          console.warn('[Overlay] ⚠️ Sound play prevented:', error.message);
          console.warn('[Overlay] This is normal - browsers require user interaction before playing audio');
          console.warn('[Overlay] The sound will work after the user interacts with the page');
        });
    }
  } catch (error) {
    console.error('[Overlay] ❌ Error playing sound:', error);
  }
}

function playTickSound() {
  if (!tickSound) {
    return; // Silently fail for tick sound (don't log every second)
  }
  
  try {
    // Create a new Audio instance for each tick to ensure precise timing
    // This prevents overlapping sounds and ensures each tick plays on time
    const tick = new Audio(CONFIG.TICK_SOUND);
    tick.volume = Math.max(0, Math.min(1, CONFIG.SOUND_VOLUME || 0.7));
    
    // Play immediately - don't wait for load
    const playPromise = tick.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Silently handle errors for tick sound (don't spam console)
        // Some browsers require user interaction before playing audio
      });
    }
  } catch (error) {
    // Silently handle errors for tick sound
  }
}

// Apply CONFIG to CSS variables
document.documentElement.style.setProperty('--king-top', CONFIG.KING_TOP);
document.documentElement.style.setProperty('--king-left', CONFIG.KING_LEFT);
document.documentElement.style.setProperty('--queen-top', CONFIG.QUEEN_TOP);
document.documentElement.style.setProperty('--queen-right', CONFIG.QUEEN_RIGHT);
document.documentElement.style.setProperty('--avatar-size', CONFIG.AVATAR_SIZE);
document.documentElement.style.setProperty('--crown-height', CONFIG.CROWN_HEIGHT);
document.documentElement.style.setProperty('--tiara-height', CONFIG.TIARA_HEIGHT);
document.documentElement.style.setProperty('--name-font-size', CONFIG.NAME_FONT_SIZE);
document.documentElement.style.setProperty('--crown-margin-bottom', CONFIG.CROWN_MARGIN_BOTTOM);
document.documentElement.style.setProperty('--tiara-margin-bottom', CONFIG.TIARA_MARGIN_BOTTOM);

// Track previous state to detect changes
const previousState = {
  king: { show: null, name: null, image: null, color: null },
  queen: { show: null, name: null, image: null, color: null }
};

// Timer management - simplified with applyRedeem pattern
const timers = {
  king: { interval: null, timeLeft: 0, currentUser: null },
  queen: { interval: null, timeLeft: 0, currentUser: null }
};

// Track if panel was auto-hidden (to prevent immediate re-show)
const autoHidden = {
  king: false,
  queen: false
};

// ============================================
// Helper Functions
// ============================================
function rgb(c) {
  // Convert color object {r, g, b} to CSS rgb() string
  if (!c || typeof c !== 'object') {
    console.error('[Overlay] Invalid color object:', c);
    return null;
  }
  const r = parseInt(c.r) || 0;
  const g = parseInt(c.g) || 0;
  const b = parseInt(c.b) || 0;
  return `rgb(${r}, ${g}, ${b})`;
}

function updateGlowVariables(color) {
  // Extract RGB values for CSS variable usage in glow effects
  if (color && typeof color === 'object') {
    const r = parseInt(color.r) || 0;
    const g = parseInt(color.g) || 0;
    const b = parseInt(color.b) || 0;
    document.documentElement.style.setProperty('--glow-r', r);
    document.documentElement.style.setProperty('--glow-g', g);
    document.documentElement.style.setProperty('--glow-b', b);
  }
}

// ============================================
// Timer Functions
// ============================================
// Timer logic:
// 1. When triggered: Start timer at CONFIG.TIMER_DURATION
// 2. If SAME USER NAME redeems while timer running: Get remaining time + add CONFIG.TIMER_DURATION
// 3. If DIFFERENT USER redeems: Start fresh at CONFIG.TIMER_DURATION
function applyRedeem(role, timeAdd = CONFIG.TIMER_DURATION, userName = null) {
  const timer = timers[role];
  
  // Ensure timer object exists
  if (!timer) {
    timers[role] = { interval: null, timeLeft: 0, currentUser: null };
  }
  
  const isRunning = timers[role].interval !== null;
  // Exact username match (case-sensitive)
  const isSameUser = userName && timers[role].currentUser === userName;
  
  if (!isRunning) {
    // Timer not running - start fresh at set duration
    timers[role].timeLeft = timeAdd;
    timers[role].currentUser = userName; // Track current user
    timers[role].interval = startCountdown(role);
    console.log(`[Overlay] Timer started for ${role} - ${userName || 'unknown'} at ${timeAdd} seconds`);
  } else if (isSameUser) {
    // SAME USER: Get remaining time and add set duration
    const remainingTime = timers[role].timeLeft;
    timers[role].timeLeft = remainingTime + timeAdd;
    console.log(`[Overlay] Same user (${userName}) - remaining ${remainingTime}s + ${timeAdd}s = ${timers[role].timeLeft}s`);
    updateTimerDisplay(role);
  } else {
    // DIFFERENT USER: Start fresh at set duration
    timers[role].timeLeft = timeAdd;
    timers[role].currentUser = userName; // Update to new user
    console.log(`[Overlay] Different user (${userName}) - started fresh at ${timeAdd}s`);
    // Make sure timer is visible for real redeems
    const timerEl = document.getElementById(`${role}Timer`);
    timerEl.classList.remove('hidden');
    timerEl.style.display = 'block';
    updateTimerDisplay(role);
  }
}

function startCountdown(role, showTimer = true) {
  const timer = timers[role];
  if (!timer) return null;
  
  // Clear any existing timer
  if (timer.interval) {
    clearInterval(timer.interval);
  }
  
  const timerEl = document.getElementById(`${role}Timer`);
  if (showTimer) {
    timerEl.classList.remove('hidden');
    timerEl.style.display = 'block';
    updateTimerDisplay(role);
  } else {
    // Hide timer for initial auto-hide
    timerEl.classList.add('hidden');
    timerEl.style.display = 'none';
  }

  // Start countdown with precise timing
  // We want to tick exactly once when displaying each number: 5, 4, 3, 2, 1
  const updateTimer = () => {
    // If we're at 0, hide immediately (we showed 1 last time, now it's time to hide)
    if (timer.timeLeft === 0) {
      stopTimer(role);
      autoHidePanel(role);
      return;
    }
    
    // Update display with current value
    if (showTimer) {
      updateTimerDisplay(role);
    }
    
    // Tick if we're in the warning zone (at 5 or less, before decrementing)
    if (timer.timeLeft <= 5 && timer.timeLeft > 0) {
      playTickSound();
    }
    
    // Decrement after displaying and ticking
    timer.timeLeft--;
  };
  
  // Show initial value immediately (and tick if at 5)
  if (showTimer) {
    updateTimerDisplay(role);
    // Tick immediately if we're starting at 5 or less
    if (timer.timeLeft <= 5 && timer.timeLeft > 0) {
      playTickSound();
    }
  }
  
  // Start the interval - it fires after 1 second, then every second
  // This ensures: show 5 and tick (immediate), wait 1s, show 4 and tick, wait 1s, show 3 and tick, etc.
  const interval = setInterval(updateTimer, 1000);
  
  return interval;
}

function stopTimer(role) {
  const timer = timers[role];
  if (timer && timer.interval) {
    clearInterval(timer.interval);
    timer.interval = null;
    timer.currentUser = null; // Clear user tracking when timer stops
  }
  
  const timerEl = document.getElementById(`${role}Timer`);
  timerEl.classList.add('hidden');
  timerEl.style.display = 'none';
}

function updateTimerDisplay(role) {
  const timerEl = document.getElementById(`${role}Timer`);
  const timer = timers[role];
  
  if (!timer) return;
  
  // Update display with current time
  timerEl.textContent = timer.timeLeft;
  
  // Add warning class when timer is low (last 5 seconds)
  if (timer.timeLeft <= 5 && timer.timeLeft > 0) {
    timerEl.classList.add('warning');
    // Note: Tick sound is played in startCountdown interval for precise timing
  } else {
    timerEl.classList.remove('warning');
  }
  
  // Apply color from panel
  const panel = document.getElementById(`${role}Panel`);
  const color = window.getComputedStyle(panel).color;
  timerEl.style.color = color;
}

function autoHidePanel(role) {
  console.log(`[Overlay] Auto-hiding ${role} panel (timer expired)`);
  
  const panel = document.getElementById(`${role}Panel`);
  
  // Trigger hide animation
  panel.classList.remove('showing', 'floating', 'pulsing');
  panel.classList.add('hiding');
  
  // Update state and mark as auto-hidden
  previousState[role].show = false;
  autoHidden[role] = true;
  
  // Hide after animation completes
  setTimeout(() => {
    panel.classList.remove('hiding');
    panel.classList.add('hidden');
    panel.style.display = 'none';
  }, 700);
}

// ============================================
// Panel Update Functions
// ============================================
function updatePanel(role, data) {
  if (!data) {
    console.warn(`[Overlay] No data for ${role}`);
    return;
  }
  
  const panel = document.getElementById(`${role}Panel`);
  const glow = document.getElementById(`${role}Glow`);
  const nameEl = document.getElementById(`${role}Name`);
  const avatarEl = document.getElementById(`${role}Avatar`);
  
  const prev = previousState[role];
  const colorStr = data.color ? JSON.stringify(data.color) : null;
  
  // Auto-determine show state: show if name, image, or color exists
  const hasData = !!(data.name || data.image || data.color);
  
  // Check if data actually changed (name, image, or color)
  const nameChanged = prev.name !== data.name;
  const imageChanged = prev.image !== data.image;
  const colorChanged = prev.color !== colorStr;
  const dataChanged = nameChanged || imageChanged || colorChanged;
  
  // If panel was auto-hidden, only show again if data actually changed
  const show = hasData && (!autoHidden[role] || dataChanged);
  
  // Check if show state changed (handle null as false)
  const prevShow = prev.show === null ? false : prev.show;
  const showChanged = prevShow !== show;
  
  if (showChanged) {
    console.log(`[Overlay] ${role} show state changed: ${prev.show} -> ${show}`);
    
    if (show) {
      // Clear auto-hidden flag when showing (data must have changed)
      autoHidden[role] = false;
      // Show animation - swipe in
      panel.classList.remove('hidden', 'hiding', 'floating', 'pulsing');
      panel.classList.add('showing');
      panel.style.display = 'flex';
      
      // Remove showing class and smoothly transition to floating
      setTimeout(() => {
        panel.classList.remove('showing');
        if (role === 'king') {
          panel.style.transform = 'translateX(0) translateY(0) rotateZ(-2deg)';
        } else {
          panel.style.transform = 'translateX(0) translateY(0) rotateZ(1deg)';
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            panel.classList.add('floating');
          });
        });
      }, 800);
      
      prev.show = show;
      panel.dataset.showing = 'true';
      setTimeout(() => {
        panel.dataset.showing = 'false';
      }, 800);
    } else {
      // Hide animation - swipe out
      panel.classList.remove('showing', 'floating', 'pulsing');
      panel.classList.add('hiding');
      
      // Stop timer when hiding
      stopTimer(role);
      
      // Hide after animation completes
      setTimeout(() => {
        panel.classList.remove('hiding');
        panel.classList.add('hidden');
      }, 800);
      
      prev.show = show;
      return; // Don't update content when hiding
    }
  }
  
  // Update content when showing (during show animation)
  if (show && panel.classList.contains('showing')) {
    // Update content silently during show animation
    if (data.name) {
      nameEl.innerText = data.name;
      prev.name = data.name;
    }
    if (data.image) {
      avatarEl.src = data.image;
      avatarEl.style.display = 'block';
      prev.image = data.image;
    }
    if (data.color && typeof data.color === 'object') {
      const color = rgb(data.color);
      if (color) {
        panel.style.color = color;
        glow.style.color = color;
        nameEl.style.color = color;
        updateGlowVariables(data.color);
        prev.color = colorStr;
      }
    }
    return; // Don't trigger pulse during show animation
  }
  
  // Only update content if panel is visible (not hidden and not currently showing/hiding)
  if (!show || panel.classList.contains('showing') || panel.classList.contains('hiding')) {
    return;
  }
  
  // If panel is hidden but we have data, show it (only if data changed or not auto-hidden)
  if (show && (panel.classList.contains('hidden') || panel.style.display === 'none')) {
    if (autoHidden[role] && !dataChanged) {
      return; // Don't re-show if it was auto-hidden and data hasn't changed
    }
    
    autoHidden[role] = false;
    panel.classList.remove('hidden', 'hiding', 'floating', 'pulsing');
    panel.classList.add('showing');
    panel.style.display = 'flex';
    prev.show = show;
    
    // Update content during show animation
    if (data.name) {
      nameEl.innerText = data.name;
      prev.name = data.name;
    }
    if (data.image) {
      avatarEl.src = data.image;
      avatarEl.style.display = 'block';
      prev.image = data.image;
    }
    if (data.color && typeof data.color === 'object') {
      const color = rgb(data.color);
      if (color) {
        panel.style.color = color;
        glow.style.color = color;
        nameEl.style.color = color;
        updateGlowVariables(data.color);
        prev.color = colorStr;
      }
    }
    
    // Transition to floating after show animation
    setTimeout(() => {
      panel.classList.remove('showing');
      if (role === 'king') {
        panel.style.transform = 'translateX(0) translateY(0) rotateZ(-2deg)';
      } else {
        panel.style.transform = 'translateX(0) translateY(0) rotateZ(1deg)';
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panel.classList.add('floating');
        });
      });
    }, 800);
    
    panel.dataset.showing = 'true';
    setTimeout(() => {
      panel.dataset.showing = 'false';
    }, 800);
    
    return;
  }
  
  if (nameChanged || imageChanged || colorChanged) {
    // Only pulse if panel is fully visible (not during show animation)
    if (!panel.dataset.showing || panel.dataset.showing === 'false') {
      panel.classList.add('pulsing');
      setTimeout(() => {
        panel.classList.remove('pulsing');
      }, 500);
      
      console.log(`[Overlay] ${role} content changed - pulsing`);
    }
  }
  
  // Update name and avatar
  if (data.name) {
    nameEl.innerText = data.name;
    prev.name = data.name;
  }
  if (data.image) {
    avatarEl.src = data.image;
    avatarEl.style.display = 'block';
    prev.image = data.image;
  } else {
    avatarEl.style.display = 'none';
    prev.image = null;
  }

  // Apply color to glow and text
  if (data.color && typeof data.color === 'object') {
    const color = rgb(data.color);
    if (color) {
      panel.style.color = color;
      glow.style.color = color;
      nameEl.style.color = color;
      updateGlowVariables(data.color);
      prev.color = colorStr;
      
      // Update timer display color if timer is running
      if (timers[role] && timers[role].interval) {
        updateTimerDisplay(role);
      }
    }
  }
}

// ============================================
// WebSocket Message Handler
// ============================================
// This function is called when a message is received from StreamerBot
function handleWebSocketMessage(payload) {
  console.log('[Handler] Received message:', payload);
  
  // Handle the new message format: { type, user, image, color }
  if (payload.type === 'king_redeem' || payload.type === 'queen_redeem') {
    const role = payload.type === 'king_redeem' ? 'king' : 'queen';
    
    // Validate required fields
    if (!payload.user) {
      console.warn(`[Overlay] Received ${role} redeem message but missing 'user' field`);
      return;
    }
    
    // Play sound effect when someone redeems
    playRedeemSound();
    
    const data = {
      name: payload.user,
      image: payload.image || null,
      color: payload.color || null
    };
    
    // Apply redeem (adds time, creates timer, or restarts if same user)
    applyRedeem(role, CONFIG.TIMER_DURATION, payload.user);
    
    // Update panel with new data
    updatePanel(role, data);
    
    console.log(`[Overlay] Successfully processed ${role} redeem via WebSocket: ${payload.user} (+${CONFIG.TIMER_DURATION}s)`);
    return;
  }
  
  // Also handle legacy format: { king: {...}, queen: {...} }
  if (payload.king || payload.queen) {
    if (payload.king) {
      console.log('[Overlay] Processing legacy king format');
      updatePanel('king', payload.king);
    }
    if (payload.queen) {
      console.log('[Overlay] Processing legacy queen format');
      updatePanel('queen', payload.queen);
    }
    return;
  }
  
  // Unknown message format
  console.warn('[Overlay] Received WebSocket message with unknown format:', payload);
}

// ============================================
// Initialization
// ============================================
function init() {
  console.log('[Init] King & Queen Overlay starting...');
  
  // Get DOM elements
  const kingNameEl = document.getElementById('kingName');
  const queenNameEl = document.getElementById('queenName');
  const kingAvatarEl = document.getElementById('kingAvatar');
  const queenAvatarEl = document.getElementById('queenAvatar');
  const kingPanel = document.getElementById('kingPanel');
  const queenPanel = document.getElementById('queenPanel');
  const kingGlow = document.getElementById('kingGlow');
  const queenGlow = document.getElementById('queenGlow');
  
  // Set default text
  kingNameEl.innerText = 'Stream King';
  queenNameEl.innerText = 'Stream Queen';
  
  // Set default white color for text, panels, and glows
  kingNameEl.style.color = 'white';
  queenNameEl.style.color = 'white';
  kingPanel.style.color = 'white';
  queenPanel.style.color = 'white';
  kingGlow.style.color = 'white';
  queenGlow.style.color = 'white';
  
  // Hide avatars initially
  kingAvatarEl.style.display = 'none';
  queenAvatarEl.style.display = 'none';
  
  // Always start visible with defaults, then auto-hide after timer
  kingPanel.style.display = 'flex';
  queenPanel.style.display = 'flex';
  previousState.king.name = 'Stream King';
  previousState.king.show = true;
  previousState.queen.name = 'Stream Queen';
  previousState.queen.show = true;
  
  // Add floating animation immediately
  kingPanel.classList.add('floating');
  queenPanel.classList.add('floating');
  
  // Start timers that will auto-hide the panels after CONFIG.STARTUP_HIDE_DURATION
  // This makes them appear and then disappear naturally, preventing the flash
  // Don't show timer display for initial auto-hide (showTimer = false)
  setTimeout(() => {
    // Start countdown timers for both panels (without showing timer display)
    // Use STARTUP_HIDE_DURATION instead of TIMER_DURATION for initial hide
    timers.king.timeLeft = CONFIG.STARTUP_HIDE_DURATION;
    timers.king.interval = startCountdown('king', false);
    timers.queen.timeLeft = CONFIG.STARTUP_HIDE_DURATION;
    timers.queen.interval = startCountdown('queen', false);
  }, 100); // Small delay to ensure DOM is ready
  
  // Initialize debug DOM visibility based on CONFIG
  const messageLog = document.getElementById('messageLog');
  if (messageLog) {
    if (CONFIG.DEBUG_ENABLED) {
      messageLog.classList.add('visible');
      messageLog.classList.remove('hidden');
    } else {
      messageLog.classList.add('hidden');
      messageLog.classList.remove('visible');
    }
  }
  
  if (typeof logMessage === 'function') {
    logMessage('King & Queen Overlay initialized', 'success');
  }
  
  // Initialize sound effects
  initSound();
  
  // Connect to Streamer.bot via shared tools/streamerbot-websocket.js
  if (typeof connectWebSocket === 'function') {
    connectWebSocket({
      WS_ENABLED: CONFIG.WS_ENABLED,
      WS_URL: CONFIG.WS_URL,
      OVERLAY_ID: CONFIG.OVERLAY_ID,
      RECEIVER_ACTION_ID: CONFIG.RECEIVER_ACTION_ID || ''
    }, handleWebSocketMessage, {
      onStatus: updateStatusContainer,
      onLog: logMessage
    });
  } else {
    console.error('[Init] WebSocket module not loaded! Make sure ../../../tools/streamerbot-websocket.js is loaded before script.js');
  }
}

// Start when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
