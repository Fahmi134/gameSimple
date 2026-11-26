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
      const ctx = this.ctx;
      const preset = this.getTimePreset();
      const now = performance.now() * 0.001;

      // Sky background
      const grad = ctx.createLinearGradient(0, 0, 0, this.viewH);
      grad.addColorStop(0, preset.skyTop);
      grad.addColorStop(1, preset.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      ctx.save();
      ctx.translate(this.viewW / 2, this.viewH / 2);
      ctx.scale(this.camera.zoom, this.camera.zoom);
      ctx.translate(-this.camera.x, -this.camera.y);

      // Campus ground base
      this.drawGround(preset, now, state.clickTarget);

      // Collect 2D footprints for exact isometric painter's topological sort
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

      // Main Gate Archway
      drawables.push({
        x0: 20,
        y0: 40.1,
        x1: 24,
        y1: 40.5,
        cx: 22,
        cy: 40.3,
        draw: () => this.drawMainGate(preset)
      });

      // Plaza Fountain
      drawables.push({
        x0: 21.1,
        y0: 18.7,
        x1: 22.9,
        y1: 20.5,
        cx: 22,
        cy: 19.6,
        draw: () => this.drawFountain(22, 19.6, now)
      });

      // Flagpole in front of Rektorat
      drawables.push({
        x0: 21.8,
        y0: 17.3,
        x1: 22.2,
        y1: 17.7,
        cx: 22,
        cy: 17.5,
        draw: () => this.drawFlagpole(22, 17.5, now)
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

      // Characters (NPCs + remote players + local player)
      const allActors = [...state.npcs, ...state.remotePlayers, state.player];
      for (const actor of allActors) {
        drawables.push({
          x0: actor.x - 0.28,
          y0: actor.y - 0.28,
          x1: actor.x + 0.28,
          y1: actor.y + 0.28,
          cx: actor.x,
          cy: actor.y,
          draw: () => this.drawCharacter(actor, now, actor.id === state.player.id)
        });
      }

      // Pre-sort by center depth, then topological sort so actors in front of walls always render on top
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
          // Draw prev before cur if prev is behind cur along X or Y without being strictly in front on the other axis
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

      // Subtle night vignette overlay
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

      // Outer campus ground
      this.drawIsoRect(0, 0, W, H, preset.grassA, "rgba(255,255,255,0.08)");

      // Subtle checkerboard grass texture (2x2 tiles for performance)
      for (let gx = 0; gx < W; gx += 2) {
        for (let gy = 0; gy < H; gy += 2) {
          if (((gx + gy) / 2) % 2 === 0) {
            this.drawIsoRect(gx, gy, 2, 2, preset.grassB);
          }
        }
      }

      // Paved campus roads
      for (const r of this.data.ROADS) {
        this.drawIsoRect(r.x - 0.15, r.y - 0.15, r.w + 0.3, r.h + 0.3, preset.roadEdge);
        this.drawIsoRect(r.x, r.y, r.w, r.h, preset.road);
      }

      // Plaza circle paving
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

      // Sports Court (Lapangan Olahraga Politala)
      this.drawIsoRect(17.5, 29.8, 9, 5.6, "#9a3412", "#f8fafc");
      this.drawIsoRect(18, 30.2, 8, 4.8, "#c2410c", "#ffffff");
      // Center line
      const c1 = worldToIso(22, 30.2);
      const c2 = worldToIso(22, 35.0);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();

      // Click-to-move destination indicator
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

      // Ground shadow
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.moveTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x + 18, pRight.y + 10);
      ctx.lineTo(pBottom.x + 18, pBottom.y + 10);
      ctx.lineTo(pLeft.x + 10, pLeft.y + 6);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.closePath();
      ctx.fill();

      // Left-front wall (from pLeft to pBottom)
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

      // Right-front wall (from pBottom to pRight)
      ctx.beginPath();
      ctx.moveTo(pBottom.x, pBottom.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x, pRight.y - heightPx);
      ctx.lineTo(pBottom.x, pBottom.y - heightPx);
      ctx.closePath();
      ctx.fillStyle = preset.ambientDark > 0.3 ? shadeColor(b.sideColor, 0.65) : b.sideColor;
      ctx.fill();
      ctx.stroke();

      // Windows on left wall
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

      // Entrance doorway
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

      // Roof
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

      // Mosque dome if mosque
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

      // Building Floating Sign
      const labelX = (pTop.x + pBottom.x) / 2;
      const labelY = (pTop.y + pBottom.y) / 2 - heightPx - (b.isMosque ? 34 : 18) + (highlighted ? Math.sin(now * 5) * 3 : 0);
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

      // Left pillar
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(leftP.x - 8, leftP.y - 44, 16, 44);
      // Right pillar
      ctx.fillRect(rightP.x - 8, rightP.y - 44, 16, 44);

      // Arch beam
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

      // Water spout
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
      // Red top
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(p.x + 1, p.y - 53, 20, 7 + wave * 0.2);
      // White bottom
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x + 1, p.y - 46 + wave * 0.2, 20, 7);
    }

    drawTree(wx, wy, preset) {
      const ctx = this.ctx;
      const p = worldToIso(wx, wy);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(p.x + 4, p.y + 2, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = "#78350f";
      ctx.fillRect(p.x - 3, p.y - 16, 6, 16);

      // Foliage layers
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

    drawCharacter(actor, now, isLocal) {
      const ctx = this.ctx;
      const p = worldToIso(actor.x, actor.y);
      const bob = actor.moving ? Math.abs(Math.sin(now * 12)) * 3.5 : Math.sin(now * 2.5) * 0.8;
      const legSwing = actor.moving ? Math.sin(now * 12) * 3 : 0;

      // Ground shadow
      ctx.fillStyle = isLocal ? "rgba(16, 185, 129, 0.35)" : "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 1, 11, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isLocal) {
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Legs
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(p.x - 5, p.y - 10 + legSwing * 0.4, 4, 10);
      ctx.fillRect(p.x + 1, p.y - 10 - legSwing * 0.4, 4, 10);

      // Torso (Almamater / Outfit)
      ctx.fillStyle = actor.color || "#10b981";
      this.roundRect(p.x - 7, p.y - 23 - bob, 14, 14, 4);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(p.x, p.y - 30 - bob, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a";
      ctx.fill();

      // Style accessory
      if (actor.style === "hijab") {
        ctx.beginPath();
        ctx.arc(p.x, p.y - 30.5 - bob, 8.6, Math.PI * 0.85, Math.PI * 2.15);
        ctx.fillStyle = shadeColor(actor.color || "#10b981", 0.85);
        ctx.fill();
      } else if (actor.style === "cap") {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(p.x - 8, p.y - 37 - bob, 16, 4);
        ctx.fillRect(p.x - 4, p.y - 40 - bob, 10, 4);
      } else {
        // Hair
        ctx.beginPath();
        ctx.arc(p.x, p.y - 32 - bob, 7.6, Math.PI, 0);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
      }

      if (actor.style === "glasses") {
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.3;
        ctx.strokeRect(p.x - 5.5, p.y - 32 - bob, 4.5, 3);
        ctx.strokeRect(p.x + 1, p.y - 32 - bob, 4.5, 3);
      }

      // Nametag
      ctx.font = "700 10.5px Segoe UI, sans-serif";
      const tag = actor.name;
      const tagW = ctx.measureText(tag).width + 12;
      const tagY = p.y - 48 - bob;
      ctx.fillStyle = isLocal ? "rgba(16, 185, 129, 0.9)" : "rgba(15, 23, 42, 0.8)";
      this.roundRect(p.x - tagW / 2, tagY - 8, tagW, 16, 5);
      ctx.fill();
      ctx.fillStyle = isLocal ? "#052e16" : "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag, p.x, tagY);

      // Emote floating above nametag
      if (actor.emote && actor.emoteUntil > now) {
        ctx.font = "18px Segoe UI Emoji, sans-serif";
        ctx.fillText(actor.emote, p.x, tagY - 18 - Math.sin(now * 8) * 2);
      }

      // Speech Bubble
      if (actor.bubble && actor.bubbleUntil > now) {
        ctx.font = "600 11px Segoe UI, sans-serif";
        const msg = actor.bubble.length > 42 ? actor.bubble.slice(0, 40) + "…" : actor.bubble;
        const bw = ctx.measureText(msg).width + 16;
        const by = tagY - (actor.emote && actor.emoteUntil > now ? 40 : 22);
        ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
        this.roundRect(p.x - bw / 2, by - 12, bw, 22, 8);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillText(msg, p.x, by - 1);
      }
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

      // Roads
      mctx.fillStyle = "#475569";
      for (const r of this.data.ROADS) {
        mctx.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
      }

      // Buildings
      for (const b of this.data.BUILDINGS) {
        mctx.fillStyle = b.roofColor;
        mctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
      }

      // NPCs
      mctx.fillStyle = "#fbbf24";
      for (const npc of state.npcs) {
        mctx.beginPath();
        mctx.arc(npc.x * sx, npc.y * sy, 2.5, 0, Math.PI * 2);
        mctx.fill();
      }

      // Remote players
      mctx.fillStyle = "#38bdf8";
      for (const rp of state.remotePlayers) {
        mctx.beginPath();
        mctx.arc(rp.x * sx, rp.y * sy, 3, 0, Math.PI * 2);
        mctx.fill();
      }

      // Local player
      mctx.fillStyle = "#34d399";
      mctx.beginPath();
      mctx.arc(state.player.x * sx, state.player.y * sy, 4, 0, Math.PI * 2);
      mctx.fill();
      mctx.strokeStyle = "#ffffff";
      mctx.lineWidth = 1.2;
      mctx.stroke();
    }
  }

  global.PolitalaRenderer = IsometricRenderer;
})(window);
