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
  const energyBalanceEl = document.getElementById("energyBalance");
  const coinBalanceEl = document.getElementById("coinBalance");
  const onlineCountEl = document.getElementById("onlineCount");
  const chatChannelTag = document.getElementById("chatChannelTag");

  const questRewardBadge = document.getElementById("questRewardBadge");
  const questTitle = document.getElementById("questTitle");
  const questDesc = document.getElementById("questDesc");
  const questActionRow = document.getElementById("questActionRow");
  const btnQuestAction = document.getElementById("btnQuestAction");

  const npcPrompt = document.getElementById("npcPrompt");
  const npcPromptBadge = document.getElementById("npcPromptBadge");
  const npcPromptName = document.getElementById("npcPromptName");
  const btnTalkNpc = document.getElementById("btnTalkNpc");

  const foodPrompt = document.getElementById("foodPrompt");
  const foodPromptEmoji = document.getElementById("foodPromptEmoji");
  const foodPromptName = document.getElementById("foodPromptName");
  const foodPromptSub = document.getElementById("foodPromptSub");
  const btnEatFood = document.getElementById("btnEatFood");

  const secretPrompt = document.getElementById("secretPrompt");
  const secretPromptBadge = document.getElementById("secretPromptBadge");
  const secretPromptTitle = document.getElementById("secretPromptTitle");
  const secretPromptSub = document.getElementById("secretPromptSub");
  const btnSecretAction = document.getElementById("btnSecretAction");

  const landmarkPrompt = document.getElementById("landmarkPrompt");
  const landmarkBadge = document.getElementById("landmarkBadge");
  const landmarkTitle = document.getElementById("landmarkTitle");
  const landmarkText = document.getElementById("landmarkText");
  const btnEnterBuilding = document.getElementById("btnEnterBuilding");

  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  const mapModal = document.getElementById("mapModal");
  const teleportGrid = document.getElementById("teleportGrid");
  const infoModal = document.getElementById("infoModal");
  const infoTitle = document.getElementById("infoTitle");
  const infoDesc = document.getElementById("infoDesc");
  const infoMeta = document.getElementById("infoMeta");

  const npcModal = document.getElementById("npcModal");
  const npcModalBadge = document.getElementById("npcModalBadge");
  const npcModalName = document.getElementById("npcModalName");
  const npcModalProdi = document.getElementById("npcModalProdi");
  const npcDialogBubble = document.getElementById("npcDialogBubble");
  const btnGiveRandomQuest = document.getElementById("btnGiveRandomQuest");
  const btnPlayWordFromNpc = document.getElementById("btnPlayWordFromNpc");

  const wordGameModal = document.getElementById("wordGameModal");
  const wordLivesEl = document.getElementById("wordLives");
  const wordClueText = document.getElementById("wordClueText");
  const wordTilesEl = document.getElementById("wordTiles");
  const wordGuessForm = document.getElementById("wordGuessForm");
  const wordGuessInput = document.getElementById("wordGuessInput");
  const wordFeedback = document.getElementById("wordFeedback");
  const btnWordHint = document.getElementById("btnWordHint");
  const btnWordNext = document.getElementById("btnWordNext");

  const canteenMenuModal = document.getElementById("canteenMenuModal");
  const canteenMenuGrid = document.getElementById("canteenMenuGrid");

  const secretGateModal = document.getElementById("secretGateModal");
  const secretPasswordForm = document.getElementById("secretPasswordForm");
  const secretPasswordInput = document.getElementById("secretPasswordInput");
  const secretPasswordError = document.getElementById("secretPasswordError");

  const exhibitModal = document.getElementById("exhibitModal");
  const exhibitTitle = document.getElementById("exhibitTitle");
  const exhibitDesc = document.getElementById("exhibitDesc");
  const exhibitRitualBox = document.getElementById("exhibitRitualBox");
  const btnExhibitInteract = document.getElementById("btnExhibitInteract");

  const btnCanteenMenu = document.getElementById("btnCanteenMenu");
  const btnExitCanteen = document.getElementById("btnExitCanteen");
  const btnExitBeringin = document.getElementById("btnExitBeringin");
  const btnWordGameQuick = document.getElementById("btnWordGameQuick");
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
  let activeDialogNpc = null;
  let activeExhibit = null;
  let coins = 0;
  let energy = 80;
  let exitCooldownUntil = 0;
  let claimedMonumentBonus = false;

  const keys = Object.create(null);

  function mapNpcs(list) {
    return list.map((n, idx) => ({
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
    }));
  }

  const state = {
    scene: "campus", // "campus" | "canteen" | "beringin"
    player: {
      id: "local-init",
      name: "Mahasiswa_Politala",
      prodi: "D3 Teknologi Informasi",
      color: selectedColor,
      style: selectedStyle,
      scene: "campus",
      x: 22,
      y: 37.8,
      moving: false,
      emote: null,
      emoteUntil: 0,
      bubble: null,
      bubbleUntil: 0
    },
    npcs: mapNpcs(Data.NPCS),
    canteenNpcs: mapNpcs(Data.CANTEEN_INTERIOR.npcs),
    beringinNpcs: mapNpcs(Data.SECRET_BERINGIN.npcs),
    remotePlayers: [],
    clickTarget: null,
    nearbyBuilding: null,
    nearbyNpc: null,
    nearbyFood: null,
    nearSecretPortal: false,
    nearbyExhibit: null,
    activeQuest: null
  };

  const wordGame = {
    word: "",
    clue: "",
    revealed: new Set(),
    lives: 5,
    finished: false
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
        if (typeof saved.coins === "number") coins = saved.coins;
        if (typeof saved.energy === "number") energy = saved.energy;
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
    updateStatsUI();
  }

  function saveProfile() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name: state.player.name,
          prodi: state.player.prodi,
          color: state.player.color,
          style: state.player.style,
          coins,
          energy
        })
      );
    } catch (_) {}
  }

  function updateStatsUI() {
    coinBalanceEl.textContent = `${coins} Koin`;
    energyBalanceEl.textContent = `${energy}%`;
  }

  function setupCanteenMenuModal() {
    canteenMenuGrid.innerHTML = "";
    for (const food of Data.CANTEEN_INTERIOR.foodItems) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "canteen-item-btn";
      btn.innerHTML = `
        <div class="canteen-item-emoji">${food.emoji}</div>
        <div class="canteen-item-info">
          <strong>${escapeHtml(food.name)}</strong>
          <span>${escapeHtml(food.desc)}</span>
        </div>
        <div class="canteen-item-energy">+${food.energy}% Energi</div>
      `;
      btn.addEventListener("click", () => {
        canteenMenuModal.hidden = true;
        eatFood(food);
      });
      canteenMenuGrid.appendChild(btn);
    }
  }

  function enterCanteen() {
    state.scene = "canteen";
    state.player.scene = "canteen";
    state.player.x = Data.CANTEEN_INTERIOR.spawn.x;
    state.player.y = Data.CANTEEN_INTERIOR.spawn.y;
    state.clickTarget = null;
    state.nearbyBuilding = null;
    state.nearSecretPortal = false;
    exitCooldownUntil = performance.now() + 1200;

    mapModal.hidden = true;
    infoModal.hidden = true;
    landmarkPrompt.hidden = true;
    secretPrompt.hidden = true;
    btnCanteenMenu.hidden = false;
    btnExitCanteen.hidden = false;
    btnExitBeringin.hidden = true;

    renderer.focusOn(state.player.x, state.player.y, true);
    Audio.playTeleport();
    network.sendState(state.player, true);
    addSystemMessage("🍜 Masuk ke Ruangan Kantin Politala! Dekati makanan atau klik 📋 Menu Kantin untuk makan.");

    if (
      state.activeQuest &&
      state.activeQuest.type === "visit" &&
      state.activeQuest.targetBuildingId === "kantin"
    ) {
      completeQuest("Masuk ke Kantin Politala");
    }
  }

  function exitCanteen() {
    state.scene = "campus";
    state.player.scene = "campus";
    state.player.x = 21.8;
    state.player.y = 28.4;
    state.clickTarget = null;
    state.nearbyFood = null;

    foodPrompt.hidden = true;
    canteenMenuModal.hidden = true;
    btnCanteenMenu.hidden = true;
    btnExitCanteen.hidden = true;

    renderer.focusOn(state.player.x, state.player.y, true);
    Audio.playTeleport();
    network.sendState(state.player, true);
    addSystemMessage("🚪 Keluar kembali ke halaman Kampus Politala.");
  }

  function openSecretGate() {
    mapModal.hidden = true;
    secretPasswordInput.value = "";
    secretPasswordError.hidden = true;
    secretGateModal.hidden = false;
    setTimeout(() => secretPasswordInput.focus(), 50);
  }

  function enterBeringinMuseum() {
    state.scene = "beringin";
    state.player.scene = "beringin";
    state.player.x = Data.SECRET_BERINGIN.spawn.x;
    state.player.y = Data.SECRET_BERINGIN.spawn.y;
    state.clickTarget = null;
    state.nearbyBuilding = null;
    state.nearSecretPortal = false;
    exitCooldownUntil = performance.now() + 1200;

    secretGateModal.hidden = true;
    mapModal.hidden = true;
    infoModal.hidden = true;
    landmarkPrompt.hidden = true;
    foodPrompt.hidden = true;
    canteenMenuModal.hidden = true;
    btnCanteenMenu.hidden = true;
    btnExitCanteen.hidden = true;
    btnExitBeringin.hidden = false;

    renderer.focusOn(state.player.x, state.player.y, true);
    Audio.playQuestComplete();
    network.sendState(state.player, true);
    addSystemMessage("🌳 Kata sandi diterima! Selamat datang di Museum Rahasia: Keluarga Beringin.");
  }

  function exitBeringinMuseum() {
    state.scene = "campus";
    state.player.scene = "campus";
    state.player.x = Data.SECRET_BERINGIN.portal.spawnOutside.x;
    state.player.y = Data.SECRET_BERINGIN.portal.spawnOutside.y;
    state.clickTarget = null;
    state.nearbyExhibit = null;

    secretPrompt.hidden = true;
    exhibitModal.hidden = true;
    btnExitBeringin.hidden = true;

    renderer.focusOn(state.player.x, state.player.y, true);
    Audio.playTeleport();
    network.sendState(state.player, true);
    addSystemMessage("🚪 Keluar dari Museum Keluarga Beringin kembali ke Kampus.");
  }

  function openExhibitModal(ex) {
    if (!ex) return;
    activeExhibit = ex;
    exhibitTitle.textContent = `${ex.icon} ${ex.name}`;
    exhibitDesc.textContent = ex.desc;
    exhibitRitualBox.hidden = true;
    exhibitModal.hidden = false;
  }

  function eatFood(food) {
    if (!food) return;
    const nowSec = performance.now() * 0.001;
    const reaction = food.reactions[Math.floor(Math.random() * food.reactions.length)];

    energy = Math.min(100, energy + food.energy);
    saveProfile();
    updateStatsUI();

    state.player.emote = food.emoji;
    state.player.emoteUntil = nowSec + 3.6;
    state.player.bubble = reaction;
    state.player.bubbleUntil = nowSec + 4.8;
    Audio.playEat();
    network.sendState(state.player, true);

    addSystemMessage(`🍽️ ${state.player.name} menyantap ${food.name} (+${food.energy}% Energi)!`);

    const keeper = state.canteenNpcs[0];
    if (keeper) {
      setTimeout(() => {
        const t = performance.now() * 0.001;
        keeper.bubble = "Selamat menikmati ya! Tambah lagi kalau masih lapar 😊";
        keeper.bubbleUntil = t + 4.2;
      }, 600);
    }

    if (state.activeQuest && state.activeQuest.type === "eat") {
      completeQuest(`Menyantap ${food.name}`);
    }
  }

  function updateQuestUI() {
    const q = state.activeQuest;
    if (!q) {
      questTitle.textContent = "Belum ada quest aktif";
      questDesc.textContent = "Klik NPC mahasiswa / Furry (🐾) atau tekan [F] di dekatnya untuk ambil quest random!";
      questRewardBadge.textContent = "Siap Ambil";
      questActionRow.hidden = true;
      return;
    }

    questTitle.textContent = `${q.title} (dari ${q.npcName})`;
    questDesc.textContent = q.desc;
    questRewardBadge.textContent = `+${q.reward} Koin`;

    if (q.type === "word_guess") {
      questActionRow.hidden = false;
      btnQuestAction.textContent = "🔤 Buka Tebak Kata";
    } else if (q.type === "eat" && state.scene === "campus") {
      questActionRow.hidden = false;
      btnQuestAction.textContent = "🍜 Masuk Kantin Sekarang";
    } else {
      questActionRow.hidden = true;
    }
  }

  function assignRandomQuest(npc) {
    const pool = Data.QUEST_POOL;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    state.activeQuest = {
      ...picked,
      npcId: npc.id,
      npcName: npc.name,
      completed: false
    };
    updateQuestUI();
    Audio.playEmote();
    addSystemMessage(`📜 Quest baru dari ${npc.name}: ${picked.title} (+${picked.reward} Koin)!`);

    if (picked.type === "word_guess") {
      npcModal.hidden = true;
      openWordGame();
    } else {
      npcDialogBubble.textContent = `Oke! Tugasmu: "${picked.desc}" Nanti hadiahnya +${picked.reward} Koin Kampus ya!`;
    }
  }

  function completeQuest(reasonLabel) {
    const q = state.activeQuest;
    if (!q || q.completed) return;
    q.completed = true;
    coins += q.reward;
    saveProfile();
    updateStatsUI();
    Audio.playQuestComplete();

    const nowSec = performance.now() * 0.001;
    state.player.emote = "🎉";
    state.player.emoteUntil = nowSec + 3.2;
    network.sendState(state.player, true);

    addSystemMessage(`🎉 Quest "${q.title}" selesai (${reasonLabel})! +${q.reward} Koin Kampus.`);
    state.activeQuest = null;
    updateQuestUI();
  }

  function openNpcDialog(npc) {
    if (!npc) return;
    activeDialogNpc = npc;
    npcModalBadge.textContent = npc.badge || (npc.isFurry ? "🐾 FURRY" : "MAHASISWA");
    npcModalName.textContent = npc.name;
    npcModalProdi.textContent = npc.prodi;
    const phrase = npc.phrases[Math.floor(Math.random() * npc.phrases.length)];
    npcDialogBubble.textContent = phrase;
    btnGiveRandomQuest.textContent = state.activeQuest ? "🔄 Ganti Quest Random" : "🎲 Ambil Quest Random";
    npcModal.hidden = false;
  }

  // ===== TEBAK KATA LOGIC =====
  function startNewWordRound() {
    const item = Data.TEBAK_KATA_BANK[Math.floor(Math.random() * Data.TEBAK_KATA_BANK.length)];
    wordGame.word = item.word.toUpperCase();
    wordGame.clue = item.clue;
    wordGame.revealed = new Set();
    wordGame.lives = 5;
    wordGame.finished = false;

    const firstChar = wordGame.word[0];
    wordGame.revealed.add(firstChar);

    wordFeedback.textContent = "Ketik 1 huruf (misal: A) atau langsung ketik kata lengkapnya!";
    wordFeedback.style.color = "#fde68a";
    wordGuessInput.value = "";
    wordGuessInput.disabled = false;
    renderWordGame();
  }

  function openWordGame() {
    if (!wordGame.word || wordGame.finished) {
      startNewWordRound();
    } else {
      renderWordGame();
    }
    wordGameModal.hidden = false;
    setTimeout(() => wordGuessInput.focus(), 50);
  }

  function renderWordGame() {
    wordLivesEl.textContent = `❤️ Kesempatan: ${wordGame.lives}`;
    wordClueText.textContent = wordGame.clue;
    wordTilesEl.innerHTML = "";
    for (const ch of wordGame.word) {
      const tile = document.createElement("div");
      const show = wordGame.revealed.has(ch) || wordGame.finished;
      tile.className = "word-tile" + (wordGame.revealed.has(ch) ? " revealed" : "");
      tile.textContent = show ? ch : "_";
      wordTilesEl.appendChild(tile);
    }
  }

  function checkWordWin() {
    for (const ch of wordGame.word) {
      if (!wordGame.revealed.has(ch)) return false;
    }
    return true;
  }

  function handleWordWin() {
    wordGame.finished = true;
    for (const ch of wordGame.word) wordGame.revealed.add(ch);
    wordGuessInput.disabled = true;
    renderWordGame();

    if (state.activeQuest && state.activeQuest.type === "word_guess") {
      completeQuest("Tebak Kata Berhasil");
      wordFeedback.textContent = `🎉 Benar! Kata "${wordGame.word}" terpecahkan! Quest selesai!`;
    } else {
      coins += 50;
      saveProfile();
      updateStatsUI();
      Audio.playQuestComplete();
      const nowSec = performance.now() * 0.001;
      state.player.emote = "🎉";
      state.player.emoteUntil = nowSec + 3.0;
      network.sendState(state.player, true);
      addSystemMessage(`🔤 Tebak Kata "${wordGame.word}" berhasil! +50 Koin Kampus.`);
      wordFeedback.textContent = `🎉 Benar! Jawabannya "${wordGame.word}" (+50 Koin)!`;
    }
    wordFeedback.style.color = "#34d399";
  }

  function handleWordGuess(raw) {
    if (wordGame.finished) return;
    const guess = raw.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (!guess) return;

    if (guess.length === 1) {
      if (wordGame.revealed.has(guess)) {
        wordFeedback.textContent = `Huruf "${guess}" sudah terbuka.`;
        wordFeedback.style.color = "#fde68a";
        return;
      }
      if (wordGame.word.includes(guess)) {
        wordGame.revealed.add(guess);
        Audio.playChat();
        if (checkWordWin()) {
          handleWordWin();
        } else {
          wordFeedback.textContent = `Bagus! Huruf "${guess}" ada di kata ini.`;
          wordFeedback.style.color = "#34d399";
          renderWordGame();
        }
      } else {
        wordGame.lives -= 1;
        Audio.playWrong();
        if (wordGame.lives <= 0) {
          wordGame.finished = true;
          wordGuessInput.disabled = true;
          wordFeedback.textContent = `Kesempatan habis! Jawabannya: ${wordGame.word}. Klik Kata Baru untuk coba lagi.`;
          wordFeedback.style.color = "#fb7185";
        } else {
          wordFeedback.textContent = `Huruf "${guess}" tidak ada! Sisa kesempatan: ${wordGame.lives}.`;
          wordFeedback.style.color = "#fb7185";
        }
        renderWordGame();
      }
      return;
    }

    if (guess === wordGame.word) {
      handleWordWin();
    } else {
      wordGame.lives -= 1;
      Audio.playWrong();
      if (wordGame.lives <= 0) {
        wordGame.finished = true;
        wordGuessInput.disabled = true;
        wordFeedback.textContent = `Kesempatan habis! Jawabannya: ${wordGame.word}. Klik Kata Baru untuk coba lagi.`;
      } else {
        wordFeedback.textContent = `"${guess}" belum tepat! Sisa kesempatan: ${wordGame.lives}.`;
      }
      wordFeedback.style.color = "#fb7185";
      renderWordGame();
    }
  }

  function setupTeleportModal() {
    teleportGrid.innerHTML = "";

    const insideCanteenBtn = document.createElement("button");
    insideCanteenBtn.type = "button";
    insideCanteenBtn.className = "teleport-item";
    insideCanteenBtn.innerHTML =
      "<strong>🍜 Masuk ke Ruangan Kantin Politala</strong><span>INDOOR • Soto Banjar, Nasi Goreng, Kopi</span>";
    insideCanteenBtn.addEventListener("click", () => {
      enterCanteen();
    });
    teleportGrid.appendChild(insideCanteenBtn);

    const secretBeringinBtn = document.createElement("button");
    secretBeringinBtn.type = "button";
    secretBeringinBtn.className = "teleport-item";
    secretBeringinBtn.innerHTML =
      "<strong>🔒 Ruangan Rahasia: Keluarga Beringin</strong><span>RAHASIA • Butuh Kata Sandi Masuk</span>";
    secretBeringinBtn.addEventListener("click", () => {
      openSecretGate();
    });
    teleportGrid.appendChild(secretBeringinBtn);

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
        if (state.scene === "canteen") exitCanteen();
        if (state.scene === "beringin") exitBeringinMuseum();
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
    if (state.scene === "canteen") {
      const room = Data.CANTEEN_INTERIOR;
      if (x < 0.7 || x > room.width - 0.7 || y < 1.1 || y > room.height - 0.5) return true;
      const pad = 0.25;
      for (const c of room.counters) {
        if (x >= c.x - pad && x <= c.x + c.w + pad && y >= c.y - pad && y <= c.y + c.h + pad) return true;
      }
      for (const t of room.tables) {
        if (x >= t.x - pad && x <= t.x + t.w + pad && y >= t.y - pad && y <= t.y + t.h + pad) return true;
      }
      return false;
    }

    if (state.scene === "beringin") {
      const room = Data.SECRET_BERINGIN;
      if (x < 0.7 || x > room.width - 0.7 || y < 1.1 || y > room.height - 0.5) return true;
      const pad = 0.25;
      const m = room.monument;
      if (x >= m.x - pad && x <= m.x + m.w + pad && y >= m.y - pad && y <= m.y + m.h + pad) return true;
      for (const ped of room.pedestals) {
        if (x >= ped.x - pad && x <= ped.x + ped.w + pad && y >= ped.y - pad && y <= ped.y + ped.h + pad) return true;
      }
      return false;
    }

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

    const speed = state.scene === "campus" ? 5.4 : 4.4;
    if (dx !== 0 || dy !== 0) {
      p.moving = true;
      const nx = p.x + dx * speed * dt;
      const ny = p.y + dy * speed * dt;
      if (!isBlocked(nx, p.y)) p.x = nx;
      if (!isBlocked(p.x, ny)) p.y = ny;
    } else {
      p.moving = false;
    }

    if (state.scene === "canteen" && performance.now() > exitCooldownUntil) {
      const ex = Data.CANTEEN_INTERIOR.exitZone;
      if (Math.hypot(p.x - ex.x, p.y - ex.y) < ex.radius * 0.75) {
        exitCanteen();
      }
    } else if (state.scene === "beringin" && performance.now() > exitCooldownUntil) {
      const ex = Data.SECRET_BERINGIN.exitZone;
      if (Math.hypot(p.x - ex.x, p.y - ex.y) < ex.radius * 0.75) {
        exitBeringinMuseum();
      }
    }
  }

  function updateNpcs(list, dt, nowSec, stepSpeed = 1.9) {
    for (const npc of list) {
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
        if (Math.random() < 0.48) {
          const phrase = npc.phrases[Math.floor(Math.random() * npc.phrases.length)];
          npc.bubble = phrase;
          npc.bubbleUntil = nowSec + 4.5;
        }
      } else {
        npc.moving = true;
        const step = stepSpeed * dt;
        npc.x += (dx / dist) * step;
        npc.y += (dy / dist) * step;
      }
    }
  }

  function getActiveNpcList() {
    if (state.scene === "canteen") return state.canteenNpcs;
    if (state.scene === "beringin") return state.beringinNpcs;
    return state.npcs;
  }

  function updateZoneAndNearby() {
    const p = state.player;
    const activeNpcList = getActiveNpcList();

    let nearestNpc = null;
    let bestNpcDist = 3.2;
    for (const npc of activeNpcList) {
      const d = Math.hypot(p.x - npc.x, p.y - npc.y);
      if (d < bestNpcDist) {
        bestNpcDist = d;
        nearestNpc = npc;
      }
    }
    state.nearbyNpc = nearestNpc;

    if (nearestNpc) {
      npcPromptBadge.textContent = nearestNpc.badge || (nearestNpc.isFurry ? "🐾 FURRY" : "MAHASISWA");
      npcPromptName.textContent = nearestNpc.name;
      npcPrompt.hidden = false;
    } else {
      npcPrompt.hidden = true;
    }

    if (state.scene === "canteen") {
      state.nearbyBuilding = null;
      state.nearSecretPortal = false;
      state.nearbyExhibit = null;
      landmarkPrompt.hidden = true;
      secretPrompt.hidden = true;

      currentZoneName.textContent = "Ruangan Kantin Politala (Indoor)";
      currentZoneDesc.textContent = "Dekati meja/konter makanan untuk makan atau buka Menu Kantin";

      let nearestFood = null;
      let bestFoodDist = 2.4;
      for (const food of Data.CANTEEN_INTERIOR.foodItems) {
        const d = Math.hypot(p.x - food.spot.x, p.y - food.spot.y);
        if (d < bestFoodDist) {
          bestFoodDist = d;
          nearestFood = food;
        }
      }
      state.nearbyFood = nearestFood;

      if (nearestFood) {
        foodPromptEmoji.textContent = `${nearestFood.emoji} MAKANAN`;
        foodPromptName.textContent = nearestFood.name;
        foodPromptSub.textContent = `Tekan [E] atau klik untuk makan (+${nearestFood.energy}% Energi).`;
        foodPrompt.hidden = false;
      } else {
        foodPrompt.hidden = true;
      }
    } else if (state.scene === "beringin") {
      state.nearbyBuilding = null;
      state.nearbyFood = null;
      state.nearSecretPortal = false;
      landmarkPrompt.hidden = true;
      foodPrompt.hidden = true;

      currentZoneName.textContent = "Museum Rahasia: Keluarga Beringin";
      currentZoneDesc.textContent = "Ruangan rahasia komunitas • Amati patung & artefak dengan [E]";

      let nearestEx = null;
      let bestExDist = 2.5;
      for (const ex of Data.SECRET_BERINGIN.exhibits) {
        const d = Math.hypot(p.x - ex.spot.x, p.y - ex.spot.y);
        if (d < bestExDist) {
          bestExDist = d;
          nearestEx = ex;
        }
      }
      state.nearbyExhibit = nearestEx;

      if (nearestEx) {
        secretPromptBadge.textContent = `${nearestEx.icon} KOLEKSI`;
        secretPromptTitle.textContent = nearestEx.name;
        secretPromptSub.textContent = "Tekan [E] atau klik untuk melihat & berinteraksi.";
        btnSecretAction.textContent = "Amati [E]";
        secretPrompt.hidden = false;
      } else {
        secretPrompt.hidden = true;
      }
    } else {
      state.nearbyFood = null;
      state.nearbyExhibit = null;
      foodPrompt.hidden = true;

      // Secret Banyan Tree portal proximity
      const bp = Data.SECRET_BERINGIN.portal;
      const nearPortal = Math.hypot(p.x - bp.x, p.y - bp.y) <= bp.radius;
      state.nearSecretPortal = nearPortal;
      if (nearPortal) {
        secretPromptBadge.textContent = "🔒 RAHASIA";
        secretPromptTitle.textContent = "Pohon Beringin Misterius";
        secretPromptSub.textContent = "Tekan [E] untuk memasukkan kata sandi Keluarga Beringin.";
        btnSecretAction.textContent = "Masuk [E]";
        secretPrompt.hidden = false;
      } else {
        secretPrompt.hidden = true;
      }

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

      if (
        state.activeQuest &&
        state.activeQuest.type === "visit" &&
        nearestBuilding &&
        nearestBuilding.id === state.activeQuest.targetBuildingId
      ) {
        completeQuest(`Mengunjungi ${nearestBuilding.shortName}`);
      }

      if (nearestBuilding) {
        currentZoneName.textContent = nearestBuilding.name;
        currentZoneDesc.textContent = nearestBuilding.category + " • " + nearestBuilding.tags.join(" · ");
        landmarkBadge.textContent = nearestBuilding.category;
        landmarkTitle.textContent = nearestBuilding.name;
        if (nearestBuilding.hasInterior) {
          landmarkText.textContent = "Tekan [E] untuk masuk ke dalam Ruangan Kantin Politala!";
          btnEnterBuilding.hidden = false;
        } else {
          landmarkText.textContent = "Tekan [E] atau klik Lihat Info untuk detail fasilitas.";
          btnEnterBuilding.hidden = true;
        }
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
        currentZoneName.textContent = nearPortal ? "Pohon Beringin Misterius" : activeZone.name;
        currentZoneDesc.textContent = nearPortal
          ? "Ada gerbang rahasia menuju Museum Keluarga Beringin"
          : activeZone.desc;
      }
    }

    const totalPlayers = 1 + state.remotePlayers.length;
    const totalOnline =
      totalPlayers + Data.NPCS.length + Data.CANTEEN_INTERIOR.npcs.length + Data.SECRET_BERINGIN.npcs.length;
    onlineCountEl.textContent = `${totalOnline} di Kampus (${totalPlayers} Pemain)`;
  }

  function triggerEmote(emoji) {
    const nowSec = performance.now() * 0.001;
    state.player.emote = emoji;
    state.player.emoteUntil = nowSec + 3.4;
    Audio.playEmote();
    network.sendState(state.player, true);

    const activeNpcList = getActiveNpcList();
    const reactor = activeNpcList.find((n) => Math.hypot(n.x - state.player.x, n.y - state.player.y) < 6.5);
    if (reactor) {
      reactor.emote = emoji;
      reactor.emoteUntil = nowSec + 2.6;
    }

    if (
      state.activeQuest &&
      state.activeQuest.type === "emote" &&
      state.activeQuest.targetEmote === emoji
    ) {
      completeQuest(`Emote ${emoji}`);
    }
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

    if (state.activeQuest && state.activeQuest.type === "chat") {
      completeQuest("Sapaan Obrolan Kampus");
    }

    const activeNpcList = getActiveNpcList();
    const nearbyNpc = activeNpcList.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < 9.5);
    if (nearbyNpc) {
      const lower = clean.toLowerCase();
      let reply = `Halo ${p.name}! Salam kenal dari ${nearbyNpc.prodi} 👋`;
      if (lower.includes("makan") || lower.includes("lapar") || lower.includes("soto") || lower.includes("kantin")) {
        reply =
          state.scene === "canteen"
            ? "Langsung dekati makanan atau buka Menu Kantin di atas buat makan 😋"
            : "Yuk masuk ke Kantin Politala! Tekan [E] di depan gedung Kantin.";
      } else if (lower.includes("beringin") || lower.includes("hihu") || lower.includes("museum") || lower.includes("rahasia")) {
        reply =
          state.scene === "beringin"
            ? "Sst... Kamu resmi berada di dalam Museum Rahasia Keluarga Beringin!"
            : "Katanya ada Pohon Beringin misterius di sisi barat kampus...";
      } else if (lower.includes("ig") || lower.includes("follow") || lower.includes("ketenangan")) {
        reply = "Mantap! Jangan lupa support terus @tambahkan_ketenangann ya 🙌";
      } else if (lower.includes("quest") || lower.includes("misi") || lower.includes("tebak")) {
        reply = "Tekan [F] di dekatku untuk ambil quest random atau main Tebak Kata!";
      } else if (
        lower.includes("furry") ||
        lower.includes("rubah") ||
        lower.includes("kucing") ||
        lower.includes("panda") ||
        lower.includes("kelinci")
      ) {
        reply = "Hehe kostum hewannya gemas kan! Kamu juga bisa pakai di menu profil lho 🐾";
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
    saveProfile();

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
    updateQuestUI();
    renderer.focusOn(state.player.x, state.player.y, true);
    Audio.playJoin();

    addSystemMessage(`Selamat datang ${state.player.name} (${state.player.prodi}) di Politala Social World!`);
    addSystemMessage("Tips: Masuk ke dalam Kantin Politala untuk makan, atau cari ruangan rahasia di 🗺️ Peta!");
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

  btnWordGameQuick.addEventListener("click", openWordGame);
  btnQuestAction.addEventListener("click", () => {
    if (state.activeQuest && state.activeQuest.type === "eat") {
      enterCanteen();
    } else {
      openWordGame();
    }
  });

  btnEnterBuilding.addEventListener("click", () => {
    if (state.nearbyBuilding && state.nearbyBuilding.hasInterior) {
      enterCanteen();
    }
  });
  btnExitCanteen.addEventListener("click", exitCanteen);
  btnExitBeringin.addEventListener("click", exitBeringinMuseum);

  btnSecretAction.addEventListener("click", () => {
    if (state.scene === "beringin" && state.nearbyExhibit) {
      openExhibitModal(state.nearbyExhibit);
    } else if (state.scene === "campus" && state.nearSecretPortal) {
      openSecretGate();
    }
  });

  document.getElementById("btnCloseSecretGate").addEventListener("click", () => {
    secretGateModal.hidden = true;
  });

  secretPasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const entered = secretPasswordInput.value.trim().toLowerCase();
    if (entered === Data.SECRET_BERINGIN.password) {
      secretPasswordError.hidden = true;
      enterBeringinMuseum();
    } else {
      Audio.playWrong();
      secretPasswordError.textContent = "Kata sandi salah! Hanya Keluarga Beringin yang mengetahui sandinya.";
      secretPasswordError.hidden = false;
      secretPasswordInput.select();
    }
  });

  document.getElementById("btnCloseExhibit").addEventListener("click", () => {
    exhibitModal.hidden = true;
  });
  btnExhibitInteract.addEventListener("click", () => {
    if (!activeExhibit) return;
    const nowSec = performance.now() * 0.001;
    exhibitRitualBox.textContent = activeExhibit.ritualLine;
    exhibitRitualBox.hidden = false;
    state.player.emote = "🎉";
    state.player.emoteUntil = nowSec + 3.0;
    state.player.bubble = activeExhibit.ritualLine;
    state.player.bubbleUntil = nowSec + 4.8;
    Audio.playEmote();

    if (activeExhibit.rewardCoins && !claimedMonumentBonus) {
      claimedMonumentBonus = true;
      coins += activeExhibit.rewardCoins;
      saveProfile();
      updateStatsUI();
      Audio.playQuestComplete();
      addSystemMessage(`🗿 Mengamati ${activeExhibit.name}! Bonus +${activeExhibit.rewardCoins} Koin Keluarga Beringin.`);
    }
    network.sendState(state.player, true);
  });

  btnCanteenMenu.addEventListener("click", () => {
    canteenMenuModal.hidden = false;
  });
  document.getElementById("btnCloseCanteenMenu").addEventListener("click", () => {
    canteenMenuModal.hidden = true;
  });
  btnEatFood.addEventListener("click", () => {
    if (state.nearbyFood) eatFood(state.nearbyFood);
  });

  btnTalkNpc.addEventListener("click", () => {
    if (state.nearbyNpc) openNpcDialog(state.nearbyNpc);
  });
  document.getElementById("btnCloseNpc").addEventListener("click", () => {
    npcModal.hidden = true;
  });
  btnGiveRandomQuest.addEventListener("click", () => {
    if (activeDialogNpc) assignRandomQuest(activeDialogNpc);
  });
  btnPlayWordFromNpc.addEventListener("click", () => {
    npcModal.hidden = true;
    openWordGame();
  });

  document.getElementById("btnCloseWordGame").addEventListener("click", () => {
    wordGameModal.hidden = true;
  });
  wordGuessForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleWordGuess(wordGuessInput.value);
    wordGuessInput.value = "";
  });
  btnWordHint.addEventListener("click", () => {
    if (wordGame.finished) return;
    const unrevealed = [...wordGame.word].filter((ch) => !wordGame.revealed.has(ch));
    if (unrevealed.length > 1) {
      const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      wordGame.revealed.add(pick);
      Audio.playEmote();
      wordFeedback.textContent = `💡 Bantuan dibuka: huruf "${pick}".`;
      wordFeedback.style.color = "#fde68a";
      renderWordGame();
    } else if (unrevealed.length === 1) {
      wordFeedback.textContent = "Tinggal 1 huruf terakhir, ayo tebak sendiri!";
    }
  });
  btnWordNext.addEventListener("click", startNewWordRound);

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
    state.scene = "campus";
    state.player.scene = "campus";
    btnCanteenMenu.hidden = true;
    btnExitCanteen.hidden = true;
    btnExitBeringin.hidden = true;
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
    const activeNpcList = getActiveNpcList();

    const clickedNpc = activeNpcList.find((n) => Math.hypot(worldPos.x - n.x, worldPos.y - (n.y - 0.5)) < 1.35);
    if (clickedNpc) {
      const distToPlayer = Math.hypot(state.player.x - clickedNpc.x, state.player.y - clickedNpc.y);
      if (distToPlayer < 4.5) {
        openNpcDialog(clickedNpc);
      } else {
        state.clickTarget = { x: clickedNpc.x, y: clickedNpc.y + 1.2 };
        addSystemMessage(`Berjalan mendekati ${clickedNpc.name}...`);
      }
      return;
    }

    if (state.scene === "canteen") {
      const room = Data.CANTEEN_INTERIOR;
      const clickedCounter = room.counters.find(
        (c) => worldPos.x >= c.x && worldPos.x <= c.x + c.w && worldPos.y >= c.y && worldPos.y <= c.y + c.h
      );
      if (clickedCounter) {
        canteenMenuModal.hidden = false;
        return;
      }

      const clickedFood = room.foodItems.find((f) => Math.hypot(worldPos.x - f.spot.x, worldPos.y - f.spot.y) < 1.8);
      if (clickedFood) {
        if (Math.hypot(state.player.x - clickedFood.spot.x, state.player.y - clickedFood.spot.y) < 2.4) {
          eatFood(clickedFood);
        } else {
          state.clickTarget = { x: clickedFood.spot.x, y: clickedFood.spot.y };
        }
        return;
      }

      if (worldPos.x >= 0.8 && worldPos.x <= room.width - 0.8 && worldPos.y >= 1.2 && worldPos.y <= room.height - 0.6) {
        state.clickTarget = { x: worldPos.x, y: worldPos.y };
      }
      return;
    }

    if (state.scene === "beringin") {
      const room = Data.SECRET_BERINGIN;
      const clickedEx = room.exhibits.find((ex) => Math.hypot(worldPos.x - ex.spot.x, worldPos.y - ex.spot.y) < 1.9);
      if (clickedEx) {
        if (Math.hypot(state.player.x - clickedEx.spot.x, state.player.y - clickedEx.spot.y) < 2.5) {
          openExhibitModal(clickedEx);
        } else {
          state.clickTarget = { x: clickedEx.spot.x, y: clickedEx.spot.y };
        }
        return;
      }

      if (worldPos.x >= 0.8 && worldPos.x <= room.width - 0.8 && worldPos.y >= 1.2 && worldPos.y <= room.height - 0.6) {
        state.clickTarget = { x: worldPos.x, y: worldPos.y };
      }
      return;
    }

    // Clicking Secret Banyan Tree on campus
    const bp = Data.SECRET_BERINGIN.portal;
    if (Math.hypot(worldPos.x - bp.x, worldPos.y - bp.y) < 1.7) {
      if (Math.hypot(state.player.x - bp.x, state.player.y - bp.y) <= bp.radius) {
        openSecretGate();
      } else {
        state.clickTarget = { x: bp.x + 1.2, y: bp.y };
      }
      return;
    }

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
    if (
      document.activeElement === chatInput ||
      document.activeElement === playerNameInput ||
      document.activeElement === wordGuessInput ||
      document.activeElement === secretPasswordInput
    ) {
      if (e.code === "Escape") document.activeElement.blur();
      return;
    }
    keys[e.code] = true;

    if (!joined) return;
    if (e.code === "KeyM") mapModal.hidden = !mapModal.hidden;
    if (e.code === "KeyE") {
      if (state.scene === "canteen" && state.nearbyFood) {
        eatFood(state.nearbyFood);
      } else if (state.scene === "beringin" && state.nearbyExhibit) {
        openExhibitModal(state.nearbyExhibit);
      } else if (state.scene === "campus" && state.nearSecretPortal) {
        openSecretGate();
      } else if (state.nearbyBuilding && state.nearbyBuilding.hasInterior) {
        enterCanteen();
      } else if (state.nearbyBuilding) {
        openBuildingInfo(state.nearbyBuilding);
      }
    }
    if (e.code === "KeyF" && state.nearbyNpc) openNpcDialog(state.nearbyNpc);
    if (e.code === "Escape") {
      mapModal.hidden = true;
      infoModal.hidden = true;
      npcModal.hidden = true;
      wordGameModal.hidden = true;
      canteenMenuModal.hidden = true;
      secretGateModal.hidden = true;
      exhibitModal.hidden = true;
    }
    const emoteMap = {
      Digit1: "👋",
      Digit2: "💃",
      Digit3: "☕",
      Digit4: "💻",
      Digit5: "📸",
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

    updateNpcs(state.npcs, dt, nowSec, 1.9);
    updateNpcs(state.canteenNpcs, dt, nowSec, 1.3);
    updateNpcs(state.beringinNpcs, dt, nowSec, 1.2);

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
  setupCanteenMenuModal();
  renderer.resize();
  renderer.focusOn(22, 23, true);
  requestAnimationFrame(tick);
})(window);
