// ============================================
// Shared Streamer.bot WebSocket connector
// ============================================
// Used by OBS overlays (king-queen, rocksmith, etc.) to connect to the user's
// Streamer.bot WebSocket. When the site is hosted (e.g. GitHub Pages), the
// overlay runs in the user's OBS browser source, so ws://127.0.0.1:8080
// connects to their local Streamer.bot.
//
// Outbound (Streamer.bot → overlay): Subscribe to General.Custom; receive
// messages sent via CPH.WebsocketBroadcastJson().
// Inbound (overlay → Streamer.bot): Optional DoAction to run an action with args.
// ============================================

(function (global) {
  'use strict';

  var ws = null;
  var reconnectAttempts = 0;
  var messageCallback = null;
  var lastConfig = null;

  var MAX_RECONNECT_ATTEMPTS = 12;
  var RECONNECT_BASE_MS = 2500;
  var RECONNECT_MAX_MS = 30000;
  var DOACTION_CLOSE_MS = 200;

  function getStateName(state) {
    var states = { 0: 'CONNECTING', 1: 'OPEN', 2: 'CLOSING', 3: 'CLOSED' };
    return states[state] || 'UNKNOWN (' + state + ')';
  }

  function parsePayload(data) {
    if (data == null) return null;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return data;
  }

  function connect(config, onMessage, options) {
    options = options || {};
    var onStatus = options.onStatus || null;
    var onLog = options.onLog || null;

    messageCallback = typeof onMessage === 'function' ? onMessage : null;
    lastConfig = config;

    if (!config || !config.WS_ENABLED) {
      if (onStatus) onStatus('DISABLED');
      return;
    }

    if (onStatus) onStatus('CONNECTING');

    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      ws = new WebSocket(config.WS_URL);

      ws.addEventListener('open', function () {
        reconnectAttempts = 0;
        if (onStatus) onStatus('CONNECTED');
        if (onLog) onLog('Connected to ' + config.WS_URL, 'info');

        var subscribeRequest = {
          request: 'Subscribe',
          id: config.OVERLAY_ID || 'overlay',
          events: { General: ['Custom'] }
        };
        ws.send(JSON.stringify(subscribeRequest));
      });

      ws.addEventListener('message', function (event) {
        try {
          var envelope = JSON.parse(event.data);

          if (envelope && (envelope.status === 'ok' || envelope.status === 'error')) {
            return;
          }

          var isCustom =
            (envelope.event &&
              typeof envelope.event === 'object' &&
              envelope.event.type === 'Custom' &&
              envelope.event.source === 'General') ||
            envelope.event === 'Custom';

          if (isCustom && envelope.data != null) {
            var payload = parsePayload(envelope.data);
            if (payload && messageCallback) messageCallback(payload);
            return;
          }

          if (envelope.event === 'broadcast' && envelope.data != null) {
            var payload = parsePayload(envelope.data);
            if (payload && messageCallback) messageCallback(payload);
          }
        } catch (err) {
          if (onLog) onLog('Parse error: ' + (err.message || err), 'error');
        }
      });

      ws.addEventListener('error', function (err) {
        if (onStatus) onStatus('ERROR');
        if (onLog) onLog('WebSocket error: ' + getStateName(ws ? ws.readyState : -1), 'error');
      });

      ws.addEventListener('close', function (event) {
        if (onStatus) onStatus('DISCONNECTED');
        if (!event.wasClean) {
          attemptReconnect(config, onMessage, options);
        }
      });
    } catch (err) {
      if (onStatus) onStatus('ERROR');
      if (onLog) onLog('Connect failed: ' + (err.message || err), 'error');
      attemptReconnect(config, onMessage, options);
    }
  }

  function attemptReconnect(config, onMessage, options) {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    reconnectAttempts++;
    var delay = Math.min(RECONNECT_BASE_MS * reconnectAttempts, RECONNECT_MAX_MS);
    if (options && options.onLog) {
      options.onLog('Reconnecting in ' + delay + 'ms (attempt ' + reconnectAttempts + '/' + MAX_RECONNECT_ATTEMPTS + ')', 'warning');
    }
    setTimeout(function () {
      connect(config, messageCallback, options);
    }, delay);
  }

  function isConnected() {
    return ws && ws.readyState === WebSocket.OPEN;
  }

  function sendToStreamerBot(data) {
    var actionId = (lastConfig && lastConfig.RECEIVER_ACTION_ID) ||
      (typeof CONFIG !== 'undefined' && CONFIG.RECEIVER_ACTION_ID) ||
      '';
    if (!actionId || String(actionId).trim() === '') {
      return false;
    }
    return sendDoAction(data, actionId);
  }

  function sendDoAction(data, actionId) {
    var url = (lastConfig && lastConfig.WS_URL) ||
      (typeof CONFIG !== 'undefined' && CONFIG.WS_URL) ||
      'ws://127.0.0.1:8080';
    if (!actionId || String(actionId).trim() === '') return false;
    try {
      var temp = new WebSocket(url);
      temp.addEventListener('open', function () {
        var req = {
          request: 'DoAction',
          id: 'overlay-doaction',
          action: { id: actionId },
          args: data
        };
        temp.send(JSON.stringify(req));
        setTimeout(function () { temp.close(); }, DOACTION_CLOSE_MS);
      });
      temp.addEventListener('error', function () {});
      return true;
    } catch (err) {
      return false;
    }
  }

  var api = {
    connect: connect,
    isConnected: isConnected,
    sendToStreamerBot: sendToStreamerBot,
    sendDoAction: sendDoAction
  };

  if (global.StreamerBotWS) {
    return;
  }
  global.StreamerBotWS = api;

  global.connectWebSocket = function (config, onMessage, options) {
    connect(config, onMessage, options);
  };
  global.isWebSocketConnected = isConnected;
  global.sendToStreamerBot = sendToStreamerBot;

  global.sbConnect = function (config, onMessage, options) {
    connect(config, onMessage, options);
  };
  global.sbIsConnected = isConnected;
  global.sbSendToStreamerBotDoAction = function (data, actionId) {
    return sendDoAction(data, actionId || (lastConfig && lastConfig.RECEIVER_ACTION_ID) || (typeof CONFIG !== 'undefined' && CONFIG.RECEIVER_ACTION_ID) || '');
  };

  global.testSendToStreamerBot = function () {
    var testData = { type: 'test_message', message: 'Test from overlay', timestamp: new Date().toISOString() };
    return sendToStreamerBot(testData);
  };
})(typeof window !== 'undefined' ? window : this);
