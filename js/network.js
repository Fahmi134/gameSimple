(function (global) {
  "use strict";

  const LOCAL_CHANNEL_NAME = "politala_social_world_v1";

  function isFirebaseConfigured(cfg) {
    if (!cfg || !cfg.firebaseConfig) return false;
    const fc = cfg.firebaseConfig;
    if (!fc.apiKey || !fc.databaseURL || !fc.projectId) return false;
    if (fc.apiKey.includes("YOUR_") || fc.databaseURL.includes("YOUR_") || fc.projectId.includes("YOUR_")) {
      return false;
    }
    return true;
  }

  function sanitizeRoom(room) {
    const clean = (room || "kampus-utama").toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return clean.slice(0, 24) || "kampus-utama";
  }

  class NetworkManager {
    constructor(callbacks) {
      this.cb = callbacks;
      this.mode = "local"; // "firebase" | "local"
      this.room = this.resolveRoom();
      this.playerId = "local-" + Math.random().toString(36).slice(2, 9);
      this.joined = false;

      this.localChannel = null;
      this.db = null;
      this.playersRef = null;
      this.chatRef = null;
      this.myPlayerRef = null;
      this.connectedRef = null;

      this.lastSentAt = 0;
      this.lastSentPayload = "";
      this.joinedAtMs = 0;
      this.remotePlayers = new Map();
    }

    resolveRoom() {
      try {
        const params = new URLSearchParams(global.location.search);
        const fromUrl = params.get("room");
        if (fromUrl) return sanitizeRoom(fromUrl);
      } catch (_) {}
      const cfg = global.POLITALA_FIREBASE_CONFIG;
      return sanitizeRoom(cfg && cfg.defaultRoom);
    }

    async connect(profile) {
      const cfg = global.POLITALA_FIREBASE_CONFIG;
      if (isFirebaseConfigured(cfg) && global.firebase && global.firebase.auth && global.firebase.database) {
        try {
          await this.connectFirebase(cfg.firebaseConfig, profile);
          return { mode: "firebase", room: this.room, playerId: this.playerId };
        } catch (err) {
          console.warn("Firebase gagal terhubung, beralih ke mode lokal:", err);
          if (this.cb.onSystem) {
            this.cb.onSystem("Gagal terhubung ke Firebase (" + (err.message || "cek config/rules") + "). Memakai mode lokal.");
          }
        }
      }

      this.connectLocal(profile);
      return { mode: "local", room: this.room, playerId: this.playerId };
    }

    async connectFirebase(firebaseConfig, profile) {
      if (!global.firebase.apps || global.firebase.apps.length === 0) {
        global.firebase.initializeApp(firebaseConfig);
      }
      const auth = global.firebase.auth();
      if (!auth.currentUser) {
        await auth.signInAnonymously();
      }
      const uid = auth.currentUser && auth.currentUser.uid;
      if (!uid) throw new Error("UID anonim tidak tersedia");

      this.mode = "firebase";
      this.playerId = uid;
      this.joined = true;
      this.joinedAtMs = Date.now();
      this.remotePlayers.clear();

      this.db = global.firebase.database();
      this.playersRef = this.db.ref(`rooms/${this.room}/players`);
      this.chatRef = this.db.ref(`rooms/${this.room}/chat`);
      this.myPlayerRef = this.playersRef.child(uid);
      this.connectedRef = this.db.ref(".info/connected");

      // Presence & auto cleanup on tab close / disconnect
      this.connectedRef.on("value", (snap) => {
        if (snap.val() === true && this.joined && this.myPlayerRef) {
          this.myPlayerRef.onDisconnect().remove().catch(() => {});
          this.sendState(profile, true);
        }
      });

      // Listen to other players
      this.playersRef.on("child_added", (snap) => this.handleFirebasePlayer(snap));
      this.playersRef.on("child_changed", (snap) => this.handleFirebasePlayer(snap));
      this.playersRef.on("child_removed", (snap) => {
        const id = snap.key;
        if (id && id !== this.playerId) {
          this.remotePlayers.delete(id);
        }
      });

      // Listen to recent chat
      this.chatRef.limitToLast(20).on("child_added", (snap) => {
        const msg = snap.val();
        if (!msg || msg.uid === this.playerId) return;
        if (msg.ts && msg.ts < this.joinedAtMs - 15000) return;
        if (this.cb.onChat) {
          this.cb.onChat(`${msg.name} (${msg.prodi})`, msg.text, msg.color || "#38bdf8");
        }
      });

      this.sendState(profile, true);
    }

    handleFirebasePlayer(snap) {
      const id = snap.key;
      const val = snap.val();
      if (!id || !val || id === this.playerId) return;

      const existing = this.remotePlayers.get(id);
      if (existing) {
        existing.name = val.name;
        existing.prodi = val.prodi;
        existing.color = val.color;
        existing.style = val.style;
        existing.targetX = Number(val.x) || existing.x;
        existing.targetY = Number(val.y) || existing.y;
        existing.moving = Boolean(val.moving);
        existing.emote = val.emote || null;
        existing.emoteUntil = Number(val.emoteUntil) || 0;
        existing.bubble = val.bubble || null;
        existing.bubbleUntil = Number(val.bubbleUntil) || 0;
        existing.lastSeen = performance.now();
      } else {
        const x = Number(val.x) || 22;
        const y = Number(val.y) || 37.8;
        this.remotePlayers.set(id, {
          id,
          name: val.name || "Mahasiswa",
          prodi: val.prodi || "Politala",
          color: val.color || "#38bdf8",
          style: val.style || "casual",
          x,
          y,
          targetX: x,
          targetY: y,
          moving: Boolean(val.moving),
          emote: val.emote || null,
          emoteUntil: Number(val.emoteUntil) || 0,
          bubble: val.bubble || null,
          bubbleUntil: Number(val.bubbleUntil) || 0,
          lastSeen: performance.now()
        });
      }
    }

    connectLocal(profile) {
      this.mode = "local";
      this.joined = true;
      this.remotePlayers.clear();

      if (!("BroadcastChannel" in global)) return;
      if (this.localChannel) {
        try { this.localChannel.close(); } catch (_) {}
      }
      try {
        this.localChannel = new BroadcastChannel(LOCAL_CHANNEL_NAME + "_" + this.room);
        this.localChannel.onmessage = (ev) => {
          const msg = ev.data;
          if (!msg || msg.senderId === this.playerId) return;

          if (msg.type === "state") {
            const existing = this.remotePlayers.get(msg.senderId);
            if (existing) {
              existing.name = msg.name;
              existing.prodi = msg.prodi;
              existing.color = msg.color;
              existing.style = msg.style;
              existing.targetX = msg.x;
              existing.targetY = msg.y;
              existing.moving = msg.moving;
              existing.emote = msg.emote;
              existing.emoteUntil = msg.emoteUntil;
              existing.bubble = msg.bubble;
              existing.bubbleUntil = msg.bubbleUntil;
              existing.lastSeen = performance.now();
            } else {
              this.remotePlayers.set(msg.senderId, {
                id: msg.senderId,
                name: msg.name,
                prodi: msg.prodi,
                color: msg.color,
                style: msg.style,
                x: msg.x,
                y: msg.y,
                targetX: msg.x,
                targetY: msg.y,
                moving: msg.moving,
                emote: msg.emote,
                emoteUntil: msg.emoteUntil,
                bubble: msg.bubble,
                bubbleUntil: msg.bubbleUntil,
                lastSeen: performance.now()
              });
            }
          } else if (msg.type === "chat") {
            if (this.cb.onChat) {
              this.cb.onChat(`${msg.name} (${msg.prodi})`, msg.text, msg.color);
            }
          } else if (msg.type === "leave") {
            this.remotePlayers.delete(msg.senderId);
          }
        };
        this.sendState(profile, true);
      } catch (_) {
        this.localChannel = null;
      }
    }

    sendState(player, force = false) {
      if (!this.joined) return;
      const now = performance.now();
      const throttleMs = this.mode === "firebase" ? 120 : 80;
      if (!force && now - this.lastSentAt < throttleMs) return;

      // Convert remaining emote/bubble durations to unix epoch seconds for cross-device sync
      const nowSec = now * 0.001;
      const epochSec = Date.now() * 0.001;
      const emoteRem = player.emote && player.emoteUntil > nowSec ? player.emoteUntil - nowSec : 0;
      const bubbleRem = player.bubble && player.bubbleUntil > nowSec ? player.bubbleUntil - nowSec : 0;

      const payload = {
        name: player.name,
        prodi: player.prodi,
        color: player.color,
        style: player.style,
        x: Math.round(player.x * 100) / 100,
        y: Math.round(player.y * 100) / 100,
        moving: Boolean(player.moving),
        emote: emoteRem > 0 ? player.emote : null,
        emoteUntil: emoteRem > 0 ? Math.round((epochSec + emoteRem) * 10) / 10 : 0,
        bubble: bubbleRem > 0 ? player.bubble : null,
        bubbleUntil: bubbleRem > 0 ? Math.round((epochSec + bubbleRem) * 10) / 10 : 0
      };

      const sig = JSON.stringify(payload);
      if (!force && sig === this.lastSentPayload) return;
      this.lastSentAt = now;
      this.lastSentPayload = sig;

      if (this.mode === "firebase" && this.myPlayerRef) {
        this.myPlayerRef.set({
          ...payload,
          updatedAt: global.firebase.database.ServerValue.TIMESTAMP
        }).catch(() => {});
      } else if (this.localChannel) {
        this.localChannel.postMessage({
          type: "state",
          senderId: this.playerId,
          ...payload,
          // Keep local performance-based timestamps for same-machine BroadcastChannel
          emoteUntil: emoteRem > 0 ? nowSec + emoteRem : 0,
          bubbleUntil: bubbleRem > 0 ? nowSec + bubbleRem : 0
        });
      }
    }

    sendChat(player, text) {
      if (!this.joined) return;
      if (this.mode === "firebase" && this.chatRef) {
        this.chatRef.push({
          uid: this.playerId,
          name: player.name,
          prodi: player.prodi,
          color: player.color,
          text,
          ts: global.firebase.database.ServerValue.TIMESTAMP
        }).catch(() => {});
      } else if (this.localChannel) {
        this.localChannel.postMessage({
          type: "chat",
          senderId: this.playerId,
          name: player.name,
          prodi: player.prodi,
          color: player.color,
          text
        });
      }
    }

    disconnect() {
      this.joined = false;
      if (this.mode === "firebase") {
        if (this.myPlayerRef) this.myPlayerRef.remove().catch(() => {});
        if (this.connectedRef) this.connectedRef.off();
        if (this.playersRef) this.playersRef.off();
        if (this.chatRef) this.chatRef.off();
      } else if (this.localChannel) {
        this.localChannel.postMessage({ type: "leave", senderId: this.playerId });
        try { this.localChannel.close(); } catch (_) {}
        this.localChannel = null;
      }
      this.remotePlayers.clear();
    }

    stepRemoteInterpolation(dt) {
      const nowMs = performance.now();
      const list = [];
      const alpha = Math.min(1, dt * 10);
      for (const [id, rp] of this.remotePlayers.entries()) {
        if (this.mode === "local" && nowMs - rp.lastSeen > 4500) {
          this.remotePlayers.delete(id);
          continue;
        }
        rp.x += (rp.targetX - rp.x) * alpha;
        rp.y += (rp.targetY - rp.y) * alpha;

        // Convert firebase unix-epoch emoteUntil/bubbleUntil to local performance clock scale for renderer
        if (this.mode === "firebase") {
          const epochSec = Date.now() * 0.001;
          const nowSec = nowMs * 0.001;
          const viewCopy = {
            ...rp,
            emoteUntil: rp.emoteUntil > epochSec ? nowSec + (rp.emoteUntil - epochSec) : 0,
            bubbleUntil: rp.bubbleUntil > epochSec ? nowSec + (rp.bubbleUntil - epochSec) : 0
          };
          list.push(viewCopy);
        } else {
          list.push(rp);
        }
      }
      return list;
    }
  }

  global.PolitalaNetwork = NetworkManager;
})(window);
