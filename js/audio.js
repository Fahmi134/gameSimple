(function (global) {
  "use strict";

  class SoundManager {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    ensureContext() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AudioCtx = global.AudioContext || global.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    playTone(freq, duration, type = "sine", volume = 0.06, slideTo = null) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }

    playJoin() {
      this.playTone(440, 0.12, "triangle", 0.08, 660);
      setTimeout(() => this.playTone(660, 0.16, "triangle", 0.08, 880), 90);
    }

    playChat() {
      this.playTone(587, 0.09, "sine", 0.05, 784);
    }

    playEmote() {
      this.playTone(523, 0.1, "triangle", 0.06, 784);
    }

    playTeleport() {
      this.playTone(330, 0.18, "sine", 0.07, 880);
    }
  }

  global.PolitalaAudio = new SoundManager();
})(window);
