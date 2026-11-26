(function (global) {
  "use strict";

  const TILE_W = 56;
  const TILE_H = 28;
  const FLOOR_HEIGHT = 20;

  const TIME_PRESETS = [
    {
      id: "day",
      label: "☀️ Siang",
      skyTop: "#1b4d6e",
      skyBottom: "#2b6b7d",
      grassA: "#2f7d4d",
      grassB: "#296f44",
      road: "#475569",
      roadEdge: "#94a3b8",
      ambientDark: 0,
      windowGlow: false
    },
    {
      id: "sunset",
      label: "🌅 Senja",
      skyTop: "#3b1d4a",
      skyBottom: "#9a3412",
      grassA: "#286545",
      grassB: "#22573c",
      road: "#3f4654",
      roadEdge: "#cbd5e1",
      ambientDark: 0.18,
      windowGlow: true
    },
    {
      id: "night",
      label: "🌙 Malam",
      skyTop: "#060b16",
      skyBottom: "#0f1e36",
      grassA: "#163b2a",
      grassB: "#123223",
      road: "#1e293b",
      roadEdge: "#64748b",
      ambientDark: 0.44,
      windowGlow: true
    }
  ];

  function worldToIso(wx, wy) {
    return {
      x: (wx - wy) * (TILE_W / 2),
      y: (wx + wy) * (TILE_H / 2)
    };
  }

  function isoToWorld(ix, iy) {
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    const wx = (ix / hw + iy / hh) / 2;
    const wy = (iy / hh - ix / hw) / 2;
    return { x: wx, y: wy };
  }

  function shadeColor(hex, factor) {
    const clean = hex.replace("#", "");
    const num = parseInt(clean, 16);
    const r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 255) * factor)));
    const g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 255) * factor)));
    const b = Math.max(0, Math.min(255, Math.round((num & 255) * factor)));
    return `rgb(${r},${g},${b})`;
  }

  class IsometricRenderer {
    constructor(canvas, minimapCanvas, data) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.minimap = minimapCanvas;
      this.mctx = minimapCanvas.getContext("2d");
      this.data = data;
      this.timeIndex = 0;
      this.camera = { x: 0, y: 0, zoom: 1.05 };
      this.monumentImg = null;
      this.monumentImgLoaded = false;
      const customUrl = data.SECRET_BERINGIN && data.SECRET_BERINGIN.monumentImageUrl;
      if (customUrl) {
        const img = new Image();
        img.onload = () => {
          this.monumentImgLoaded = true;
        };
        img.src = customUrl;
        this.monumentImg = img;
      }
    }

    getTimePreset() {
      return TIME_PRESETS[this.timeIndex];
    }

    cycleTime() {
      this.timeIndex = (this.timeIndex + 1) % TIME_PRESETS.length;
      return this.getTimePreset();
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.viewW = w;
      this.viewH = h;
    }

    screenToWorld(sx, sy) {
      const ix = (sx - this.viewW / 2) / this.camera.zoom + this.camera.x;
      const iy = (sy - this.viewH / 2) / this.camera.zoom + this.camera.y;
      return isoToWorld(ix, iy);
    }

    focusOn(wx, wy, instant = false) {
      const iso = worldToIso(wx, wy);
      if (instant) {
        this.camera.x = iso.x;
        this.camera.y = iso.y;
      } else {
        this.camera.x += (iso.x - this.camera.x) * 0.14;
        this.camera.y += (iso.y - this.camera.y) * 0.14;
      }
    }

    drawIsoRect(x, y, w, h, fill, stroke = null) {
      const ctx = this.ctx;
      const p1 = worldToIso(x, y);
      const p2 = worldToIso(x + w, y);
      const p3 = worldToIso(x + w, y + h);
      const p4 = worldToIso(x, y + h);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    render(state) {
      const now = performance.now() * 0.001;
      if (state.scene === "canteen") {
        this.renderCanteen(state, now);
        return;
      }
      if (state.scene === "beringin") {
        this.renderBeringinMuseum(state, now);
        return;
      }

      const ctx = this.ctx;
      const preset = this.getTimePreset();

      const grad = ctx.createLinearGradient(0, 0, 0, this.viewH);
      grad.addColorStop(0, preset.skyTop);
      grad.addColorStop(1, preset.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      ctx.save();
      ctx.translate(this.viewW / 2, this.viewH / 2);
      ctx.scale(this.camera.zoom, this.camera.zoom);
      ctx.translate(-this.camera.x, -this.camera.y);

      this.drawGround(preset, now, state.clickTarget);

      const drawables = [];

      for (const b of this.data.BUILDINGS) {
        drawables.push({
          x0: b.x,
          y0: b.y,
          x1: b.x + b.w,
          y1: b.y + b.h,
          cx: b.x + b.w * 0.5,
          cy: b.y + b.h * 0.5,
          draw: () => this.drawBuilding(b, preset, state.nearbyBuilding && state.nearbyBuilding.id === b.id, now)
        });
      }

      drawables.push({
        x0: 20,
        y0: 40.1,
        x1: 24,
        y1: 40.5,
        cx: 22,
        cy: 40.3,
        draw: () => this.drawMainGate(preset)
      });

      drawables.push({
        x0: 21.1,
        y0: 18.7,
        x1: 22.9,
        y1: 20.5,
        cx: 22,
        cy: 19.6,
        draw: () => this.drawFountain(22, 19.6, now)
      });

      drawables.push({
        x0: 21.8,
        y0: 17.3,
        x1: 22.2,
        y1: 17.7,
        cx: 22,
        cy: 17.5,
        draw: () => this.drawFlagpole(22, 17.5, now)
      });

      // Secret Mysterious Banyan Tree Portal ("Keluarga Beringin")
      const bp = this.data.SECRET_BERINGIN.portal;
      drawables.push({
        x0: bp.x - 0.6,
        y0: bp.y - 0.6,
        x1: bp.x + 0.6,
        y1: bp.y + 0.6,
        cx: bp.x,
        cy: bp.y,
        draw: () => this.drawSecretBeringinTree(bp.x, bp.y, state.nearSecretPortal, now)
      });

      for (const t of this.data.TREES) {
        drawables.push({
          x0: t.x - 0.35,
          y0: t.y - 0.35,
          x1: t.x + 0.35,
          y1: t.y + 0.35,
          cx: t.x,
          cy: t.y,
          draw: () => this.drawTree(t.x, t.y, preset)
        });
      }

      for (const bench of this.data.BENCHES) {
        drawables.push({
          x0: bench.x - 0.35,
          y0: bench.y - 0.2,
          x1: bench.x + 0.35,
          y1: bench.y + 0.2,
          cx: bench.x,
          cy: bench.y,
          draw: () => this.drawBench(bench.x, bench.y)
        });
      }

      for (const lamp of this.data.LAMP_POSTS) {
        drawables.push({
          x0: lamp.x - 0.15,
          y0: lamp.y - 0.15,
          x1: lamp.x + 0.15,
          y1: lamp.y + 0.15,
          cx: lamp.x,
          cy: lamp.y,
          draw: () => this.drawLampPost(lamp.x, lamp.y, preset)
        });
      }

      const visibleRemotes = state.remotePlayers.filter((rp) => (rp.scene || "campus") === "campus");
      const allActors = [...state.npcs, ...visibleRemotes, state.player];
      for (const actor of allActors) {
        drawables.push({
          x0: actor.x - 0.28,
          y0: actor.y - 0.28,
          x1: actor.x + 0.28,
          y1: actor.y + 0.28,
          cx: actor.x,
          cy: actor.y,
          draw: () =>
            this.drawCharacter(
              actor,
              now,
              actor.id === state.player.id,
              state.nearbyNpc && state.nearbyNpc.id === actor.id,
              state.activeQuest
            )
        });
      }

      drawables.sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
      const n = drawables.length;
      const visited = new Uint8Array(n);
      const visiting = new Uint8Array(n);
      const ordered = [];

      const visit = (idx) => {
        if (visited[idx] || visiting[idx]) return;
        visiting[idx] = 1;
        const cur = drawables[idx];
        for (let j = 0; j < n; j++) {
          if (j === idx || visited[j]) continue;
          const prev = drawables[j];
          const prevBehindX = prev.x1 <= cur.x0 + 0.01 && prev.y0 < cur.y1;
          const prevBehindY = prev.y1 <= cur.y0 + 0.01 && prev.x0 < cur.x1;
          if (prevBehindX || prevBehindY) {
            visit(j);
          }
        }
        visiting[idx] = 0;
        visited[idx] = 1;
        ordered.push(cur);
      };

      for (let i = 0; i < n; i++) {
        visit(i);
      }

      for (const item of ordered) {
        item.draw();
      }

      ctx.restore();

      if (preset.ambientDark > 0) {
        ctx.fillStyle = `rgba(6, 12, 26, ${preset.ambientDark * 0.32})`;
        ctx.fillRect(0, 0, this.viewW, this.viewH);
      }

      this.renderMinimap(state);
    }

    drawGround(preset, now, clickTarget) {
      const ctx = this.ctx;
      const W = this.data.MAP_WIDTH;
      const H = this.data.MAP_HEIGHT;

      this.drawIsoRect(0, 0, W, H, preset.grassA, "rgba(255,255,255,0.08)");

      for (let gx = 0; gx < W; gx += 2) {
        for (let gy = 0; gy < H; gy += 2) {
          if (((gx + gy) / 2) % 2 === 0) {
            this.drawIsoRect(gx, gy, 2, 2, preset.grassB);
          }
        }
      }

      for (const r of this.data.ROADS) {
        this.drawIsoRect(r.x - 0.15, r.y - 0.15, r.w + 0.3, r.h + 0.3, preset.roadEdge);
        this.drawIsoRect(r.x, r.y, r.w, r.h, preset.road);
      }

      const plazaCenter = worldToIso(22, 19.6);
      ctx.save();
      ctx.translate(plazaCenter.x, plazaCenter.y);
      ctx.scale(1, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 96, 0, Math.PI * 2);
      ctx.fillStyle = "#64748b";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#cbd5e1";
      ctx.stroke();
      ctx.restore();

      this.drawIsoRect(17.5, 29.8, 9, 5.6, "#9a3412", "#f8fafc");
      this.drawIsoRect(18, 30.2, 8, 4.8, "#c2410c", "#ffffff");
      const c1 = worldToIso(22, 30.2);
      const c2 = worldToIso(22, 35.0);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();

      if (clickTarget) {
        const tp = worldToIso(clickTarget.x, clickTarget.y);
        const pulse = 10 + Math.sin(now * 8) * 3;
        ctx.save();
        ctx.translate(tp.x, tp.y);
        ctx.scale(1, 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    drawBuilding(b, preset, highlighted, now) {
      const ctx = this.ctx;
      const heightPx = b.floors * FLOOR_HEIGHT + 18;

      const pTop = worldToIso(b.x, b.y);
      const pRight = worldToIso(b.x + b.w, b.y);
      const pBottom = worldToIso(b.x + b.w, b.y + b.h);
      const pLeft = worldToIso(b.x, b.y + b.h);

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.moveTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x + 18, pRight.y + 10);
      ctx.lineTo(pBottom.x + 18, pBottom.y + 10);
      ctx.lineTo(pLeft.x + 10, pLeft.y + 6);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.lineTo(pBottom.x, pBottom.y - heightPx);
      ctx.lineTo(pLeft.x, pLeft.y - heightPx);
      ctx.closePath();
      ctx.fillStyle = preset.ambientDark > 0.3 ? shadeColor(b.wallColor, 0.72) : b.wallColor;
      ctx.fill();
      ctx.strokeStyle = "rgba(15,23,42,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pBottom.x, pBottom.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x, pRight.y - heightPx);
      ctx.lineTo(pBottom.x, pBottom.y - heightPx);
      ctx.closePath();
      ctx.fillStyle = preset.ambientDark > 0.3 ? shadeColor(b.sideColor, 0.65) : b.sideColor;
      ctx.fill();
      ctx.stroke();

      const winCols = Math.max(2, Math.floor(b.w * 0.9));
      for (let f = 0; f < b.floors; f++) {
        const yOff = 14 + f * FLOOR_HEIGHT;
        for (let c = 0; c < winCols; c++) {
          const t0 = (c + 0.25) / winCols;
          const t1 = (c + 0.7) / winCols;
          const x0 = pLeft.x + (pBottom.x - pLeft.x) * t0;
          const y0 = pLeft.y + (pBottom.y - pLeft.y) * t0 - yOff;
          const x1 = pLeft.x + (pBottom.x - pLeft.x) * t1;
          const y1 = pLeft.y + (pBottom.y - pLeft.y) * t1 - yOff;

          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.lineTo(x1, y1 - 10);
          ctx.lineTo(x0, y0 - 10);
          ctx.closePath();
          ctx.fillStyle = preset.windowGlow ? "#fde047" : "#38bdf8";
          ctx.fill();
        }
      }

      const doorMidX = (pLeft.x + pBottom.x) * 0.5;
      const doorMidY = (pLeft.y + pBottom.y) * 0.5;
      ctx.beginPath();
      ctx.moveTo(doorMidX - 10, doorMidY - 5);
      ctx.lineTo(doorMidX + 10, doorMidY + 5);
      ctx.lineTo(doorMidX + 10, doorMidY - 14);
      ctx.lineTo(doorMidX - 10, doorMidY - 24);
      ctx.closePath();
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y - heightPx);
      ctx.lineTo(pRight.x, pRight.y - heightPx);
      ctx.lineTo(pBottom.x, pBottom.y - heightPx);
      ctx.lineTo(pLeft.x, pLeft.y - heightPx);
      ctx.closePath();
      ctx.fillStyle = b.roofColor;
      ctx.fill();
      ctx.strokeStyle = highlighted ? "#fbbf24" : b.trimColor;
      ctx.lineWidth = highlighted ? 3 : 2;
      ctx.stroke();

      if (b.isMosque) {
        const cx = (pTop.x + pBottom.x) / 2;
        const cy = (pTop.y + pBottom.y) / 2 - heightPx;
        ctx.beginPath();
        ctx.arc(cx, cy - 6, 22, Math.PI, 0);
        ctx.closePath();
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const labelX = (pTop.x + pBottom.x) / 2;
      const labelY =
        (pTop.y + pBottom.y) / 2 -
        heightPx -
        (b.isMosque ? 34 : 18) +
        (highlighted ? Math.sin(now * 5) * 3 : 0);
      ctx.font = "700 11px Segoe UI, sans-serif";
      const textW = ctx.measureText(b.shortName).width + 16;
      ctx.fillStyle = highlighted ? "rgba(245, 158, 11, 0.95)" : "rgba(15, 23, 42, 0.86)";
      this.roundRect(labelX - textW / 2, labelY - 12, textW, 22, 7);
      ctx.fill();
      ctx.fillStyle = highlighted ? "#0f172a" : "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.shortName, labelX, labelY - 1);
    }

    drawMainGate(preset) {
      const ctx = this.ctx;
      const leftP = worldToIso(20.1, 40.3);
      const rightP = worldToIso(23.9, 40.3);

      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(leftP.x - 8, leftP.y - 44, 16, 44);
      ctx.fillRect(rightP.x - 8, rightP.y - 44, 16, 44);

      ctx.beginPath();
      ctx.moveTo(leftP.x - 10, leftP.y - 44);
      ctx.lineTo(rightP.x + 10, rightP.y - 44);
      ctx.lineTo(rightP.x + 10, rightP.y - 62);
      ctx.lineTo(leftP.x - 10, leftP.y - 62);
      ctx.closePath();
      ctx.fillStyle = preset.ambientDark > 0.3 ? "#065f46" : "#047857";
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();

      const midX = (leftP.x + rightP.x) / 2;
      const midY = (leftP.y + rightP.y) / 2 - 53;
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 10px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("POLITEKNIK NEGERI TANAH LAUT", midX, midY);
    }

    drawFountain(wx, wy, now) {
      const ctx = this.ctx;
      const p = worldToIso(wx, wy);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fillStyle = "#94a3b8";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = "#0ea5e9";
      ctx.fill();

      const ripple = 6 + ((now * 14) % 14);
      ctx.beginPath();
      ctx.arc(0, 0, ripple, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#bae6fd";
      const h = 14 + Math.sin(now * 7) * 3;
      ctx.fillRect(p.x - 2, p.y - h, 4, h);
    }

    drawFlagpole(wx, wy, now) {
      const ctx = this.ctx;
      const p = worldToIso(wx, wy);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y - 54);
      ctx.stroke();

      const wave = Math.sin(now * 5) * 2.5;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(p.x + 1, p.y - 53, 20, 7 + wave * 0.2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x + 1, p.y - 46 + wave * 0.2, 20, 7);
    }

    drawTree(wx, wy, preset) {
      const ctx = this.ctx;
      const p = worldToIso(wx, wy);

      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(p.x + 4, p.y + 2, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#78350f";
      ctx.fillRect(p.x - 3, p.y - 16, 6, 16);

      const darkLeaf = preset.ambientDark > 0.3 ? "#14532d" : "#15803d";
      const lightLeaf = preset.ambientDark > 0.3 ? "#166534" : "#22c55e";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 24, 15, 0, Math.PI * 2);
      ctx.fillStyle = darkLeaf;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x - 4, p.y - 28, 11, 0, Math.PI * 2);
      ctx.fillStyle = lightLeaf;
      ctx.fill();
    }

    drawBench(wx, wy) {
      const ctx = this.ctx;
      const p = worldToIso(wx, wy);
      ctx.fillStyle = "#92400e";
      ctx.fillRect(p.x - 12, p.y - 8, 24, 5);
      ctx.fillStyle = "#451a03";
      ctx.fillRect(p.x - 10, p.y - 3, 3, 4);
      ctx.fillRect(p.x + 7, p.y - 3, 3, 4);
    }

    drawLampPost(wx, wy, preset) {
      const ctx = this.ctx;
      const p = worldToIso(wx, wy);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y - 32);
      ctx.stroke();

      if (preset.windowGlow) {
        const glow = ctx.createRadialGradient(p.x, p.y - 34, 2, p.x, p.y - 34, 34);
        glow.addColorStop(0, "rgba(253, 224, 71, 0.7)");
        glow.addColorStop(1, "rgba(253, 224, 71, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 34, 34, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y - 34, 4, 0, Math.PI * 2);
      ctx.fillStyle = preset.windowGlow ? "#fef08a" : "#cbd5e1";
      ctx.fill();
    }

    drawCharacter(actor, now, isLocal, isHighlightedNpc, activeQuest) {
      const ctx = this.ctx;
      const p = worldToIso(actor.x, actor.y);
      const activeEmote = actor.emote && actor.emoteUntil > now ? actor.emote : null;

      // Interactive emote body motion!
      let jumpY = 0;
      let leanX = 0;
      let tiltAngle = 0;
      // Eating animation!
      const isEating = activeEmote === "🍲" || activeEmote === "🍛" || activeEmote === "🧋" || activeEmote === "🍢" || activeEmote === "🍽️";
      if (activeEmote === "💃" || activeEmote === "🎉") {
        jumpY = Math.abs(Math.sin(now * 10)) * 7;
        leanX = Math.sin(now * 8) * 3;
        tiltAngle = Math.sin(now * 8) * 0.14;
      } else if (activeEmote === "❤️") {
        jumpY = Math.abs(Math.sin(now * 7)) * 6;
      } else if (activeEmote === "👋") {
        leanX = Math.sin(now * 6) * 1.5;
      } else if (activeEmote === "☕" || isEating) {
        jumpY = Math.abs(Math.sin(now * 9)) * 2.2;
        tiltAngle = Math.sin(now * 6) * 0.05;
      } else if (activeEmote === "💻") {
        jumpY = Math.abs(Math.sin(now * 16)) * 0.9;
      } else if (activeEmote === "📸") {
        tiltAngle = -0.06;
      }

      const walkBob = actor.moving ? Math.abs(Math.sin(now * 12)) * 3.5 : Math.sin(now * 2.5) * 0.8;
      const bob = walkBob + jumpY;
      const legSwing = actor.moving
        ? Math.sin(now * 12) * 3
        : activeEmote === "💃" || activeEmote === "🎉"
        ? Math.sin(now * 10) * 2.5
        : 0;

      // Ground shadow
      ctx.fillStyle = isLocal
        ? "rgba(16, 185, 129, 0.38)"
        : isHighlightedNpc
        ? "rgba(245, 158, 11, 0.45)"
        : "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 1, 11.5 - jumpY * 0.35, 5.5 - jumpY * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isLocal) {
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (isHighlightedNpc) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      const cx = p.x + leanX;
      const style = actor.style || "casual";
      const isFurry = style === "fox" || style === "cat" || style === "panda" || style === "bunny";

      ctx.save();
      ctx.translate(cx, p.y - 12);
      ctx.rotate(tiltAngle);
      ctx.translate(-cx, -(p.y - 12));

      // Animated Animal Tail for furry costumes (drawn behind body)
      if (isFurry) {
        const wag = Math.sin(now * (activeEmote ? 12 : 5)) * 4;
        if (style === "fox") {
          ctx.beginPath();
          ctx.ellipse(cx - 10, p.y - 14 - bob * 0.6 + wag * 0.3, 8, 4.5, -0.4 + wag * 0.05, 0, Math.PI * 2);
          ctx.fillStyle = "#ea580c";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx - 16, p.y - 16 - bob * 0.6 + wag * 0.4, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#fff7ed";
          ctx.fill();
        } else if (style === "cat") {
          ctx.strokeStyle = actor.color || "#a855f7";
          ctx.lineWidth = 3.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx - 6, p.y - 12 - bob * 0.5);
          ctx.quadraticCurveTo(cx - 16, p.y - 18 + wag, cx - 14, p.y - 26 + wag * 0.5);
          ctx.stroke();
        } else if (style === "panda" || style === "bunny") {
          ctx.beginPath();
          ctx.arc(cx - 8, p.y - 12 - bob * 0.5, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = "#f8fafc";
          ctx.fill();
        }
      }

      // Legs
      ctx.fillStyle = isFurry ? this.getFurryLegColor(style, actor.color) : "#1e293b";
      ctx.fillRect(cx - 5, p.y - 10 + legSwing * 0.4, 4, 10);
      ctx.fillRect(cx + 1, p.y - 10 - legSwing * 0.4, 4, 10);

      // Torso (Almamater or Animal Onesie)
      const suitColor = isFurry ? this.getFurrySuitColor(style, actor.color) : actor.color || "#10b981";
      ctx.fillStyle = suitColor;
      this.roundRect(cx - 7.5, p.y - 23 - bob, 15, 14, 4);
      ctx.fill();

      // Cute belly patch for furry onesies
      if (isFurry) {
        ctx.fillStyle = "#fffbeb";
        this.roundRect(cx - 4, p.y - 21 - bob, 8, 9, 3);
        ctx.fill();
      }

      // Animated Arms (React to walking & emotes!)
      this.drawAnimatedArms(cx, p.y, bob, now, activeEmote, actor.moving, suitColor);

      // Head & Animal Hood / Accessories
      if (isFurry) {
        this.drawFurryHead(cx, p.y - 30 - bob, style, suitColor);
      } else {
        ctx.beginPath();
        ctx.arc(cx, p.y - 30 - bob, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fde68a";
        ctx.fill();

        if (style === "hijab") {
          ctx.beginPath();
          ctx.arc(cx, p.y - 30.5 - bob, 8.6, Math.PI * 0.85, Math.PI * 2.15);
          ctx.fillStyle = shadeColor(actor.color || "#10b981", 0.85);
          ctx.fill();
        } else if (style === "cap") {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(cx - 8, p.y - 37 - bob, 16, 4);
          ctx.fillRect(cx - 4, p.y - 40 - bob, 10, 4);
        } else {
          ctx.beginPath();
          ctx.arc(cx, p.y - 32 - bob, 7.6, Math.PI, 0);
          ctx.fillStyle = "#1e293b";
          ctx.fill();
        }

        if (style === "glasses") {
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 1.3;
          ctx.strokeRect(cx - 5.5, p.y - 32 - bob, 4.5, 3);
          ctx.strokeRect(cx + 1, p.y - 32 - bob, 4.5, 3);
        }
      }

      ctx.restore();

      // Extra Emote Props / Particles around character
      if (activeEmote === "📸" && Math.sin(now * 10) > 0.75) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.beginPath();
        ctx.arc(cx + 12, p.y - 26 - bob, 11, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeEmote === "🎉" || activeEmote === "💃") {
        const colors = ["#fbbf24", "#34d399", "#f472b6", "#38bdf8"];
        for (let i = 0; i < 4; i++) {
          const ang = now * 4 + i * 1.57;
          const sx = cx + Math.cos(ang) * 16;
          const sy = p.y - 28 - bob + Math.sin(ang * 2) * 6;
          ctx.fillStyle = colors[i];
          ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
        }
      } else if (activeEmote === "❤️") {
        ctx.font = "12px Segoe UI Emoji, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💖", cx - 11, p.y - 34 - bob - ((now * 14) % 10));
        ctx.fillText("✨", cx + 11, p.y - 30 - bob - ((now * 10) % 8));
      } else if (
        activeEmote === "🍲" ||
        activeEmote === "🍛" ||
        activeEmote === "🧋" ||
        activeEmote === "🍢" ||
        activeEmote === "🍽️"
      ) {
        ctx.font = "13px Segoe UI Emoji, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("😋", cx - 12, p.y - 32 - bob - ((now * 12) % 9));
        ctx.fillText("✨", cx + 12, p.y - 28 - bob - ((now * 9) % 8));
      }

      // Nametag
      ctx.font = "700 10.5px Segoe UI, sans-serif";
      const tag = actor.isFurry ? `🐾 ${actor.name}` : actor.name;
      const tagW = ctx.measureText(tag).width + 12;
      const tagY = p.y - (style === "bunny" ? 56 : 50) - bob;
      ctx.fillStyle = isLocal
        ? "rgba(16, 185, 129, 0.92)"
        : actor.isFurry
        ? "rgba(249, 115, 22, 0.92)"
        : "rgba(15, 23, 42, 0.82)";
      this.roundRect(cx - tagW / 2, tagY - 8, tagW, 16, 5);
      ctx.fill();
      ctx.fillStyle = isLocal ? "#052e16" : "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, cx, tagY);

      // Quest indicator badge above NPCs
      if (actor.phrases && !activeEmote) {
        const hasThisTarget = activeQuest && activeQuest.npcId === actor.id;
        const symbol = hasThisTarget && activeQuest.completed ? "?" : "!";
        const qColor = hasThisTarget && activeQuest.completed ? "#34d399" : "#fbbf24";
        ctx.font = "800 12px Segoe UI, sans-serif";
        ctx.fillStyle = qColor;
        ctx.fillText(symbol, cx, tagY - 15 - Math.sin(now * 4) * 2);
      }

      // Emote floating above nametag
      if (activeEmote) {
        ctx.font = "18px Segoe UI Emoji, sans-serif";
        ctx.fillText(activeEmote, cx, tagY - 19 - Math.sin(now * 8) * 2);
      }

      // Speech Bubble
      if (actor.bubble && actor.bubbleUntil > now) {
        ctx.font = "600 11px Segoe UI, sans-serif";
        const msg = actor.bubble.length > 42 ? actor.bubble.slice(0, 40) + "…" : actor.bubble;
        const bw = ctx.measureText(msg).width + 16;
        const by = tagY - (activeEmote ? 42 : 24);
        ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
        this.roundRect(cx - bw / 2, by - 12, bw, 22, 8);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillText(msg, cx, by - 1);
      }
    }

    drawAnimatedArms(cx, py, bob, now, activeEmote, moving, color) {
      const ctx = this.ctx;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";

      let lEndX = cx - 10;
      let lEndY = py - 14 - bob + (moving ? Math.sin(now * 12) * 3 : 0);
      let rEndX = cx + 10;
      let rEndY = py - 14 - bob - (moving ? Math.sin(now * 12) * 3 : 0);

      if (activeEmote === "👋") {
        // Right arm raised high & waving!
        rEndX = cx + 13 + Math.sin(now * 14) * 4;
        rEndY = py - 32 - bob;
      } else if (activeEmote === "💃" || activeEmote === "🎉") {
        lEndX = cx - 12;
        lEndY = py - 27 - bob + Math.sin(now * 12) * 5;
        rEndX = cx + 12;
        rEndY = py - 27 - bob - Math.sin(now * 12) * 5;
      } else if (activeEmote === "☕") {
        rEndX = cx + 9;
        rEndY = py - 24 - bob + Math.sin(now * 3) * 1.5;
        // Coffee cup
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(rEndX - 2, rEndY - 4, 5, 5);
      } else if (activeEmote === "💻") {
        lEndX = cx - 4;
        lEndY = py - 19 - bob + Math.sin(now * 20) * 1.5;
        rEndX = cx + 4;
        rEndY = py - 19 - bob - Math.sin(now * 20) * 1.5;
        // Tiny glowing laptop
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(cx - 5, py - 22 - bob, 10, 4);
      } else if (activeEmote === "📸") {
        rEndX = cx + 8;
        rEndY = py - 27 - bob;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(rEndX - 3, rEndY - 3, 6, 4);
      } else if (activeEmote === "❤️") {
        lEndX = cx - 11;
        lEndY = py - 28 - bob;
        rEndX = cx + 11;
        rEndY = py - 28 - bob;
      } else if (
        activeEmote === "🍲" ||
        activeEmote === "🍛" ||
        activeEmote === "🧋" ||
        activeEmote === "🍢" ||
        activeEmote === "🍽️"
      ) {
        // Left hand holds bowl/plate, right hand lifts food/spoon to mouth!
        lEndX = cx - 5;
        lEndY = py - 22 - bob;
        rEndX = cx + 3;
        rEndY = py - 26 - bob + Math.sin(now * 12) * 3;
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.arc(cx - 5, py - 23 - bob, 4, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = "#f97316";
        ctx.fillRect(cx - 8, py - 25 - bob, 6, 2);
      }

      ctx.beginPath();
      ctx.moveTo(cx - 6, py - 21 - bob);
      ctx.lineTo(lEndX, lEndY);
      ctx.moveTo(cx + 6, py - 21 - bob);
      ctx.lineTo(rEndX, rEndY);
      ctx.stroke();
    }

    getFurrySuitColor(style, fallback) {
      if (style === "fox") return "#f97316";
      if (style === "cat") return fallback || "#a855f7";
      if (style === "panda") return "#1e293b";
      if (style === "bunny") return "#38bdf8";
      return fallback || "#10b981";
    }

    getFurryLegColor(style, fallback) {
      if (style === "fox") return "#c2410c";
      if (style === "panda") return "#0f172a";
      if (style === "bunny") return "#0284c7";
      return shadeColor(fallback || "#a855f7", 0.75);
    }

    drawFurryHead(cx, cy, style, suitColor) {
      const ctx = this.ctx;
      const hoodColor = style === "panda" ? "#f8fafc" : suitColor;

      // Animal Ears
      if (style === "fox" || style === "cat") {
        // Pointed ears
        ctx.fillStyle = hoodColor;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 3);
        ctx.lineTo(cx - 10, cy - 14);
        ctx.lineTo(cx - 2, cy - 7);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 8, cy - 3);
        ctx.lineTo(cx + 10, cy - 14);
        ctx.lineTo(cx + 2, cy - 7);
        ctx.closePath();
        ctx.fill();

        // Inner ear
        ctx.fillStyle = style === "fox" ? "#fff7ed" : "#fbcfe8";
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - 5);
        ctx.lineTo(cx - 8.5, cy - 11.5);
        ctx.lineTo(cx - 3.5, cy - 7);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 7, cy - 5);
        ctx.lineTo(cx + 8.5, cy - 11.5);
        ctx.lineTo(cx + 3.5, cy - 7);
        ctx.closePath();
        ctx.fill();
      } else if (style === "panda") {
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(cx - 7, cy - 7, 4, 0, Math.PI * 2);
        ctx.arc(cx + 7, cy - 7, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === "bunny") {
        ctx.fillStyle = hoodColor;
        ctx.beginPath();
        ctx.ellipse(cx - 4.5, cy - 13, 3, 7.5, -0.15, 0, Math.PI * 2);
        ctx.ellipse(cx + 4.5, cy - 13, 3, 7.5, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fbcfe8";
        ctx.beginPath();
        ctx.ellipse(cx - 4.5, cy - 13, 1.4, 5, -0.15, 0, Math.PI * 2);
        ctx.ellipse(cx + 4.5, cy - 13, 1.4, 5, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hood Head
      ctx.beginPath();
      ctx.arc(cx, cy, 8.5, 0, Math.PI * 2);
      ctx.fillStyle = hoodColor;
      ctx.fill();

      // Cute Muzzle / Face mask
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 6, 4.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = style === "panda" ? "#ffffff" : "#fff7ed";
      ctx.fill();

      // Panda eye patches
      if (style === "panda") {
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.ellipse(cx - 3.2, cy - 1.5, 2.4, 2, -0.3, 0, Math.PI * 2);
        ctx.ellipse(cx + 3.2, cy - 1.5, 2.4, 2, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyes
      ctx.fillStyle = style === "panda" ? "#ffffff" : "#0f172a";
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 1.5, 1.2, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 1.5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = style === "cat" || style === "bunny" ? "#f472b6" : "#0f172a";
      ctx.beginPath();
      ctx.arc(cx, cy + 1.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    roundRect(x, y, w, h, r) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    renderMinimap(state) {
      const mctx = this.mctx;
      const cw = this.minimap.width;
      const ch = this.minimap.height;
      const sx = cw / this.data.MAP_WIDTH;
      const sy = ch / this.data.MAP_HEIGHT;

      mctx.clearRect(0, 0, cw, ch);
      mctx.fillStyle = "#123524";
      mctx.fillRect(0, 0, cw, ch);

      mctx.fillStyle = "#475569";
      for (const r of this.data.ROADS) {
        mctx.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
      }

      for (const b of this.data.BUILDINGS) {
        mctx.fillStyle = b.roofColor;
        mctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
      }

      for (const npc of state.npcs) {
        mctx.fillStyle = npc.isFurry ? "#fb923c" : "#fbbf24";
        mctx.beginPath();
        mctx.arc(npc.x * sx, npc.y * sy, 2.5, 0, Math.PI * 2);
        mctx.fill();
      }

      mctx.fillStyle = "#38bdf8";
      for (const rp of state.remotePlayers) {
        mctx.beginPath();
        mctx.arc(rp.x * sx, rp.y * sy, 3, 0, Math.PI * 2);
        mctx.fill();
      }

      mctx.fillStyle = "#34d399";
      mctx.beginPath();
      mctx.arc(state.player.x * sx, state.player.y * sy, 4, 0, Math.PI * 2);
      mctx.fill();
      mctx.strokeStyle = "#ffffff";
      mctx.lineWidth = 1.2;
      mctx.stroke();
    }

    renderCanteen(state, now) {
      const ctx = this.ctx;
      const room = this.data.CANTEEN_INTERIOR;

      // Cozy warm indoor background
      const grad = ctx.createLinearGradient(0, 0, 0, this.viewH);
      grad.addColorStop(0, "#1f120b");
      grad.addColorStop(1, "#3b1d12");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      ctx.save();
      ctx.translate(this.viewW / 2, this.viewH / 2);
      ctx.scale(this.camera.zoom, this.camera.zoom);
      ctx.translate(-this.camera.x, -this.camera.y);

      // Tiled canteen floor
      this.drawIsoRect(0, 0, room.width, room.height, "#fef3c7", "#d97706");
      for (let gx = 0; gx < room.width; gx += 1) {
        for (let gy = 0; gy < room.height; gy += 1) {
          if ((gx + gy) % 2 === 0) {
            this.drawIsoRect(gx, gy, 1, 1, "#fde68a");
          }
        }
      }

      // Exit doorway glowing mat
      this.drawIsoRect(6.9, 12.6, 2.2, 1.3, "#10b981", "#ffffff");
      const exP = worldToIso(8, 13.25);
      ctx.font = "800 10px Segoe UI, sans-serif";
      ctx.fillStyle = "#052e16";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KELUAR 🚪", exP.x, exP.y);

      // Click target indicator
      if (state.clickTarget) {
        const tp = worldToIso(state.clickTarget.x, state.clickTarget.y);
        const pulse = 10 + Math.sin(now * 8) * 3;
        ctx.save();
        ctx.translate(tp.x, tp.y);
        ctx.scale(1, 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      // Back canteen walls (north & west)
      this.drawCanteenWalls(room.width, room.height);

      // Food interactive floor highlights
      for (const food of room.foodItems) {
        const isNear = state.nearbyFood && state.nearbyFood.id === food.id;
        const fp = worldToIso(food.spot.x, food.spot.y);
        ctx.save();
        ctx.translate(fp.x, fp.y);
        ctx.scale(1, 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, isNear ? 22 + Math.sin(now * 6) * 3 : 16, 0, Math.PI * 2);
        ctx.fillStyle = isNear ? "rgba(249, 115, 22, 0.28)" : "rgba(245, 158, 11, 0.14)";
        ctx.fill();
        ctx.strokeStyle = isNear ? "#fbbf24" : "rgba(245, 158, 11, 0.5)";
        ctx.lineWidth = isNear ? 2.5 : 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Depth-sorted interior props & actors
      const drawables = [];
      for (const c of room.counters) {
        drawables.push({
          x0: c.x,
          y0: c.y,
          x1: c.x + c.w,
          y1: c.y + c.h,
          cx: c.x + c.w * 0.5,
          cy: c.y + c.h * 0.5,
          draw: () => this.drawCanteenCounter(c, now)
        });
      }

      for (const t of room.tables) {
        const nearFood = state.nearbyFood;
        const highlighted = nearFood && Math.hypot(nearFood.spot.x - (t.x + t.w / 2), nearFood.spot.y - (t.y + t.h / 2)) < 2.2;
        drawables.push({
          x0: t.x,
          y0: t.y,
          x1: t.x + t.w,
          y1: t.y + t.h,
          cx: t.x + t.w * 0.5,
          cy: t.y + t.h * 0.5,
          draw: () => this.drawCanteenTable(t, highlighted, now)
        });
      }

      const canteenRemotes = state.remotePlayers.filter((rp) => rp.scene === "canteen");
      const allActors = [...state.canteenNpcs, ...canteenRemotes, state.player];
      for (const actor of allActors) {
        drawables.push({
          x0: actor.x - 0.28,
          y0: actor.y - 0.28,
          x1: actor.x + 0.28,
          y1: actor.y + 0.28,
          cx: actor.x,
          cy: actor.y,
          draw: () =>
            this.drawCharacter(
              actor,
              now,
              actor.id === state.player.id,
              state.nearbyNpc && state.nearbyNpc.id === actor.id,
              state.activeQuest
            )
        });
      }

      drawables.sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
      const n = drawables.length;
      const visited = new Uint8Array(n);
      const visiting = new Uint8Array(n);
      const ordered = [];
      const visit = (idx) => {
        if (visited[idx] || visiting[idx]) return;
        visiting[idx] = 1;
        const cur = drawables[idx];
        for (let j = 0; j < n; j++) {
          if (j === idx || visited[j]) continue;
          const prev = drawables[j];
          if ((prev.x1 <= cur.x0 + 0.01 && prev.y0 < cur.y1) || (prev.y1 <= cur.y0 + 0.01 && prev.x0 < cur.x1)) {
            visit(j);
          }
        }
        visiting[idx] = 0;
        visited[idx] = 1;
        ordered.push(cur);
      };
      for (let i = 0; i < n; i++) visit(i);
      for (const item of ordered) item.draw();

      ctx.restore();
      this.renderCanteenMinimap(state, room);
    }

    drawCanteenWalls(w, h) {
      const ctx = this.ctx;
      const wallH = 68;
      const pTop = worldToIso(0, 0);
      const pRight = worldToIso(w, 0);
      const pLeft = worldToIso(0, h);

      // Back-top wall (0,0 -> w,0)
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x, pRight.y - wallH);
      ctx.lineTo(pTop.x, pTop.y - wallH);
      ctx.closePath();
      ctx.fillStyle = "#fed7aa";
      ctx.fill();
      ctx.strokeStyle = "#c2410c";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Back-left wall (0,0 -> 0,h)
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.lineTo(pLeft.x, pLeft.y - wallH);
      ctx.lineTo(pTop.x, pTop.y - wallH);
      ctx.closePath();
      ctx.fillStyle = "#ffedd5";
      ctx.fill();
      ctx.stroke();

      // Menu signboard on back wall
      const mx = (pTop.x + pRight.x) * 0.5;
      const my = (pTop.y + pRight.y) * 0.5 - 38;
      ctx.fillStyle = "#0f172a";
      this.roundRect(mx - 88, my - 15, 176, 30, 8);
      ctx.fill();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fde68a";
      ctx.font = "800 11px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🍜 KANTIN POLITALA • BUKA", mx, my);
    }

    drawCanteenCounter(c, now) {
      const ctx = this.ctx;
      const hPx = 22;
      const pTop = worldToIso(c.x, c.y);
      const pRight = worldToIso(c.x + c.w, c.y);
      const pBottom = worldToIso(c.x + c.w, c.y + c.h);
      const pLeft = worldToIso(c.x, c.y + c.h);

      // Front-left face
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.lineTo(pLeft.x, pLeft.y - hPx);
      ctx.closePath();
      ctx.fillStyle = c.color;
      ctx.fill();

      // Front-right face
      ctx.beginPath();
      ctx.moveTo(pBottom.x, pBottom.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x, pRight.y - hPx);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.closePath();
      ctx.fillStyle = shadeColor(c.color, 0.8);
      ctx.fill();

      // Wooden counter top
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y - hPx);
      ctx.lineTo(pRight.x, pRight.y - hPx);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.lineTo(pLeft.x, pLeft.y - hPx);
      ctx.closePath();
      ctx.fillStyle = "#fef3c7";
      ctx.fill();
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Food items displayed on counter
      const midX = (pTop.x + pBottom.x) * 0.5;
      const midY = (pTop.y + pBottom.y) * 0.5 - hPx;
      ctx.font = "18px Segoe UI Emoji, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const icons = c.id === "stall-1" ? ["🍲", "🍛", "🍗"] : ["🧋", "☕", "🍢"];
      icons.forEach((em, i) => {
        ctx.fillText(em, midX - 28 + i * 28, midY - 4 + Math.sin(now * 3 + i) * 1.5);
      });

      ctx.font = "800 10px Segoe UI, sans-serif";
      const lw = ctx.measureText(c.label).width + 12;
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      this.roundRect(midX - lw / 2, midY - 30, lw, 17, 5);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.fillText(c.label, midX, midY - 21.5);
    }

    drawCanteenTable(t, highlighted, now) {
      const ctx = this.ctx;
      const hPx = 15;
      const pTop = worldToIso(t.x, t.y);
      const pRight = worldToIso(t.x + t.w, t.y);
      const pBottom = worldToIso(t.x + t.w, t.y + t.h);
      const pLeft = worldToIso(t.x, t.y + t.h);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y + 3);
      ctx.lineTo(pBottom.x, pBottom.y + 3);
      ctx.lineTo(pRight.x, pRight.y + 3);
      ctx.lineTo(pTop.x, pTop.y + 3);
      ctx.closePath();
      ctx.fill();

      // Table legs
      ctx.fillStyle = "#78350f";
      ctx.fillRect(pLeft.x - 1, pLeft.y - hPx, 3, hPx);
      ctx.fillRect(pBottom.x - 1, pBottom.y - hPx, 3, hPx);
      ctx.fillRect(pRight.x - 1, pRight.y - hPx, 3, hPx);

      // Table top
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y - hPx);
      ctx.lineTo(pRight.x, pRight.y - hPx);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.lineTo(pLeft.x, pLeft.y - hPx);
      ctx.closePath();
      ctx.fillStyle = highlighted ? "#fed7aa" : "#d97706";
      ctx.fill();
      ctx.strokeStyle = highlighted ? "#ffffff" : "#78350f";
      ctx.lineWidth = highlighted ? 2 : 1.2;
      ctx.stroke();

      // Dish on table
      const cx = (pTop.x + pBottom.x) * 0.5;
      const cy = (pTop.y + pBottom.y) * 0.5 - hPx;
      ctx.font = "20px Segoe UI Emoji, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.dishEmoji, cx, cy - 4 + (highlighted ? Math.sin(now * 6) * 2.5 : 0));

      ctx.font = "700 9.5px Segoe UI, sans-serif";
      const nw = ctx.measureText(t.dishName).width + 10;
      ctx.fillStyle = highlighted ? "rgba(249, 115, 22, 0.95)" : "rgba(15, 23, 42, 0.78)";
      this.roundRect(cx - nw / 2, cy - 25, nw, 15, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(t.dishName, cx, cy - 17.5);
    }

    renderCanteenMinimap(state, room) {
      const mctx = this.mctx;
      const cw = this.minimap.width;
      const ch = this.minimap.height;
      const sx = cw / room.width;
      const sy = ch / room.height;

      mctx.clearRect(0, 0, cw, ch);
      mctx.fillStyle = "#451a03";
      mctx.fillRect(0, 0, cw, ch);

      mctx.fillStyle = "#ea580c";
      for (const c of room.counters) {
        mctx.fillRect(c.x * sx, c.y * sy, c.w * sx, c.h * sy);
      }

      mctx.fillStyle = "#d97706";
      for (const t of room.tables) {
        mctx.fillRect(t.x * sx, t.y * sy, t.w * sx, t.h * sy);
      }

      mctx.fillStyle = "#10b981";
      mctx.fillRect(6.9 * sx, 12.6 * sy, 2.2 * sx, 1.3 * sy);

      for (const npc of state.canteenNpcs) {
        mctx.fillStyle = npc.isFurry ? "#fb923c" : "#fbbf24";
        mctx.beginPath();
        mctx.arc(npc.x * sx, npc.y * sy, 3, 0, Math.PI * 2);
        mctx.fill();
      }

      mctx.fillStyle = "#34d399";
      mctx.beginPath();
      mctx.arc(state.player.x * sx, state.player.y * sy, 4.5, 0, Math.PI * 2);
      mctx.fill();
      mctx.strokeStyle = "#ffffff";
      mctx.lineWidth = 1.2;
      mctx.stroke();
    }

    drawSecretBeringinTree(wx, wy, highlighted, now) {
      const ctx = this.ctx;
      const p = worldToIso(wx, wy);

      // Mystical golden ring on ground
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, highlighted ? 28 + Math.sin(now * 6) * 3 : 22, 0, Math.PI * 2);
      ctx.fillStyle = highlighted ? "rgba(251, 191, 36, 0.25)" : "rgba(16, 185, 129, 0.16)";
      ctx.fill();
      ctx.strokeStyle = highlighted ? "#fbbf24" : "#34d399";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Thick banyan trunk & hanging roots
      ctx.fillStyle = "#451a03";
      ctx.fillRect(p.x - 6, p.y - 26, 12, 26);
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 10, p.y - 26);
      ctx.lineTo(p.x - 12, p.y - 4);
      ctx.moveTo(p.x + 10, p.y - 26);
      ctx.lineTo(p.x + 12, p.y - 4);
      ctx.stroke();

      // Canopy
      ctx.beginPath();
      ctx.arc(p.x, p.y - 34, 22, 0, Math.PI * 2);
      ctx.fillStyle = "#065f46";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x - 6, p.y - 40, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();

      // Floating golden fireflies
      for (let i = 0; i < 3; i++) {
        const fx = p.x + Math.cos(now * 2 + i * 2.1) * 18;
        const fy = p.y - 34 + Math.sin(now * 3 + i * 1.7) * 12;
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = "800 10px Segoe UI, sans-serif";
      const label = "🔒 KELUARGA BERINGIN";
      const lw = ctx.measureText(label).width + 12;
      ctx.fillStyle = highlighted ? "rgba(245, 158, 11, 0.95)" : "rgba(6, 78, 59, 0.9)";
      this.roundRect(p.x - lw / 2, p.y - 68, lw, 17, 5);
      ctx.fill();
      ctx.fillStyle = highlighted ? "#0f172a" : "#fde68a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, p.x, p.y - 59.5);
    }

    renderBeringinMuseum(state, now) {
      const ctx = this.ctx;
      const room = this.data.SECRET_BERINGIN;

      const grad = ctx.createLinearGradient(0, 0, 0, this.viewH);
      grad.addColorStop(0, "#04120e");
      grad.addColorStop(1, "#0b2920");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      ctx.save();
      ctx.translate(this.viewW / 2, this.viewH / 2);
      ctx.scale(this.camera.zoom, this.camera.zoom);
      ctx.translate(-this.camera.x, -this.camera.y);

      // Museum stone floor
      this.drawIsoRect(0, 0, room.width, room.height, "#0f2e24", "#fbbf24");
      for (let gx = 0; gx < room.width; gx += 1) {
        for (let gy = 0; gy < room.height; gy += 1) {
          if ((gx + gy) % 2 === 0) {
            this.drawIsoRect(gx, gy, 1, 1, "#133b2e");
          }
        }
      }

      // Red ceremonial carpet down the center aisle
      this.drawIsoRect(7, 5.2, 2, 7.4, "#7f1d1d", "#fbbf24");

      // Exit doorway glowing mat
      this.drawIsoRect(6.9, 12.6, 2.2, 1.3, "#10b981", "#ffffff");
      const exP = worldToIso(8, 13.25);
      ctx.font = "800 10px Segoe UI, sans-serif";
      ctx.fillStyle = "#052e16";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KELUAR 🚪", exP.x, exP.y);

      if (state.clickTarget) {
        const tp = worldToIso(state.clickTarget.x, state.clickTarget.y);
        const pulse = 10 + Math.sin(now * 8) * 3;
        ctx.save();
        ctx.translate(tp.x, tp.y);
        ctx.scale(1, 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      this.drawBeringinWalls(room.width, room.height);

      // Exhibit interaction rings on floor
      for (const ex of room.exhibits) {
        const isNear = state.nearbyExhibit && state.nearbyExhibit.id === ex.id;
        const fp = worldToIso(ex.spot.x, ex.spot.y);
        ctx.save();
        ctx.translate(fp.x, fp.y);
        ctx.scale(1, 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, isNear ? 22 + Math.sin(now * 6) * 3 : 15, 0, Math.PI * 2);
        ctx.fillStyle = isNear ? "rgba(251, 191, 36, 0.28)" : "rgba(16, 185, 129, 0.14)";
        ctx.fill();
        ctx.strokeStyle = isNear ? "#fbbf24" : "rgba(251, 191, 36, 0.45)";
        ctx.lineWidth = isNear ? 2.5 : 1.3;
        ctx.stroke();
        ctx.restore();
      }

      const drawables = [];

      // Centerpiece Monument Pedestal + Fictional Guardian Statue
      const m = room.monument;
      drawables.push({
        x0: m.x,
        y0: m.y,
        x1: m.x + m.w,
        y1: m.y + m.h,
        cx: m.x + m.w * 0.5,
        cy: m.y + m.h * 0.5,
        draw: () => this.drawBeringinMonument(m, state.nearbyExhibit && state.nearbyExhibit.id === "patung_utama", now)
      });

      for (const ped of room.pedestals) {
        drawables.push({
          x0: ped.x,
          y0: ped.y,
          x1: ped.x + ped.w,
          y1: ped.y + ped.h,
          cx: ped.x + ped.w * 0.5,
          cy: ped.y + ped.h * 0.5,
          draw: () => this.drawMuseumPedestal(ped, now)
        });
      }

      const beringinRemotes = state.remotePlayers.filter((rp) => rp.scene === "beringin");
      const allActors = [...state.beringinNpcs, ...beringinRemotes, state.player];
      for (const actor of allActors) {
        drawables.push({
          x0: actor.x - 0.28,
          y0: actor.y - 0.28,
          x1: actor.x + 0.28,
          y1: actor.y + 0.28,
          cx: actor.x,
          cy: actor.y,
          draw: () =>
            this.drawCharacter(
              actor,
              now,
              actor.id === state.player.id,
              state.nearbyNpc && state.nearbyNpc.id === actor.id,
              state.activeQuest
            )
        });
      }

      drawables.sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
      const n = drawables.length;
      const visited = new Uint8Array(n);
      const visiting = new Uint8Array(n);
      const ordered = [];
      const visit = (idx) => {
        if (visited[idx] || visiting[idx]) return;
        visiting[idx] = 1;
        const cur = drawables[idx];
        for (let j = 0; j < n; j++) {
          if (j === idx || visited[j]) continue;
          const prev = drawables[j];
          if ((prev.x1 <= cur.x0 + 0.01 && prev.y0 < cur.y1) || (prev.y1 <= cur.y0 + 0.01 && prev.x0 < cur.x1)) {
            visit(j);
          }
        }
        visiting[idx] = 0;
        visited[idx] = 1;
        ordered.push(cur);
      };
      for (let i = 0; i < n; i++) visit(i);
      for (const item of ordered) item.draw();

      ctx.restore();
      this.renderBeringinMinimap(state, room);
    }

    drawBeringinWalls(w, h) {
      const ctx = this.ctx;
      const wallH = 74;
      const pTop = worldToIso(0, 0);
      const pRight = worldToIso(w, 0);
      const pLeft = worldToIso(0, h);

      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x, pRight.y - wallH);
      ctx.lineTo(pTop.x, pTop.y - wallH);
      ctx.closePath();
      ctx.fillStyle = "#064e3b";
      ctx.fill();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.lineTo(pLeft.x, pLeft.y - wallH);
      ctx.lineTo(pTop.x, pTop.y - wallH);
      ctx.closePath();
      ctx.fillStyle = "#065f46";
      ctx.fill();
      ctx.stroke();

      const mx = (pTop.x + pRight.x) * 0.5;
      const my = (pTop.y + pRight.y) * 0.5 - 42;
      ctx.fillStyle = "#051912";
      this.roundRect(mx - 108, my - 15, 216, 30, 8);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fde68a";
      ctx.font = "800 11px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🏛️ MUSEUM KELUARGA BERINGIN", mx, my);
    }

    drawBeringinMonument(m, highlighted, now) {
      const ctx = this.ctx;
      const hPx = 24;
      const pTop = worldToIso(m.x, m.y);
      const pRight = worldToIso(m.x + m.w, m.y);
      const pBottom = worldToIso(m.x + m.w, m.y + m.h);
      const pLeft = worldToIso(m.x, m.y + m.h);

      // Pedestal faces
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.lineTo(pLeft.x, pLeft.y - hPx);
      ctx.closePath();
      ctx.fillStyle = "#334155";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pBottom.x, pBottom.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x, pRight.y - hPx);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.closePath();
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y - hPx);
      ctx.lineTo(pRight.x, pRight.y - hPx);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.lineTo(pLeft.x, pLeft.y - hPx);
      ctx.closePath();
      ctx.fillStyle = "#475569";
      ctx.fill();
      ctx.strokeStyle = highlighted ? "#fde047" : "#f59e0b";
      ctx.lineWidth = highlighted ? 2.5 : 1.5;
      ctx.stroke();

      // Fictional Guardian Statue + Sacred Banyan Aura
      const cx = (pTop.x + pBottom.x) * 0.5;
      const cy = (pTop.y + pBottom.y) * 0.5 - hPx;

      const aura = ctx.createRadialGradient(cx, cy - 32, 4, cx, cy - 32, 44);
      aura.addColorStop(0, "rgba(251, 191, 36, 0.42)");
      aura.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy - 32, 44, 0, Math.PI * 2);
      ctx.fill();

      if (this.monumentImg && this.monumentImgLoaded) {
        // Draw user-configured museum portrait/statue inside a gold frame
        ctx.fillStyle = "#f59e0b";
        this.roundRect(cx - 24, cy - 60, 48, 56, 5);
        ctx.fill();
        ctx.save();
        this.roundRect(cx - 21, cy - 57, 42, 50, 3);
        ctx.clip();
        ctx.drawImage(this.monumentImg, cx - 21, cy - 57, 42, 50);
        ctx.restore();
      } else {
        // Statue robe/torso (stylized abstract stone-gold figure)
        ctx.fillStyle = "#047857";
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy - 2);
        ctx.lineTo(cx + 14, cy - 2);
        ctx.lineTo(cx + 9, cy - 32);
        ctx.lineTo(cx - 9, cy - 32);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Statue head & hood silhouette (fictional mask/emblem)
        ctx.beginPath();
        ctx.arc(cx, cy - 41, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.stroke();

        // Golden stylized neutral face emblem
        ctx.beginPath();
        ctx.arc(cx, cy - 40, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#fcd34d";
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(cx - 3.5, cy - 42, 2, 2);
        ctx.fillRect(cx + 1.5, cy - 42, 2, 2);
        ctx.fillRect(cx - 3, cy - 37.5, 6, 1.5);
      }

      // Flickering candles at pedestal corners
      [-1, 1].forEach((side) => {
        const kx = cx + side * 24;
        const ky = cy + 2;
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(kx - 2, ky - 8, 4, 8);
        ctx.beginPath();
        ctx.arc(kx, ky - 10 + Math.sin(now * 14 + side) * 1, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fb923c";
        ctx.fill();
      });

      ctx.font = "800 10px Segoe UI, sans-serif";
      const label = "🗿 PATUNG PENJAGA BERINGIN";
      const lw = ctx.measureText(label).width + 14;
      ctx.fillStyle = highlighted ? "rgba(245, 158, 11, 0.95)" : "rgba(15, 23, 42, 0.9)";
      this.roundRect(cx - lw / 2, cy - 70, lw, 18, 5);
      ctx.fill();
      ctx.fillStyle = highlighted ? "#0f172a" : "#fde68a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx, cy - 61);
    }

    drawMuseumPedestal(ped, now) {
      const ctx = this.ctx;
      const hPx = 18;
      const pTop = worldToIso(ped.x, ped.y);
      const pRight = worldToIso(ped.x + ped.w, ped.y);
      const pBottom = worldToIso(ped.x + ped.w, ped.y + ped.h);
      const pLeft = worldToIso(ped.x, ped.y + ped.h);

      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.lineTo(pLeft.x, pLeft.y - hPx);
      ctx.closePath();
      ctx.fillStyle = "#334155";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pBottom.x, pBottom.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x, pRight.y - hPx);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.closePath();
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y - hPx);
      ctx.lineTo(pRight.x, pRight.y - hPx);
      ctx.lineTo(pBottom.x, pBottom.y - hPx);
      ctx.lineTo(pLeft.x, pLeft.y - hPx);
      ctx.closePath();
      ctx.fillStyle = "#64748b";
      ctx.fill();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const cx = (pTop.x + pBottom.x) * 0.5;
      const cy = (pTop.y + pBottom.y) * 0.5 - hPx;
      ctx.font = "20px Segoe UI Emoji, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ped.icon, cx, cy - 10 + Math.sin(now * 3) * 2);

      ctx.font = "700 9.5px Segoe UI, sans-serif";
      const lw = ctx.measureText(ped.label).width + 10;
      ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
      this.roundRect(cx - lw / 2, cy - 30, lw, 15, 4);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.fillText(ped.label, cx, cy - 22.5);
    }

    renderBeringinMinimap(state, room) {
      const mctx = this.mctx;
      const cw = this.minimap.width;
      const ch = this.minimap.height;
      const sx = cw / room.width;
      const sy = ch / room.height;

      mctx.clearRect(0, 0, cw, ch);
      mctx.fillStyle = "#06231a";
      mctx.fillRect(0, 0, cw, ch);

      const m = room.monument;
      mctx.fillStyle = "#f59e0b";
      mctx.fillRect(m.x * sx, m.y * sy, m.w * sx, m.h * sy);

      mctx.fillStyle = "#64748b";
      for (const ped of room.pedestals) {
        mctx.fillRect(ped.x * sx, ped.y * sy, ped.w * sx, ped.h * sy);
      }

      mctx.fillStyle = "#10b981";
      mctx.fillRect(6.9 * sx, 12.6 * sy, 2.2 * sx, 1.3 * sy);

      for (const npc of state.beringinNpcs) {
        mctx.fillStyle = npc.isFurry ? "#fb923c" : "#fbbf24";
        mctx.beginPath();
        mctx.arc(npc.x * sx, npc.y * sy, 3, 0, Math.PI * 2);
        mctx.fill();
      }

      mctx.fillStyle = "#34d399";
      mctx.beginPath();
      mctx.arc(state.player.x * sx, state.player.y * sy, 4.5, 0, Math.PI * 2);
      mctx.fill();
      mctx.strokeStyle = "#ffffff";
      mctx.lineWidth = 1.2;
      mctx.stroke();
    }
  }

  global.PolitalaRenderer = IsometricRenderer;
})(window);
