(function (global) {
  "use strict";

  class SoundManager {
    constructor() {
      this.enabled = true;
      this.ctx = null;
      this.bgm = new Audio("assets/bgm.mp3");
      this.bgm.loop = true;
      this.bgm.volume = 0.35;
      this.bgm.preload = "auto";
      this.bgmStarted = false;
    }

    startBgm() {
      if (!this.enabled) return;
      const playPromise = this.bgm.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            this.bgmStarted = true;
          })
          .catch(() => {
            // Browser autoplay policy blocked until user gesture; will retry on first tap/click
          });
      }
    }

    setEnabled(flag) {
      this.enabled = Boolean(flag);
      if (!this.enabled) {
        this.bgm.pause();
      } else {
        this.startBgm();
      }
      return this.enabled;
    }

    toggle() {
      return this.setEnabled(!this.enabled);
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
      this.startBgm();
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

    playEat() {
      this.playTone(392, 0.09, "triangle", 0.07, 523);
      setTimeout(() => this.playTone(494, 0.09, "triangle", 0.07, 659), 110);
      setTimeout(() => this.playTone(587, 0.14, "sine", 0.07, 784), 220);
    }

    playQuestComplete() {
      this.playTone(523, 0.11, "triangle", 0.08, 659);
      setTimeout(() => this.playTone(659, 0.11, "triangle", 0.08, 784), 95);
      setTimeout(() => this.playTone(784, 0.22, "triangle", 0.09, 1046), 190);
    }

    playWrong() {
      this.playTone(220, 0.18, "sawtooth", 0.05, 150);
    }
  }

  global.PolitalaAudio = new SoundManager();
})(window);
