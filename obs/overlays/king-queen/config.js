// ============================================
// CONFIGURATION FILE - King & Queen Overlay
// ============================================
// This file contains all the settings for your King & Queen overlay.
// Simply edit the values below to customize the overlay's behavior.
//
// IMPORTANT: This file must be loaded BEFORE websocket.js and script.js
// ============================================

const CONFIG = {
    // ============================================
    // WebSocket Configuration
    // ============================================
    // These settings control the connection to StreamerBot's WebSocket server
    
    // Enable/Disable WebSocket Connection
    // Set to false to disable WebSocket (useful for testing without StreamerBot)
    WS_ENABLED: true,
    
    // StreamerBot WebSocket Server URL
    // Default: 'ws://127.0.0.1:8080'
    // 
    // How to find your WebSocket URL:
    // 1. Open StreamerBot
    // 2. Go to Settings > WebSocket Server
    // 3. Check the port number (default is 8080)
    // 4. Make sure WebSocket server is ENABLED
    //
    // Format: 'ws://127.0.0.1:PORT' (for localhost)
    // Example: 'ws://127.0.0.1:8080'
    WS_URL: 'ws://127.0.0.1:8080',
    
    // ============================================
    // Overlay ID (Unique Widget Identifier)
    // ============================================
    // This is a unique identifier for your overlay
    // Used when subscribing to StreamerBot events
    //
    // Best practices:
    // - Use lowercase letters, numbers, and hyphens
    // - Make it descriptive (e.g., 'king-queen-overlay')
    // - Keep it unique if you have multiple overlays
    //
    // Example: 'king-queen-overlay'
    OVERLAY_ID: 'king-queen-overlay',
    
    // ============================================
    // StreamerBot Action ID (For Sending Messages Back)
    // ============================================
    // This is used to send messages FROM the overlay TO StreamerBot
    // 
    // HOW TO GET YOUR ACTION ID:
    // 1. Create a new Action in StreamerBot (or use an existing one)
    // 2. Right-click the action in StreamerBot
    // 3. Click "Copy ID"
    // 4. Paste the ID here (it looks like: '6c00f131-30f5-4991-8e1a-eafdb5f497c8')
    //
    // WHAT THIS ACTION DOES:
    // - When you call sendToStreamerBot() in your code, it will execute this action
    // - The data you send will be available in the action's args
    // - Your C# script can access the data via args["type"], args["data"], etc.
    //
    // OPTIONAL:
    // - Leave empty ('') if you don't need to send messages back to StreamerBot
    // - Only needed for two-way communication (overlay → StreamerBot)
    //
    // Example: '6c00f131-30f5-4991-8e1a-eafdb5f497c8'
    RECEIVER_ACTION_ID: '',
    
    // ============================================
    // Debug Console Settings
    // ============================================
    // Controls the on-screen debug message log
    
    // Enable/Disable Debug Console
    // true = Show debug messages on screen (useful for development)
    // false = Hide debug messages (cleaner for production/streaming)
    //
    // When enabled:
    // - Shows connection status (CONNECTED/DISCONNECTED)
    // - Displays message log with all received messages
    // - Useful for troubleshooting WebSocket issues
    //
    // When disabled:
    // - Hides all debug UI elements
    // - Messages still logged to browser console (F12)
    DEBUG_ENABLED: false,
    
    // ============================================
    // Panel Position Settings
    // ============================================
    // King Panel Position (from top-left corner)
    KING_TOP: '50px',
    KING_LEFT: '50px',
    
    // Queen Panel Position (from top-right corner)
    QUEEN_TOP: '50px',
    QUEEN_RIGHT: '50px',
    
    // ============================================
    // Visual Settings
    // ============================================
    // Avatar Size (circular)
    AVATAR_SIZE: '75px',
    
    // Crown/Tiara Size
    CROWN_HEIGHT: '75px',
    TIARA_HEIGHT: '75px',
    
    // Name Text Size
    NAME_FONT_SIZE: '20px',
    
    // Crown/Tiara spacing from avatar (negative = closer)
    CROWN_MARGIN_BOTTOM: '-10px',
    TIARA_MARGIN_BOTTOM: '-15px',
    
    // ============================================
    // Timer Settings
    // ============================================
    // Timer Duration (how long panels stay visible before auto-hiding)
    TIMER_DURATION: 60, // seconds
    
    // Startup Hide Duration (how long panels stay visible on initial page load before auto-hiding)
    // This prevents the flash when the page first loads
    // Set to 0 to hide immediately, or a higher value to keep them visible longer
    STARTUP_HIDE_DURATION: 5, // seconds
    
    // ============================================
    // Sound Effects
    // ============================================
    // Sound effect to play when someone redeems king or queen
    // Set to empty string ('') to disable sound
    // 
    // You can use either:
    // - Local file path: 'sounds/redeem.mp3' or 'redeem.wav'
    // - Direct URL: 'https://cdn.pixabay.com/download/audio/.../6185.mp3'
    //
    // To get the direct URL from Pixabay:
    // 1. Go to the sound page on Pixabay
    // 2. Click the download button
    // 3. Right-click the download button and "Copy link address"
    // 4. Or download the file and place it in your project folder
    //
    // Example: 'sounds/redeem.mp3' or 'https://cdn.pixabay.com/.../6185.mp3'
     REDEEM_SOUND: 'sounds/trumpet.mp3', // Path or URL to sound file (leave empty to disable)
    
    // Tick sound effect to play when timer is getting close to end (5 seconds or less)
    // Set to empty string ('') to disable tick sound
    // Example: 'sounds/tick.mp3'
    TICK_SOUND: 'sounds/tick.mp3', // Path or URL to tick sound file (leave empty to disable)
    
    // Sound volume (0.0 to 1.0)
    // 0.0 = silent, 1.0 = full volume
    SOUND_VOLUME: 0.7, // 0.0 to 1.0
    
    // ============================================
    // Panel Initial State
    // ============================================
    // Note: Panels always start visible with default values and auto-hide after STARTUP_HIDE_DURATION
    // (This setting is kept for backwards compatibility but is no longer used)
    START_HIDDEN: false
};
