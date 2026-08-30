import { Scene } from "phaser";

interface VoltzGameCallbacks {
  onSwitchPressed: (switchIndex: number) => void;
}

interface RoundResult {
  outcome: "noWin" | "win" | "freeReplay";
  switchTexts: string[];
  prizeName?: string;
  rewardValue?: string;
  rewardType?: string;
}

const LANE_THEME = [
  { hex: 0xff4466, css: "#FF6688" },
  { hex: 0x44aaff, css: "#44AAFF" },
  { hex: 0x44ff88, css: "#44FF88" },
] as const;

export class VoltzGame extends Scene {
  private width!: number;
  private height!: number;
  private currentElectro!: Phaser.GameObjects.Sprite;
  private lightBg!: Phaser.GameObjects.Image;
  private lightOverlay!: Phaser.GameObjects.Rectangle;
  private redBtnImg!: Phaser.GameObjects.Sprite;
  private blueBtnImg!: Phaser.GameObjects.Sprite;
  private greenBtnImg!: Phaser.GameObjects.Sprite;
  private redBtn!: Phaser.Physics.Arcade.Sprite;
  private blueBtn!: Phaser.Physics.Arcade.Sprite;
  private greenBtn!: Phaser.Physics.Arcade.Sprite;
  private redBtnH = 760;
  private blueBtnH = 768;
  private greenBtnH = 767;
  public isPlaying = false;
  private callbacks: VoltzGameCallbacks | null = null;
  private pendingResult: RoundResult | null = null;
  private buttonsEnabled = true;

  private revealedTexts: (Phaser.GameObjects.Text | null)[] = [null, null, null];
  private revealedGlows: (Phaser.GameObjects.Text | null)[] = [null, null, null];
  private revealedSubs: (Phaser.GameObjects.Text | null)[] = [null, null, null];
  private revealedBgs: (Phaser.GameObjects.GameObject | null)[] = [null, null, null];
  private revealedBgExtras: (Phaser.GameObjects.GameObject[])[] = [[], [], []];
  private switchesPressed: boolean[] = [false, false, false];
  private switchCount = 0;
  private roundActive = false;

  // Premium glow properties
  private ambientGlow!: Phaser.GameObjects.Rectangle;
  private btnGlows: { red: Phaser.GameObjects.Graphics | null; blue: Phaser.GameObjects.Graphics | null; green: Phaser.GameObjects.Graphics | null } = { red: null, blue: null, green: null };
  private floatingParticles: Phaser.GameObjects.Graphics[] = [];
  private electroGlow!: Phaser.GameObjects.Graphics;
  private promptPlate: Phaser.GameObjects.Graphics | null = null;
  private promptText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super("Game");
  }

  create() {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;

    this.createAnims();
    this.createBg();
    this.createAmbientGlow();
    this.createBtns();

    this.currentElectro = this.add
      .sprite(this.width / 2, this.height * 0.66, "electro1")
      .setAlpha(0)
      .setOrigin(0.5, 1)
      .setScale(1);

    // Add electric aura around electro
    this.electroGlow = this.add.graphics();
    this.electroGlow.setDepth(3);
    this.electroGlow.setAlpha(0);

    this.lightEffects();
    this.createMachineChrome();
    this.createPrompt();

    this.isPlaying = false;
    this.buttonsEnabled = true;
    this.roundActive = false;
    this.switchCount = 0;
    this.switchesPressed = [false, false, false];
  }

  setCallbacks(callbacks: VoltzGameCallbacks) {
    this.callbacks = callbacks;
  }

  setButtonsEnabled(enabled: boolean) {
    this.buttonsEnabled = enabled;
  }

  deliverResult(result: RoundResult) {
    this.pendingResult = result;
    this.roundActive = true;
    this.revealCurrentSwitch();
  }

  private pendingSwitchIndex = 0;

  private revealCurrentSwitch() {
    if (!this.pendingResult) return;
    const idx = this.pendingSwitchIndex;
    const switchTexts = this.pendingResult.switchTexts;
    const text = switchTexts[idx];

    this.game.events.emit("electricStart");

    // Intense electro glow on press
    this.showElectroGlow(idx);

    const anims = ["red", "blue", "green"];

    this.currentElectro.setScale(1, 0.2);
    this.currentElectro.setAlpha(0.4);
    this.anims.play(anims[idx] + "Electro", this.currentElectro);

    this.tweens.add({
      targets: this.currentElectro,
      scaleY: 0.8,
      alpha: 1,
      duration: 300,
      ease: "Sine.easeInOut",
    });

    // Lightning flash effect
    // for (let i = 0; i < 5; i++) {
    //   this.time.delayedCall(i * 40, () => {
    //     this.tweens.add({
    //       targets: [this.lightOverlay],
    //       alpha: 0.12 + i * 0.05,
    //       duration: 30,
    //       yoyo: true,
    //       ease: "Linear",
    //     });
    //   });
    // }

    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: this.currentElectro, scaleY: 1.1, alpha: 1, duration: 300, ease: "Sine.easeOut" });
    });

    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: this.currentElectro, scaleY: 1.2, alpha: 1, duration: 250, ease: "Power2" });
    });

    this.time.delayedCall(950, () => {
      this.tweens.add({ targets: this.currentElectro, scaleY: 0.1, alpha: 0, duration: 250, ease: "Sine.easeIn" });
      this.tweens.add({ targets: this.electroGlow, alpha: 0, duration: 200 });

      this.game.events.emit("electricStop");
      this.showRevealText(idx, text);

      this.switchesPressed[idx] = true;
      this.switchCount++;

      if (this.switchCount >= 3) {
        this.time.delayedCall(800, () => { this.finishRound(); });
      } else {
        this.time.delayedCall(400, () => { this.isPlaying = false; });
      }
    });
  }

  private showElectroGlow(switchIdx: number) {
    const colors = [0xff3366, 0x3399ff, 0x33ff66];
    const color = colors[switchIdx];
    const x = this.width / 2;
    const y = this.height * 0.66;

    this.electroGlow.clear();
    this.electroGlow.fillStyle(color, 0.4);
    this.electroGlow.fillEllipse(x, y, 180, 200);
    this.electroGlow.fillStyle(color, 0.2);
    this.electroGlow.fillEllipse(x, y, 280, 300);
    this.electroGlow.fillStyle(color, 0.1);
    this.electroGlow.fillEllipse(x, y, 400, 420);
    this.electroGlow.setAlpha(0.8);

    this.tweens.add({
      targets: this.electroGlow,
      alpha: { from: 0.8, to: 0.2 },
      duration: 400,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut"
    });
  }

  private getScreenSlot(switchIdx: number) {
    const preBaseW = Math.round(this.width * 0.224);
    const preBaseH = Math.round(preBaseW * 0.75);
    return {
      x: this.width * [0.2, 0.5, 0.8][switchIdx],
      y: this.height * 0.32 - preBaseH * 0.035,
      boxW: Math.round(preBaseW * 1.18),
      boxH: Math.round(preBaseH * 0.96),
    };
  }

  private showRevealText(switchIdx: number, text: string) {
    const { x, y, boxW, boxH } = this.getScreenSlot(switchIdx);
    const radius = 10;
    const inset = 7;
    const plateW = boxW - inset * 2;
    const plateH = boxH - inset * 2;
    const maxTextWidth = plateW - 22;

    const len = text.length;
    let valueSize = 64;
    if (len > 4) valueSize = 50;
    if (len > 7) valueSize = 36;
    if (len > 10) valueSize = 26;
    if (len > 14) valueSize = 20;

    const lane = LANE_THEME[switchIdx];

    const glow = this.add.graphics();
    glow.fillStyle(lane.hex, 0.22);
    glow.fillRoundedRect(x - plateW / 2 - 8, y - plateH / 2 - 8, plateW + 16, plateH + 16, radius + 4);
    glow.setDepth(7);
    glow.setAlpha(0);

    const plate = this.add.graphics();
    plate.fillStyle(0x0A0A0D, 0.97);
    plate.fillRoundedRect(x - plateW / 2, y - plateH / 2, plateW, plateH, radius);
    plate.fillStyle(0x16161b, 0.92);
    plate.fillRect(x - plateW / 2 + 2, y - plateH / 2 + 3, plateW - 4, plateH * 0.38);
    plate.fillStyle(lane.hex, 1);
    plate.fillRect(x - plateW / 2 + 14, y - plateH / 2, plateW - 28, 3);
    plate.fillStyle(0xffffff, 0.1);
    plate.fillRect(x - plateW / 2 + 10, y - plateH / 2 + 6, plateW - 20, 1);
    plate.setDepth(8);
    plate.setAlpha(0);

    const flash = this.add.graphics();
    flash.lineStyle(2, lane.hex, 1);
    flash.strokeRoundedRect(x - plateW / 2, y - plateH / 2, plateW, plateH, radius);
    flash.setDepth(9);
    flash.setAlpha(0);

    const kicker = this.add
      .text(x, y - plateH * 0.28, "REVEALED", {
        fontFamily: "Oswald, Arial Black, sans-serif",
        fontSize: "13px",
        color: "#fff8ee",
        fontStyle: "bold",
        letterSpacing: 3.2,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(12);

    const main = this.add
      .text(x, y + 6, text, {
        fontFamily: "Oswald, Arial Black, sans-serif",
        fontSize: `${valueSize}px`,
        color: lane.css,
        align: "center",
        fontStyle: "bold",
        letterSpacing: len <= 7 ? 1.4 : 0,
        wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: "rgba(0,0,0,0.7)",
          blur: 10,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(12);
    main.y += 10;

    this.revealedBgs[switchIdx] = plate;
    this.revealedTexts[switchIdx] = main;
    this.revealedSubs[switchIdx] = kicker;
    this.revealedBgExtras[switchIdx] = [glow, flash];

    this.tweens.add({
      targets: [plate, glow],
      alpha: 1,
      duration: 200,
      ease: "Cubic.easeOut",
    });
    this.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.95 },
      duration: 90,
      yoyo: true,
      hold: 40,
      ease: "Sine.easeOut",
    });

    this.time.delayedCall(70, () => {
      this.tweens.add({
        targets: kicker,
        alpha: 0.42,
        duration: 180,
        ease: "Sine.easeOut",
      });
      this.tweens.add({
        targets: main,
        alpha: 1,
        y: y + 6,
        duration: 320,
        ease: "Cubic.easeOut",
      });
    });

    this.time.delayedCall(420, () => {
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.4, to: 0.75 },
        duration: 1600,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }

  private finishRound() {
    if (!this.pendingResult) return;
    const result = this.pendingResult;

    if (result.outcome === "win" || result.outcome === "freeReplay") {
      // Victory celebration effect
      for (let i = 0; i < 3; i++) {
        if (this.revealedTexts[i]) {
          this.tweens.add({
            targets: this.revealedTexts[i],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 250,
            yoyo: true,
            repeat: 2,
            ease: "Back.easeOut",
          });
          // Add gold sparkle around winning texts
          this.addSparkles(this.revealedTexts[i]!.x, this.revealedTexts[i]!.y);
        }
      }
      
      // Full screen victory flash
      this.tweens.add({
        targets: this.lightOverlay,
        alpha: 0.25,
        duration: 100,
        yoyo: true,
        ease: "Sine.easeOut"
      });
    }

    this.time.delayedCall(1200, () => {
      const savedResult = this.pendingResult;
      this.game.events.emit("gameComplete", savedResult);
    });
  }

  private addSparkles(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const spark = this.add.circle(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 60, 3 + Math.random() * 5, 0xffdd77, 1);
      spark.setDepth(20);
      this.tweens.add({
        targets: spark,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        x: spark.x + (Math.random() - 0.5) * 100,
        y: spark.y + (Math.random() - 0.5) * 80,
        duration: 500,
        ease: "Power2",
        onComplete: () => spark.destroy()
      });
    }
  }

  resetRound() {
    for (let i = 0; i < 3; i++) {
      if (this.revealedTexts[i]) { this.revealedTexts[i]!.destroy(); this.revealedTexts[i] = null; }
      if (this.revealedGlows[i]) { this.revealedGlows[i]!.destroy(); this.revealedGlows[i] = null; }
      if (this.revealedSubs[i]) { this.revealedSubs[i]!.destroy(); this.revealedSubs[i] = null; }
      if (this.revealedBgs[i]) { this.revealedBgs[i]!.destroy(); this.revealedBgs[i] = null; }
      if (this.revealedBgExtras[i]) { this.revealedBgExtras[i].forEach(e => e.destroy()); this.revealedBgExtras[i] = []; }
    }

    this.switchesPressed = [false, false, false];
    this.switchCount = 0;
    this.roundActive = false;
    this.pendingResult = null;
    this.pendingSwitchIndex = 0;
    this.isPlaying = false;
    this.currentElectro.setAlpha(0).setScale(0.5);

    this.tweens.add({ targets: this.redBtnImg, y: this.redBtnH - 10, duration: 100 });
    this.tweens.add({ targets: this.blueBtnImg, y: this.blueBtnH - 10, duration: 100 });
    this.tweens.add({ targets: this.greenBtnImg, y: this.greenBtnH - 10, duration: 100 });
    
    // Recreate button glows with fresh energy
    if (this.btnGlows.red) this.btnGlows.red.destroy();
    if (this.btnGlows.blue) this.btnGlows.blue.destroy();
    if (this.btnGlows.green) this.btnGlows.green.destroy();
    this.createButtonGlows();
    this.setPromptVisible(true);
  }

  private createMachineChrome() {
    const w = this.width;
    const h = this.height;
    const gold = 0xF1D47A;
    const chrome = this.add.graphics();
    chrome.setDepth(2.4);

    [0, 1, 2].forEach((idx) => {
      const { x, y, boxW, boxH } = this.getScreenSlot(idx);
      const sx = x - boxW / 2;
      const sy = y - boxH / 2;
      chrome.lineStyle(3, gold, 0.8);
      chrome.strokeRoundedRect(sx - 6, sy - 6, boxW + 12, boxH + 12, 10);
      chrome.lineStyle(1, 0xD4AF37, 0.4);
      chrome.strokeRoundedRect(sx - 10, sy - 10, boxW + 20, boxH + 20, 12);
    });

    chrome.lineStyle(5, gold, 0.18);
    chrome.strokeRoundedRect(10, 10, w - 20, h - 20, 18);
    chrome.lineStyle(1.5, gold, 0.45);
    chrome.strokeRoundedRect(16, 16, w - 32, h - 32, 14);
  }

  private createPrompt() {
    const y = this.height * 0.918;
    const w = this.width * 0.86;
    const h = this.height * 0.078;
    const x = this.width / 2;

    const cover = this.add.graphics();
    cover.setDepth(17);
    cover.fillStyle(0x0a0a0d, 1);
    cover.fillRoundedRect(x - w / 2 - 12, y - h / 2 - 8, w + 24, h + 16, 16);

    const plate = this.add.graphics();
    plate.setDepth(18);
    plate.fillStyle(0x050505, 0.97);
    plate.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    plate.lineStyle(2.5, 0xF1D47A, 0.9);
    plate.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    plate.lineStyle(1, 0xD4AF37, 0.4);
    plate.strokeRoundedRect(x - w / 2 + 5, y - h / 2 + 5, w - 10, h - 10, 10);
    this.promptPlate = plate;

    this.promptText = this.add
      .text(x, y, "TAP A SWITCH", {
        fontFamily: "Oswald, Impact, Arial Black, sans-serif",
        fontSize: `${Math.round(this.width * 0.034)}px`,
        color: "#F1D47A",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(19);

    this.tweens.add({
      targets: this.promptText,
      alpha: { from: 0.72, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private setPromptVisible(visible: boolean) {
    this.promptPlate?.setVisible(visible);
    this.promptText?.setVisible(visible);
  }

  private createAmbientGlow() {
    // Dynamic ambient glow that pulses with energy
    this.ambientGlow = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0xC8102E, 0.04);
    this.ambientGlow.setDepth(1);
    this.ambientGlow.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: this.ambientGlow,
      alpha: { from: 0.03, to: 0.12 },
      duration: 3000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1
    });
  }

  private lightEffects() {
    this.lightBg = this.add.image(this.width / 2, this.height / 2, "blink").setAlpha(0).setDepth(5);
    // this.lightOverlay = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0xffffff).setAlpha(0).setOrigin(0.5, 0.5).setDepth(5);

    // === PREMIUM EDGE GLOWS ===
    const edgeGlowLeft = this.add.graphics();
    edgeGlowLeft.setDepth(3);
    for (let i = 0; i < 6; i++) {
      edgeGlowLeft.fillStyle(0xC8102E, 0.03 - i * 0.003);
      edgeGlowLeft.fillRect(0, 0, 20 + i * 12, this.height);
    }
    const edgeGlowRight = this.add.graphics();
    edgeGlowRight.setDepth(3);
    for (let i = 0; i < 6; i++) {
      edgeGlowRight.fillStyle(0xD4AF37, 0.03 - i * 0.003);
      edgeGlowRight.fillRect(this.width - 20 - i * 12, 0, 20 + i * 12, this.height);
    }
    this.tweens.add({ targets: edgeGlowLeft, alpha: { from: 0, to: 0.7 }, duration: 2500, ease: "Sine.easeInOut", yoyo: true, repeat: -1 });
    this.tweens.add({ targets: edgeGlowRight, alpha: { from: 0, to: 0.7 }, duration: 2800, ease: "Sine.easeInOut", yoyo: true, repeat: -1, delay: 800 });

    // === FLOATING ENERGY PARTICLES ===
    const glowColors = [0xC8102E, 0xFF263D, 0xD4AF37, 0xF1D47A, 0xfff8ee, 0x8A6E18];
    for (let i = 0; i < 12; i++) {
      const px = Math.random() * this.width;
      const py = Math.random() * this.height;
      const pColor = glowColors[Math.floor(Math.random() * glowColors.length)];
      const pSize = 2 + Math.random() * 4;
      const particle = this.add.graphics();
      particle.setDepth(4);
      particle.fillStyle(pColor, 0.8);
      particle.fillCircle(0, 0, pSize);
      particle.fillStyle(pColor, 0.3);
      particle.fillCircle(0, 0, pSize * 2.5);
      particle.setPosition(px, py);

      this.tweens.add({
        targets: particle,
        alpha: { from: 0, to: 0.5 + Math.random() * 0.4 },
        x: px + (Math.random() - 0.5) * 150,
        y: py + (Math.random() - 0.5) * 100,
        duration: 4000 + Math.random() * 4000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 5000,
      });
      this.floatingParticles.push(particle);
    }

    // === PERIODIC ENERGY SURGES ===
    this.time.addEvent({
      delay: 6000,
      callback: () => {
        const surgeColor = glowColors[Math.floor(Math.random() * glowColors.length)];
        const surge = this.add.graphics();
        surge.setDepth(5);
        surge.fillStyle(surgeColor, 0.1);
        surge.fillRect(0, 0, this.width, this.height);
        this.tweens.add({
          targets: surge,
          alpha: { from: 0, to: 0.2 },
          duration: 120,
          yoyo: true,
          ease: "Linear",
          onComplete: () => surge.destroy(),
        });
      },
      loop: true,
    });

    // Lightning bolts occasionally
    this.time.addEvent({
      delay: 12000,
      callback: () => {
        for (let i = 0; i < 3; i++) {
          this.time.delayedCall(i * 80, () => {
            this.tweens.add({
              targets: this.lightOverlay,
              alpha: 0.1 + i * 0.04,
              duration: 50,
              yoyo: true,
            });
          });
        }
      },
      loop: true,
    });
  }

  private createAnims() {
    const frameRate = 8;
    this.anims.create({ key: "bgAnim", frames: [{ key: "bg1" }, { key: "bg2" }, { key: "bg3" }], frameRate: 2, repeat: -1 });
    this.anims.create({ key: "bgUpperAnim", frames: [{ key: "bg11" }, { key: "bg21" }, { key: "bg31" }], frameRate: 2, repeat: -1 });
    this.anims.create({ key: "electronics", frames: [{ key: "electro1" }, { key: "electro2" }], frameRate: 5, repeat: -1 });
    this.anims.create({ key: "redElectro", frames: [{ key: "redElectro1" }, { key: "redElectro2" }], frameRate, repeat: -1 });
    this.anims.create({ key: "blueElectro", frames: [{ key: "blueElectro1" }, { key: "blueElectro2" }], frameRate, repeat: -1 });
    this.anims.create({ key: "greenElectro", frames: [{ key: "greenElectro1" }, { key: "greenElectro2" }], frameRate, repeat: -1 });
  }

  private createBg() {
    const bg = this.add.sprite(this.width / 2, this.height / 2, "bg1").play("bgAnim");
    bg.setDisplaySize(this.width, this.height);
    bg.setTint(0xa39e94);
    const bgUpper = this.add.sprite(this.width / 2, this.height / 2, "bg11").setDepth(2).play("bgUpperAnim");
    bgUpper.setDisplaySize(this.width, this.height);
    bgUpper.setTint(0xb2ab9e);

    const wash = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x1a1208, 0.22);
    wash.setDepth(1.2);
    wash.setBlendMode(Phaser.BlendModes.MULTIPLY);

    const vignette = this.add.graphics();
    vignette.setDepth(1.4);
    vignette.fillStyle(0x050505, 0.42);
    vignette.fillRect(0, 0, this.width * 0.06, this.height);
    vignette.fillRect(this.width * 0.94, 0, this.width * 0.06, this.height);
    vignette.fillStyle(0x050505, 0.28);
    vignette.fillRect(0, 0, this.width, this.height * 0.05);
    vignette.fillRect(0, this.height * 0.95, this.width, this.height * 0.05);
  }

  private createButtonGlows() {
    const redX = this.width * 0.2;
    const blueX = this.width * 0.5;
    const greenX = this.width * 0.8;
    const btnY = this.redBtnH + 330;

    this.btnGlows.red = this.add.graphics();
    this.btnGlows.red.setDepth(0);
    this.createGlowForButton(this.btnGlows.red, redX, btnY, 0xff4466);

    this.btnGlows.blue = this.add.graphics();
    this.btnGlows.blue.setDepth(0);
    this.createGlowForButton(this.btnGlows.blue, blueX, btnY, 0x44aaff);

    this.btnGlows.green = this.add.graphics();
    this.btnGlows.green.setDepth(0);
    this.createGlowForButton(this.btnGlows.green, greenX, btnY, 0x44ff88);
  }

  private createGlowForButton(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
    // Multi-layer intense glow
    graphics.fillStyle(color, 0.4);
    graphics.fillEllipse(x, y, 220, 160);
    graphics.fillStyle(color, 0.25);
    graphics.fillEllipse(x, y, 300, 220);
    graphics.fillStyle(color, 0.12);
    graphics.fillEllipse(x, y, 400, 300);
    graphics.fillStyle(color, 0.06);
    graphics.fillEllipse(x, y, 520, 400);
    
    this.tweens.add({
      targets: graphics,
      alpha: { from: 0.7, to: 1 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (graphics) {
          graphics.clear();
          const currentAlpha = graphics.alpha;
          graphics.fillStyle(color, 0.4 * currentAlpha);
          graphics.fillEllipse(x, y, 220, 160);
          graphics.fillStyle(color, 0.25 * currentAlpha);
          graphics.fillEllipse(x, y, 300, 220);
          graphics.fillStyle(color, 0.12 * currentAlpha);
          graphics.fillEllipse(x, y, 400, 300);
          graphics.fillStyle(color, 0.06 * currentAlpha);
          graphics.fillEllipse(x, y, 520, 400);
        }
      }
    });
  }

  private createBtns() {
    this.redBtnImg = this.add.sprite(this.width / 2, this.redBtnH, "redBtn");
    this.blueBtnImg = this.add.sprite(this.width / 2, this.blueBtnH, "blueBtn");
    this.greenBtnImg = this.add.sprite(this.width / 2, this.greenBtnH, "greenBtn");

    this.redBtn = this.physics.add.sprite(this.width * 0.2, this.redBtnH + 330, "redBtn").setScale(0.15, 0.06).setDepth(-1).setInteractive();
    this.blueBtn = this.physics.add.sprite(this.width * 0.5, this.blueBtnH + 320, "redBtn").setScale(0.15, 0.06).setDepth(-1).setInteractive();
    this.greenBtn = this.physics.add.sprite(this.width * 0.8, this.greenBtnH + 320, "redBtn").setScale(0.15, 0.06).setDepth(-1).setInteractive();

    this.createButtonGlows();

    this.redBtn.on("pointerover", () => this.input.setDefaultCursor("pointer"));
    this.redBtn.on("pointerout", () => this.input.setDefaultCursor("default"));
    this.blueBtn.on("pointerover", () => this.input.setDefaultCursor("pointer"));
    this.blueBtn.on("pointerout", () => this.input.setDefaultCursor("default"));
    this.greenBtn.on("pointerover", () => this.input.setDefaultCursor("pointer"));
    this.greenBtn.on("pointerout", () => this.input.setDefaultCursor("default"));

    this.redBtn.on("pointerdown", () => {
      if (!this.isPlaying && this.buttonsEnabled && !this.switchesPressed[0]) {
        this.isPlaying = true;
        this.pendingSwitchIndex = 0;
        this.pulseButtonGlow(this.btnGlows.red, 0xff4466, this.width * 0.2, this.redBtnH + 330);
        this.tweens.add({ 
          targets: this.redBtnImg, 
          y: this.redBtnH + 12, 
          duration: 80, 
          yoyo: false, 
          onComplete: () => this.handleSwitchPress(1) 
        });
      }
    });
    
    this.blueBtn.on("pointerdown", () => {
      if (!this.isPlaying && this.buttonsEnabled && !this.switchesPressed[1]) {
        this.isPlaying = true;
        this.pendingSwitchIndex = 1;
        this.pulseButtonGlow(this.btnGlows.blue, 0x44aaff, this.width * 0.5, this.blueBtnH + 320);
        this.tweens.add({ 
          targets: this.blueBtnImg, 
          y: this.blueBtnH + 12, 
          duration: 80, 
          yoyo: false, 
          onComplete: () => this.handleSwitchPress(2) 
        });
      }
    });
    
    this.greenBtn.on("pointerdown", () => {
      if (!this.isPlaying && this.buttonsEnabled && !this.switchesPressed[2]) {
        this.isPlaying = true;
        this.pendingSwitchIndex = 2;
        this.pulseButtonGlow(this.btnGlows.green, 0x44ff88, this.width * 0.8, this.greenBtnH + 320);
        this.tweens.add({ 
          targets: this.greenBtnImg, 
          y: this.greenBtnH + 12, 
          duration: 80, 
          yoyo: false, 
          onComplete: () => this.handleSwitchPress(3) 
        });
      }
    });
  }

  private pulseButtonGlow(graphics: Phaser.GameObjects.Graphics | null, color: number, x: number, y: number) {
    if (!graphics) return;
    
    this.tweens.add({
      targets: { alpha: 1 },
      alpha: 0.2,
      duration: 120,
      ease: "Sine.easeInOut",
      yoyo: true,
      onUpdate: (tween, target, key, value) => {
        if (graphics) {
          graphics.clear();
          const intensity = value * 1.5;
          graphics.fillStyle(color, 0.6 * intensity);
          graphics.fillEllipse(x, y, 240, 180);
          graphics.fillStyle(color, 0.35 * intensity);
          graphics.fillEllipse(x, y, 340, 260);
          graphics.fillStyle(color, 0.18 * intensity);
          graphics.fillEllipse(x, y, 460, 360);
          graphics.fillStyle(color, 0.08 * intensity);
          graphics.fillEllipse(x, y, 600, 480);
        }
      }
    });
  }

  private handleSwitchPress(switchIndex: number) {
    this.setPromptVisible(false);
    if (this.callbacks) { this.callbacks.onSwitchPressed(switchIndex); }
  }
}