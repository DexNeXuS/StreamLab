// ============================================
// URL parameter overrides for King & Queen
// ============================================
// Add ?key=value to the overlay URL to override config without editing config.js.
// Example: index.html?ws_url=ws://127.0.0.1:8080&timer_duration=30&debug_enabled=true
// Param names are lowercase; use 1/true/yes for true, 0/false/no for false.

(function () {
  if (typeof CONFIG === 'undefined') return;
  var params = new URLSearchParams(window.location.search);

  function str(key) {
    var v = params.get(key);
    return v !== null ? String(v) : null;
  }
  function num(key) {
    var v = params.get(key);
    if (v === null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function bool(key) {
    var v = params.get(key);
    if (v === null) return null;
    var lower = String(v).toLowerCase();
    if (lower === '1' || lower === 'true' || lower === 'yes') return true;
    if (lower === '0' || lower === 'false' || lower === 'no' || lower === '') return false;
    return null;
  }

  if (str('ws_url') !== null) CONFIG.WS_URL = str('ws_url');
  if (bool('ws_enabled') !== null) CONFIG.WS_ENABLED = bool('ws_enabled');
  if (str('overlay_id') !== null) CONFIG.OVERLAY_ID = str('overlay_id');
  if (str('receiver_action_id') !== null) CONFIG.RECEIVER_ACTION_ID = str('receiver_action_id');
  if (bool('debug_enabled') !== null) CONFIG.DEBUG_ENABLED = bool('debug_enabled');

  if (str('king_top') !== null) CONFIG.KING_TOP = str('king_top');
  if (str('king_left') !== null) CONFIG.KING_LEFT = str('king_left');
  if (str('queen_top') !== null) CONFIG.QUEEN_TOP = str('queen_top');
  if (str('queen_right') !== null) CONFIG.QUEEN_RIGHT = str('queen_right');

  if (str('avatar_size') !== null) CONFIG.AVATAR_SIZE = str('avatar_size');
  if (str('crown_height') !== null) CONFIG.CROWN_HEIGHT = str('crown_height');
  if (str('tiara_height') !== null) CONFIG.TIARA_HEIGHT = str('tiara_height');
  if (str('name_font_size') !== null) CONFIG.NAME_FONT_SIZE = str('name_font_size');

  if (num('timer_duration') !== null) CONFIG.TIMER_DURATION = Math.max(0, num('timer_duration'));
  if (num('startup_hide_duration') !== null) CONFIG.STARTUP_HIDE_DURATION = Math.max(0, num('startup_hide_duration'));

  if (str('redeem_sound') !== null) CONFIG.REDEEM_SOUND = str('redeem_sound');
  if (str('tick_sound') !== null) CONFIG.TICK_SOUND = str('tick_sound');
  if (num('sound_volume') !== null) CONFIG.SOUND_VOLUME = Math.max(0, Math.min(1, num('sound_volume')));
})();
