(function (global) {
  "use strict";

  const Data = global.PolitalaData;
  const Audio = global.PolitalaAudio;
  const RendererClass = global.PolitalaRenderer;
  const NetworkClass = global.PolitalaNetwork;

  const STORAGE_KEY = "politala_social_profile_v1";

  const canvas = document.getElementById("gameCanvas");
  const minimapCanvas = document.getElementById("minimapCanvas");
  const renderer = new RendererClass(canvas, minimapCanvas, Data);

  // DOM Elements
  const loginOverlay = document.getElementById("loginOverlay");
  const loginForm = document.getElementById("loginForm");
  const enterCampusBtn = document.getElementById("enterCampusBtn");
  const playerNameInput = document.getElementById("playerName");
  const playerProdiSelect = document.getElementById("playerProdi");
  const outfitSwatches = document.getElementById("outfitSwatches");
  const styleButtons = document.getElementById("styleButtons");
  const igFollowBtn = document.getElementById("igFollowBtn");
  const igConfirmCheck = document.getElementById("igConfirmCheck");
  const loginError = document.getElementById("loginError");

  const hud = document.getElementById("hud");
  const currentZoneName = document.getElementById("currentZoneName");
  const currentZoneDesc = document.getElementById("currentZoneDesc");
  const onlineCountEl = document.getElementById("onlineCount");
  const chatChannelTag = document.getElementById("chatChannelTag");
  const landmarkPrompt = document.getElementById("landmarkPrompt");
  const landmarkBadge = document.getElementById("landmarkBadge");
  const landmarkTitle = document.getElementById("landmarkTitle");
  const landmarkText = document.getElementById("landmarkText");

  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  const mapModal = document.getElementById("mapModal");
  const teleportGrid = document.getElementById("teleportGrid");
  const infoModal = document.getElementById("infoModal");
  const infoTitle = document.getElementById("infoTitle");
  const infoDesc = document.getElementById("infoDesc");
  const infoMeta = document.getElementById("infoMeta");

  const btnMap = document.getElementById("btnMap");
  const btnTime = document.getElementById("btnTime");
  const btnSound = document.getElementById("btnSound");
  const btnLogout = document.getElementById("btnLogout");
  const btnZoomIn = document.getElementById("btnZoomIn");
  const btnZoomOut = document.getElementById("btnZoomOut");
  const btnInspectLandmark = document.getElementById("btnInspectLandmark");
  const btnAskNpc = document.getElementById("btnAskNpc");

  // State
  let selectedColor = Data.OUTFIT_COLORS[0].hex;
  let selectedStyle = Data.AVATAR_STYLES[0].id;
  let joined = false;
  let activeInspectBuilding = null;

  const keys = Object.create(null);

  const state = {
    player: {
      id: "local-init",
      name: "Mahasiswa_Politala",
      prodi: "D3 Teknologi Informasi",
      color: selectedColor,
      style: selectedStyle,
      x: 22,
      y: 37.8,
      moving: false,
      emote: null,
      emoteUntil: 0,
      bubble: null,
      bubbleUntil: 0
    },
    npcs: Data.NPCS.map((n, idx) => ({
      ...n,
      x: n.home.x,
      y: n.home.y,
      patrolIndex: 0,
      waitUntil: 1 + idx * 0.7,
      moving: false,
      emote: null,
      emoteUntil: 0,
      bubble: null,
      bubbleUntil: 0
    })),
    remotePlayers: [],
    clickTarget: null,
    nearbyBuilding: null
  };

  const network = new NetworkClass({
    onChat: (sender, text, color) => {
      addChatMessage(sender, text, color);
      Audio.playChat();
    },
    onSystem: (text) => addSystemMessage(text)
  });

  state.player.id = network.playerId;

  function setupCustomizationUI() {
    outfitSwatches.innerHTML = "";
    for (const c of Data.OUTFIT_COLORS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch-btn" + (c.hex === selectedColor ? " active" : "");
      btn.style.background = c.hex;
      btn.title = c.name;
      btn.addEventListener("click", () => {
        selectedColor = c.hex;
        for (const el of outfitSwatches.children) el.classList.remove("active");
        btn.classList.add("active");
      });
      outfitSwatches.appendChild(btn);
    }

    styleButtons.innerHTML = "";
    for (const s of Data.AVATAR_STYLES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "style-pill" + (s.id === selectedStyle ? " active" : "");
      btn.textContent = s.label;
      btn.addEventListener("click", () => {
        selectedStyle = s.id;
        for (const el of styleButtons.children) el.classList.remove("active");
        btn.classList.add("active");
      });
      styleButtons.appendChild(btn);
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.name) playerNameInput.value = saved.name;
        if (saved.prodi) playerProdiSelect.value = saved.prodi;
        if (saved.color) {
          selectedColor = saved.color;
          Array.from(outfitSwatches.children).forEach((el, idx) => {
            el.classList.toggle("active", Data.OUTFIT_COLORS[idx].hex === selectedColor);
          });
        }
        if (saved.style) {
          selectedStyle = saved.style;
          Array.from(styleButtons.children).forEach((el, idx) => {
            el.classList.toggle("active", Data.AVATAR_STYLES[idx].id === selectedStyle);
          });
        }
      }
    } catch (_) {}
  }

  function setupTeleportModal() {
    teleportGrid.innerHTML = "";
    const places = [
      ...Data.ZONES.map((z) => ({
        title: z.name,
        sub: z.desc,
        spawn: z.spawn
      })),
      ...Data.BUILDINGS.map((b) => ({
        title: b.name,
        sub: b.category + " • " + b.tags[0],
        spawn: b.spawn
      }))
    ];

    for (const p of places) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "teleport-item";
      btn.innerHTML = `<strong>${escapeHtml(p.title)}</strong><span>${escapeHtml(p.sub)}</span>`;
      btn.addEventListener("click", () => {
        state.player.x = p.spawn.x;
        state.player.y = p.spawn.y;
        state.clickTarget = null;
        renderer.focusOn(state.player.x, state.player.y, true);
        mapModal.hidden = true;
        Audio.playTeleport();
        network.sendState(state.player, true);
        addSystemMessage(`Berpindah ke ${p.title}.`);
      });
      teleportGrid.appendChild(btn);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function addChatMessage(sender, text, color = "#34d399", isSystem = false) {
    const row = document.createElement("div");
    row.className = "chat-msg" + (isSystem ? " system" : "");
    if (isSystem) {
      row.textContent = text;
    } else {
      row.innerHTML = `<span class="sender" style="color:${color}">${escapeHtml(sender)}:</span><span>${escapeHtml(text)}</span>`;
    }
    chatMessages.appendChild(row);
    while (chatMessages.children.length > 60) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addSystemMessage(text) {
    addChatMessage("", text, "#fde68a", true);
  }

  function isBlocked(x, y) {
    if (x < 1.2 || x > Data.MAP_WIDTH - 1.2 || y < 1.2 || y > Data.MAP_HEIGHT - 1.2) {
      return true;
    }
    const pad = 0.35;
    for (const b of Data.BUILDINGS) {
      if (x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad) {
        return true;
      }
    }
    const fx = x - 22;
    const fy = y - 19.6;
    if (fx * fx + fy * fy < 1.1) return true;
    return false;
  }

  function movePlayer(dt) {
    const p = state.player;
    let dx = 0;
    let dy = 0;

    if (keys["KeyW"] || keys["ArrowUp"]) {
      dx -= 1;
      dy -= 1;
    }
    if (keys["KeyS"] || keys["ArrowDown"]) {
      dx += 1;
      dy += 1;
    }
    if (keys["KeyA"] || keys["ArrowLeft"]) {
      dx -= 1;
      dy += 1;
    }
    if (keys["KeyD"] || keys["ArrowRight"]) {
      dx += 1;
      dy -= 1;
    }

    if (dx !== 0 || dy !== 0) {
      state.clickTarget = null;
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    } else if (state.clickTarget) {
      const tx = state.clickTarget.x - p.x;
      const ty = state.clickTarget.y - p.y;
      const dist = Math.hypot(tx, ty);
      if (dist < 0.22) {
        state.clickTarget = null;
      } else {
        dx = tx / dist;
        dy = ty / dist;
      }
    }

    const speed = 5.4;
    if (dx !== 0 || dy !== 0) {
      p.moving = true;
      const nx = p.x + dx * speed * dt;
      const ny = p.y + dy * speed * dt;
      if (!isBlocked(nx, p.y)) p.x = nx;
      if (!isBlocked(p.x, ny)) p.y = ny;
    } else {
      p.moving = false;
    }
  }

  function updateNpcs(dt, nowSec) {
    for (const npc of state.npcs) {
      if (nowSec < npc.waitUntil) {
        npc.moving = false;
        continue;
      }
      const target = npc.patrol[npc.patrolIndex];
      const dx = target.x - npc.x;
      const dy = target.y - npc.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.2) {
        npc.moving = false;
        npc.patrolIndex = (npc.patrolIndex + 1) % npc.patrol.length;
        npc.waitUntil = nowSec + 2.5 + Math.random() * 3.5;
        if (Math.random() < 0.45) {
          const phrase = npc.phrases[Math.floor(Math.random() * npc.phrases.length)];
          npc.bubble = phrase;
          npc.bubbleUntil = nowSec + 4.5;
        }
      } else {
        npc.moving = true;
        const step = 1.9 * dt;
        npc.x += (dx / dist) * step;
        npc.y += (dy / dist) * step;
      }
    }
  }

  function updateZoneAndNearby() {
    const p = state.player;
    let nearestBuilding = null;
    let bestDist = Infinity;

    for (const b of Data.BUILDINGS) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const d = Math.hypot(p.x - cx, p.y - cy);
      const threshold = Math.max(b.w, b.h) * 0.65 + 2.1;
      if (d < threshold && d < bestDist) {
        bestDist = d;
        nearestBuilding = b;
      }
    }

    state.nearbyBuilding = nearestBuilding;

    if (nearestBuilding) {
      currentZoneName.textContent = nearestBuilding.name;
      currentZoneDesc.textContent = nearestBuilding.category + " • " + nearestBuilding.tags.join(" · ");
      landmarkBadge.textContent = nearestBuilding.category;
      landmarkTitle.textContent = nearestBuilding.name;
      landmarkText.textContent = "Tekan [E] atau klik Lihat Info untuk detail fasilitas.";
      landmarkPrompt.hidden = false;
    } else {
      landmarkPrompt.hidden = true;
      let activeZone = { name: "Area Kampus Politala", desc: "Jl. A. Yani Km. 06, Pelaihari" };
      for (const z of Data.ZONES) {
        if (Math.hypot(p.x - z.x, p.y - z.y) <= z.radius) {
          activeZone = z;
          break;
        }
      }
      currentZoneName.textContent = activeZone.name;
      currentZoneDesc.textContent = activeZone.desc;
    }

    const totalPlayers = 1 + state.remotePlayers.length;
    const totalOnline = totalPlayers + state.npcs.length;
    onlineCountEl.textContent = `${totalOnline} di Kampus (${totalPlayers} Pemain)`;
  }

  function triggerEmote(emoji) {
    const nowSec = performance.now() * 0.001;
    state.player.emote = emoji;
    state.player.emoteUntil = nowSec + 3.2;
    Audio.playEmote();
    network.sendState(state.player, true);
  }

  function sendChat(text) {
    const clean = text.trim();
    if (!clean) return;
    const nowSec = performance.now() * 0.001;
    const p = state.player;
    p.bubble = clean;
    p.bubbleUntil = nowSec + 5.0;

    addChatMessage(`${p.name} (${p.prodi})`, clean, p.color);
    Audio.playChat();

    network.sendChat(p, clean);
    network.sendState(p, true);

    const nearbyNpc = state.npcs.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < 9.5);
    if (nearbyNpc) {
      const lower = clean.toLowerCase();
      let reply = `Halo ${p.name}! Salam kenal dari ${nearbyNpc.prodi} 👋`;
      if (lower.includes("kopi") || lower.includes("makan") || lower.includes("kantin")) {
        reply = "Gas ke Kantin Politala! Es teh sama sotonya mantap.";
      } else if (lower.includes("ig") || lower.includes("follow") || lower.includes("ketenangan")) {
        reply = "Mantap! Jangan lupa support terus @tambahkan_ketenangann ya 🙌";
      } else if (lower.includes("ngoding") || lower.includes("ti") || lower.includes("wifi")) {
        reply = "Kalau mau ngebut Wi-Fi, merapat ke Gedung Teknik Informatika (GTI)!";
      } else if (lower.includes("halo") || lower.includes("hai") || lower.includes("hi")) {
        reply = `Hai ${p.name}! Selamat datang di kampus Politala Pelaihari!`;
      } else {
        reply = nearbyNpc.phrases[Math.floor(Math.random() * nearbyNpc.phrases.length)];
      }
      setTimeout(() => {
        const t = performance.now() * 0.001;
        nearbyNpc.bubble = reply;
        nearbyNpc.bubbleUntil = t + 4.8;
        addChatMessage(`${nearbyNpc.name} (${nearbyNpc.prodi})`, reply, nearbyNpc.color);
      }, 650);
    }
  }

  function openBuildingInfo(b) {
    if (!b) return;
    activeInspectBuilding = b;
    infoTitle.textContent = b.name;
    infoDesc.textContent = b.description;
    infoMeta.innerHTML = b.tags.map((t) => `<span class="info-chip">${escapeHtml(t)}</span>`).join("");
    infoModal.hidden = false;
  }

  igFollowBtn.addEventListener("click", () => {
    igFollowBtn.classList.add("visited");
    igFollowBtn.textContent = "IG Dibuka ✓";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawName = playerNameInput.value.trim();
    if (rawName.length < 2) {
      loginError.textContent = "Masukkan nama panggilan minimal 2 karakter.";
      loginError.hidden = false;
      playerNameInput.focus();
      return;
    }
    if (!igConfirmCheck.checked) {
      loginError.textContent = "Silakan centang konfirmasi follow @tambahkan_ketenangann terlebih dahulu.";
      loginError.hidden = false;
      return;
    }

    loginError.hidden = true;
    state.player.name = rawName;
    state.player.prodi = playerProdiSelect.value;
    state.player.color = selectedColor;
    state.player.style = selectedStyle;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name: state.player.name,
          prodi: state.player.prodi,
          color: state.player.color,
          style: state.player.style
        })
      );
    } catch (_) {}

    enterCampusBtn.disabled = true;
    enterCampusBtn.textContent = "Menghubungkan ke Kampus...";

    const conn = await network.connect(state.player);
    state.player.id = conn.playerId;

    enterCampusBtn.disabled = false;
    enterCampusBtn.textContent = "Masuk ke Kampus Politala →";

    chatChannelTag.textContent =
      conn.mode === "firebase" ? `🌐 Online • ${conn.room}` : `🏠 Mode Lokal • ${conn.room}`;

    joined = true;
    loginOverlay.hidden = true;
    hud.hidden = false;
    renderer.focusOn(state.player.x, state.player.y, true);
    Audio.playJoin();

    addSystemMessage(`Selamat datang ${state.player.name} (${state.player.prodi}) di Politala Social World!`);
    if (conn.mode === "firebase") {
      addSystemMessage(`Terhubung ke Firebase Realtime Database (Room: ${conn.room}). Bagikan link halaman ini agar teman bisa mabar!`);
    } else {
      addSystemMessage("Mode lokal aktif (antar tab). Isi js/firebase-config.js untuk mabar online lintas HP/PC.");
    }
    network.sendState(state.player, true);
  });

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendChat(chatInput.value);
    chatInput.value = "";
    chatInput.blur();
  });

  document.querySelectorAll(".emote-btn").forEach((btn) => {
    btn.addEventListener("click", () => triggerEmote(btn.dataset.emote));
  });

  btnMap.addEventListener("click", () => {
    mapModal.hidden = !mapModal.hidden;
  });
  document.getElementById("btnCloseMap").addEventListener("click", () => {
    mapModal.hidden = true;
  });

  btnInspectLandmark.addEventListener("click", () => openBuildingInfo(state.nearbyBuilding));
  document.getElementById("btnCloseInfo").addEventListener("click", () => {
    infoModal.hidden = true;
  });
  btnAskNpc.addEventListener("click", () => {
    if (activeInspectBuilding) {
      sendChat(`Halo teman-teman di ${activeInspectBuilding.shortName}!`);
    }
    infoModal.hidden = true;
  });

  btnTime.addEventListener("click", () => {
    const preset = renderer.cycleTime();
    btnTime.textContent = preset.label;
  });

  btnSound.addEventListener("click", () => {
    Audio.enabled = !Audio.enabled;
    btnSound.textContent = Audio.enabled ? "🔊" : "🔇";
  });

  btnLogout.addEventListener("click", () => {
    joined = false;
    network.disconnect();
    hud.hidden = true;
    loginOverlay.hidden = false;
  });

  btnZoomIn.addEventListener("click", () => {
    renderer.camera.zoom = Math.min(1.85, renderer.camera.zoom + 0.15);
  });
  btnZoomOut.addEventListener("click", () => {
    renderer.camera.zoom = Math.max(0.65, renderer.camera.zoom - 0.15);
  });

  canvas.addEventListener("click", (e) => {
    if (!joined) return;
    const worldPos = renderer.screenToWorld(e.clientX, e.clientY);
    if (
      worldPos.x >= 1 &&
      worldPos.x <= Data.MAP_WIDTH - 1 &&
      worldPos.y >= 1 &&
      worldPos.y <= Data.MAP_HEIGHT - 1
    ) {
      state.clickTarget = { x: worldPos.x, y: worldPos.y };
    }
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      renderer.camera.zoom = Math.max(0.65, Math.min(1.85, renderer.camera.zoom + delta));
    },
    { passive: false }
  );

  const dirToKey = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight"
  };
  document.querySelectorAll("#mobileControls button").forEach((btn) => {
    const code = dirToKey[btn.dataset.dir];
    const start = (ev) => {
      ev.preventDefault();
      keys[code] = true;
    };
    const end = () => {
      keys[code] = false;
    };
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointerleave", end);
    btn.addEventListener("pointercancel", end);
  });

  window.addEventListener("keydown", (e) => {
    if (document.activeElement === chatInput || document.activeElement === playerNameInput) {
      if (e.code === "Escape") document.activeElement.blur();
      return;
    }
    keys[e.code] = true;

    if (!joined) return;
    if (e.code === "KeyM") mapModal.hidden = !mapModal.hidden;
    if (e.code === "KeyE" && state.nearbyBuilding) openBuildingInfo(state.nearbyBuilding);
    if (e.code === "Escape") {
      mapModal.hidden = true;
      infoModal.hidden = true;
    }
    const emoteMap = {
      Digit1: "👋",
      Digit2: "☕",
      Digit3: "💻",
      Digit4: "📸",
      Digit5: "🎉",
      Digit6: "❤️"
    };
    if (emoteMap[e.code]) triggerEmote(emoteMap[e.code]);
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  window.addEventListener("beforeunload", () => {
    if (joined) network.disconnect();
  });

  window.addEventListener("resize", () => renderer.resize());

  let lastTime = performance.now();
  function tick(nowMs) {
    const dt = Math.min(0.05, (nowMs - lastTime) / 1000);
    lastTime = nowMs;
    const nowSec = nowMs * 0.001;

    updateNpcs(dt, nowSec);

    if (joined) {
      movePlayer(dt);
      state.remotePlayers = network.stepRemoteInterpolation(dt);
      renderer.focusOn(state.player.x, state.player.y, false);
      updateZoneAndNearby();
      network.sendState(state.player, false);
    } else {
      const ox = 22 + Math.cos(nowSec * 0.25) * 3;
      const oy = 23 + Math.sin(nowSec * 0.25) * 3;
      renderer.focusOn(ox, oy, false);
    }

    renderer.render(state);
    requestAnimationFrame(tick);
  }

  setupCustomizationUI();
  setupTeleportModal();
  renderer.resize();
  renderer.focusOn(22, 23, true);
  requestAnimationFrame(tick);
})(window);
