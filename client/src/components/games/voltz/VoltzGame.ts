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

  constructor() {
    super("Game");
  }

  create() {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;

    this.createAnims();
    this.createBg();
    this.createBtns();

    this.currentElectro = this.add
      .sprite(this.width / 2, this.height * 0.66, "electro1")
      .setAlpha(0)
      .setOrigin(0.5, 1)
      .setScale(1);

    this.lightEffects();

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

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 60, () => {
        this.tweens.add({
          targets: [this.lightOverlay],
          alpha: 0.15 + i * 0.04,
          duration: 40,
          yoyo: true,
          ease: "Linear",
        });
      });
    }

    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: this.currentElectro, scaleY: 1.1, alpha: 1, duration: 300, ease: "Sine.easeOut" });
    });

    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: this.currentElectro, scaleY: 1.2, alpha: 1, duration: 250, ease: "Power2" });
    });

    this.time.delayedCall(950, () => {
      this.tweens.add({ targets: this.currentElectro, scaleY: 0.1, alpha: 0, duration: 250, ease: "Sine.easeIn" });

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

private showRevealText(switchIdx: number, text: string) {
  const xPositions = [this.width * 0.2, this.width * 0.5, this.width * 0.8];
  const x = xPositions[switchIdx];
  const preBaseW = Math.round(this.width * 0.224);
  const preBaseH = Math.round(preBaseW * 0.75);
  const y = this.height * 0.32 - preBaseH * 0.035;

  // PREMIUM GLOWING DARK GOLD - Voltz style
  const darkGold = 0xcc8800;      // Rich dark gold base
  const brightGold = 0xffcc44;    // Bright glowing gold
  const intenseGold = 0xffdd77;   // Intense highlight gold
  const textColor = "#ffffff";

  const scaleFactor = Math.min(this.width / 1024, this.height / 1536);
  const sf = Math.max(scaleFactor, 0.45);
  const baseW = Math.round(this.width * 0.224);
  const baseH = Math.round(baseW * 0.75);
  const boxW = Math.round(baseW * 1.105);
  const boxH = Math.round(baseH * 0.87);
  const boxXOffset = boxW * 0.0075;
  const bx = x + boxXOffset;
  const maxTextWidth = boxW - Math.round(14 * sf);
  const radius = Math.round(Math.min(boxW, boxH) * 0.15);

  let baseFontSize = Math.round(68 * sf);
  if (text.length > 4) baseFontSize = Math.round(58 * sf);
  if (text.length > 7) baseFontSize = Math.round(50 * sf);
  if (text.length > 10) baseFontSize = Math.round(40 * sf);
  if (text.length > 14) baseFontSize = Math.round(32 * sf);
  baseFontSize = Math.max(baseFontSize, 22);

  // MULTI-LAYER GLOW for premium effect
  // Outermost glow (biggest, softest)
  const outerGlow = this.add.graphics();
  outerGlow.fillStyle(intenseGold, 0.15);
  outerGlow.fillRoundedRect(bx - boxW / 2 - 20, y - boxH / 2 - 20, boxW + 40, boxH + 40, radius + 12);
  outerGlow.setDepth(6);
  outerGlow.setAlpha(0);

  // Mid glow layer
  const midGlow = this.add.graphics();
  midGlow.fillStyle(brightGold, 0.35);
  midGlow.fillRoundedRect(bx - boxW / 2 - 12, y - boxH / 2 - 12, boxW + 24, boxH + 24, radius + 8);
  midGlow.setDepth(7);
  midGlow.setAlpha(0);

  // Inner glow layer
  const innerGlow = this.add.graphics();
  innerGlow.fillStyle(darkGold, 0.6);
  innerGlow.fillRoundedRect(bx - boxW / 2 - 6, y - boxH / 2 - 6, boxW + 12, boxH + 12, radius + 4);
  innerGlow.setDepth(7.5);
  innerGlow.setAlpha(0);

  // Main dark gold box
  const boxBg = this.add.graphics();
  boxBg.fillStyle(darkGold, 1);
  boxBg.fillRoundedRect(bx - boxW / 2, y - boxH / 2, boxW, boxH, radius);
  boxBg.setDepth(8);
  boxBg.setAlpha(0);
  boxBg.setScale(1, 0.02);
  
  // Shimmer highlight on top edge
  const topHighlight = this.add.graphics();
  topHighlight.fillStyle(brightGold, 0.4);
  topHighlight.fillRoundedRect(bx - boxW / 2 + 4, y - boxH / 2 + 2, boxW - 8, 6, 3);
  topHighlight.setDepth(9);
  topHighlight.setAlpha(0);
  
  this.revealedBgs[switchIdx] = boxBg;

  // White text with black stroke for readability
  const main = this.add.text(bx, y, text, {
    fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif",
    fontSize: `${baseFontSize}px`,
    color: textColor,
    align: "center",
    stroke: "#000000",
    strokeThickness: Math.round(6 * sf),
    wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
    shadow: {
      offsetX: 0,
      offsetY: Math.round(3 * sf),
      color: 'rgba(0,0,0,0.95)',
      blur: Math.round(12 * sf),
      fill: true,
    },
  }).setOrigin(0.5).setAlpha(0).setScale(0.05).setDepth(11);

  const switchLabels = ["RED", "BLUE", "GREEN"];
  const labelColors = ["#ff4444", "#4488ff", "#44dd66"];
  const subFontSize = Math.max(Math.round(11 * sf), 8);
  const sub = this.add.text(bx, y + boxH / 2 + Math.round(12 * sf), switchLabels[switchIdx], {
    fontFamily: "Impact, 'Arial Black', sans-serif",
    fontSize: `${subFontSize}px`,
    color: labelColors[switchIdx],
    align: "center",
    stroke: "#000000",
    strokeThickness: Math.round(3 * sf),
    letterSpacing: Math.round(6 * sf),
  }).setOrigin(0.5).setAlpha(0).setDepth(11);

  this.revealedTexts[switchIdx] = main;
  this.revealedSubs[switchIdx] = sub;
  this.revealedBgExtras[switchIdx] = [boxBg, outerGlow, midGlow, innerGlow, topHighlight];

  // Animation sequence
  this.tweens.add({ 
    targets: boxBg, 
    scaleY: 1, 
    alpha: 1, 
    duration: 180, 
    ease: "Back.easeOut" 
  });

  // Fade in glows in sequence
  this.time.delayedCall(30, () => {
    this.tweens.add({ targets: outerGlow, alpha: 1, duration: 200, ease: "Sine.easeOut" });
  });
  
  this.time.delayedCall(60, () => {
    this.tweens.add({ targets: midGlow, alpha: 1, duration: 200, ease: "Sine.easeOut" });
    this.tweens.add({ targets: topHighlight, alpha: 0.6, duration: 250, ease: "Sine.easeOut" });
  });
  
  this.time.delayedCall(90, () => {
    this.tweens.add({ targets: innerGlow, alpha: 1, duration: 200, ease: "Sine.easeOut" });
  });

  this.time.delayedCall(100, () => {
    this.tweens.add({ 
      targets: main, 
      alpha: 1, 
      scaleX: 1, 
      scaleY: 1, 
      duration: 220, 
      ease: "Back.easeOut" 
    });
    this.tweens.add({ 
      targets: sub, 
      alpha: 0.9, 
      duration: 200, 
      ease: "Power2" 
    });
  });

  // Premium pulsing glow animation
  this.time.delayedCall(350, () => {
    // Outer glow pulses softly
    this.tweens.add({
      targets: outerGlow,
      alpha: { from: 0.15, to: 0.25 },
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1
    });
    
    // Mid glow pulses more noticeably
    this.tweens.add({
      targets: midGlow,
      alpha: { from: 0.35, to: 0.55 },
      duration: 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1
    });
    
    // Inner glow pulses with energy
    this.tweens.add({
      targets: innerGlow,
      alpha: { from: 0.6, to: 0.85 },
      duration: 800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1
    });
    
    // Top highlight shimmer
    this.tweens.add({
      targets: topHighlight,
      alpha: { from: 0.4, to: 0.8 },
      duration: 700,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1
    });
  });
}

  private finishRound() {
    if (!this.pendingResult) return;
    const result = this.pendingResult;

    if (result.outcome === "win" || result.outcome === "freeReplay") {
      for (let i = 0; i < 3; i++) {
        if (this.revealedTexts[i]) {
          this.tweens.add({
            targets: this.revealedTexts[i],
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 300,
            yoyo: true,
            repeat: 1,
            ease: "Sine.easeInOut",
          });
        }
      }
    }

    this.time.delayedCall(1000, () => {
      const savedResult = this.pendingResult;
      this.game.events.emit("gameComplete", savedResult);
    });
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
  
  // Reset button glows to normal pulsing
  if (this.btnGlows.red) this.btnGlows.red.destroy();
  if (this.btnGlows.blue) this.btnGlows.blue.destroy();
  if (this.btnGlows.green) this.btnGlows.green.destroy();
  this.createButtonGlows();
}

  private lightEffects() {
    // lightBg — alpha 0 at all times, only kept as a reference object
    this.lightBg = this.add
      .image(this.width / 2, this.height / 2, "blink")
      .setAlpha(0)
      .setDepth(5);

    // lightOverlay — pure white flash rectangle, invisible at rest
    // Only tweened to briefly non-zero alpha during electric button events
    this.lightOverlay = this.add
      .rectangle(this.width / 2, this.height / 2, this.width, this.height, 0xffffff)
      .setAlpha(0)
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    // ── ALL ambient colour orbs removed — they were fogging the bg sprites ──
    // ── sweepBar removed — was casting a yellow tint over everything        ──
    // ── coronaTop removed — was dimming the top of the scene               ──
    // ── lightBg periodic pulse removed — was adding a constant white film  ──

    // Edge accent glows — very thin, barely visible, just an energy hint
    const edgeGlowLeft = this.add.graphics();
    edgeGlowLeft.setDepth(3.5);
    edgeGlowLeft.setAlpha(0);
    for (let i = 0; i < 4; i++) {
      edgeGlowLeft.fillStyle(0xff4444, 0.025 - i * 0.004);
      edgeGlowLeft.fillRect(0, 0, 14 + i * 10, this.height);
    }
    const edgeGlowRight = this.add.graphics();
    edgeGlowRight.setDepth(3.5);
    edgeGlowRight.setAlpha(0);
    for (let i = 0; i < 4; i++) {
      edgeGlowRight.fillStyle(0x4488ff, 0.025 - i * 0.004);
      edgeGlowRight.fillRect(this.width - 14 - i * 10, 0, 14 + i * 10, this.height);
    }
    this.tweens.add({ targets: edgeGlowLeft, alpha: { from: 0, to: 0.55 }, duration: 3000, ease: "Sine.easeInOut", yoyo: true, repeat: -1 });
    this.tweens.add({ targets: edgeGlowRight, alpha: { from: 0, to: 0.55 }, duration: 3500, ease: "Sine.easeInOut", yoyo: true, repeat: -1, delay: 1500 });

    // Tiny floating particles — minimal alpha so they don't fog the scene
    const glowColors = [0xff4444, 0x4488ff, 0x44dd66, 0xffd700, 0xff6600, 0xaa44ff, 0x00e5ff];
    for (let i = 0; i < 20; i++) {
      const px = Math.random() * this.width;
      const py = Math.random() * this.height * 0.7;
      const pColor = glowColors[Math.floor(Math.random() * glowColors.length)];
      const pSize = 1.5 + Math.random() * 2.5;
      const particle = this.add.graphics();
      particle.setDepth(4.5);
      particle.setAlpha(0);
      particle.fillStyle(pColor, 1);
      particle.fillCircle(0, 0, pSize);
      particle.fillStyle(pColor, 0.15);
      particle.fillCircle(0, 0, pSize * 2);
      particle.setPosition(px, py);

      this.tweens.add({
        targets: particle,
        alpha: { from: 0, to: 0.25 + Math.random() * 0.2 }, // max ~0.45, was 0.9
        x: px + (Math.random() - 0.5) * 100,
        y: py + (-30 - Math.random() * 60),
        duration: 3000 + Math.random() * 4000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 5000,
      });
    }

    // Periodic random flash — short-lived, no lingering colour tint
    this.time.addEvent({
      delay: 8000,
      callback: () => {
        const flashColor = glowColors[Math.floor(Math.random() * glowColors.length)];
        const flash = this.add.graphics();
        flash.setDepth(5.5);
        flash.setAlpha(0);
        flash.fillStyle(flashColor, 0.06);
        flash.fillRect(0, 0, this.width, this.height);
        this.tweens.add({
          targets: flash,
          alpha: { from: 0, to: 0.14 },
          duration: 90,
          yoyo: true,
          ease: "Linear",
          onComplete: () => flash.destroy(),
        });
      },
      loop: true,
    });

    // Periodic lightOverlay multi-flash
    this.time.addEvent({
      delay: 15000,
      callback: () => {
        for (let i = 0; i < 4; i++) {
          this.time.delayedCall(i * 150, () => {
            this.tweens.add({
              targets: [this.lightOverlay],
              alpha: 0.06 + i * 0.015,
              duration: 70,
              yoyo: true,
              ease: "Linear",
            });
          });
        }
      },
      loop: true,
    });
  }

  private createAnims() {
    const frameRate = 6;
    this.anims.create({ key: "bgAnim", frames: [{ key: "bg1" }, { key: "bg2" }, { key: "bg3" }], frameRate: 2, repeat: -1 });
    this.anims.create({ key: "bgUpperAnim", frames: [{ key: "bg11" }, { key: "bg21" }, { key: "bg31" }], frameRate: 2, repeat: -1 });
    this.anims.create({ key: "electronics", frames: [{ key: "electro1" }, { key: "electro2" }], frameRate: 4, repeat: -1 });
    this.anims.create({ key: "redElectro", frames: [{ key: "redElectro1" }, { key: "redElectro2" }], frameRate, repeat: -1 });
    this.anims.create({ key: "blueElectro", frames: [{ key: "blueElectro1" }, { key: "blueElectro2" }], frameRate, repeat: -1 });
    this.anims.create({ key: "greenElectro", frames: [{ key: "greenElectro1" }, { key: "greenElectro2" }], frameRate, repeat: -1 });
  }

  private createBg() {
    const bg = this.add.sprite(this.width / 2, this.height / 2, "bg1").play("bgAnim");
    bg.setDisplaySize(this.width, this.height);
    const bgUpper = this.add.sprite(this.width / 2, this.height / 2, "bg11").setDepth(2).play("bgUpperAnim");
    bgUpper.setDisplaySize(this.width, this.height);
  }

  private btnGlows: {
  red: Phaser.GameObjects.Graphics | null;
  blue: Phaser.GameObjects.Graphics | null;
  green: Phaser.GameObjects.Graphics | null;
} = { red: null, blue: null, green: null };

  private createButtonGlows() {
  // Button positions
  const redX = this.width * 0.2;
  const blueX = this.width * 0.5;
  const greenX = this.width * 0.8;
  const btnY = this.redBtnH + 330; // Same Y as buttons

  // Colors for each button
  const redColor = 0xff3333;
  const blueColor = 0x3399ff;
  const greenColor = 0x33ff66;

  // Create glow for Red button
  this.btnGlows.red = this.add.graphics();
  this.btnGlows.red.setDepth(0);
  this.createGlowForButton(this.btnGlows.red, redX, btnY, redColor);
  
  // Create glow for Blue button
  this.btnGlows.blue = this.add.graphics();
  this.btnGlows.blue.setDepth(0);
  this.createGlowForButton(this.btnGlows.blue, blueX, btnY, blueColor);
  
  // Create glow for Green button
  this.btnGlows.green = this.add.graphics();
  this.btnGlows.green.setDepth(0);
  this.createGlowForButton(this.btnGlows.green, greenX, btnY, greenColor);
}

private createGlowForButton(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  // Draw multi-layered glow
  graphics.fillStyle(color, 0.3);
  graphics.fillEllipse(x, y, 200, 140);
  graphics.fillStyle(color, 0.2);
  graphics.fillEllipse(x, y, 260, 180);
  graphics.fillStyle(color, 0.1);
  graphics.fillEllipse(x, y, 340, 240);
  
  // Animate the glow
  this.tweens.add({
    targets: graphics,
    alpha: { from: 0.6, to: 1 },
    duration: 1200,
    ease: "Sine.easeInOut",
    yoyo: true,
    repeat: -1,
    onUpdate: () => {
      if (graphics) {
        graphics.clear();
        const currentAlpha = graphics.alpha;
        graphics.fillStyle(color, 0.3 * currentAlpha);
        graphics.fillEllipse(x, y, 200, 140);
        graphics.fillStyle(color, 0.2 * currentAlpha);
        graphics.fillEllipse(x, y, 260, 180);
        graphics.fillStyle(color, 0.1 * currentAlpha);
        graphics.fillEllipse(x, y, 340, 240);
      }
    }
  });
}

  private createBtns() {
  this.redBtnImg = this.add.sprite(this.width / 2, this.redBtnH, "redBtn");
  this.blueBtnImg = this.add.sprite(this.width / 2, this.blueBtnH, "blueBtn");
  this.greenBtnImg = this.add.sprite(this.width / 2, this.greenBtnH, "greenBtn");

  this.redBtn = this.physics.add
    .sprite(this.width * 0.2, this.redBtnH + 330, "redBtn")
    .setScale(0.15, 0.06).setDepth(-1).setInteractive();
  this.blueBtn = this.physics.add
    .sprite(this.width * 0.5, this.blueBtnH + 320, "redBtn")
    .setScale(0.15, 0.06).setDepth(-1).setInteractive();
  this.greenBtn = this.physics.add
    .sprite(this.width * 0.8, this.greenBtnH + 320, "redBtn")
    .setScale(0.15, 0.06).setDepth(-1).setInteractive();

  // Create the glowing effects for buttons
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
      // Pulse the red glow on press
      this.pulseButtonGlow(this.btnGlows.red, 0xff3333, this.width * 0.2, this.redBtnH + 330);
      this.tweens.add({ 
        targets: this.redBtnImg, 
        y: this.redBtnH + 10, 
        duration: 100, 
        yoyo: false, 
        onComplete: () => this.handleSwitchPress(1) 
      });
    }
  });
  
  this.blueBtn.on("pointerdown", () => {
    if (!this.isPlaying && this.buttonsEnabled && !this.switchesPressed[1]) {
      this.isPlaying = true;
      this.pendingSwitchIndex = 1;
      // Pulse the blue glow on press
      this.pulseButtonGlow(this.btnGlows.blue, 0x3399ff, this.width * 0.5, this.blueBtnH + 320);
      this.tweens.add({ 
        targets: this.blueBtnImg, 
        y: this.blueBtnH + 10, 
        duration: 100, 
        yoyo: false, 
        onComplete: () => this.handleSwitchPress(2) 
      });
    }
  });
  
  this.greenBtn.on("pointerdown", () => {
    if (!this.isPlaying && this.buttonsEnabled && !this.switchesPressed[2]) {
      this.isPlaying = true;
      this.pendingSwitchIndex = 2;
      // Pulse the green glow on press
      this.pulseButtonGlow(this.btnGlows.green, 0x33ff66, this.width * 0.8, this.greenBtnH + 320);
      this.tweens.add({ 
        targets: this.greenBtnImg, 
        y: this.greenBtnH + 10, 
        duration: 100, 
        yoyo: false, 
        onComplete: () => this.handleSwitchPress(3) 
      });
    }
  });
}

private pulseButtonGlow(graphics: Phaser.GameObjects.Graphics | null, color: number, x: number, y: number) {
  if (!graphics) return;
  
  // Create a quick pulse effect
  this.tweens.add({
    targets: { alpha: 1 },
    alpha: 0.3,
    duration: 150,
    ease: "Sine.easeInOut",
    yoyo: true,
    onUpdate: (tween, target, key, value) => {
      if (graphics) {
        graphics.clear();
        graphics.fillStyle(color, 0.6 * value);
        graphics.fillEllipse(x, y, 200, 140);
        graphics.fillStyle(color, 0.4 * value);
        graphics.fillEllipse(x, y, 260, 180);
        graphics.fillStyle(color, 0.2 * value);
        graphics.fillEllipse(x, y, 340, 240);
      }
    }
  });
}

  private handleSwitchPress(switchIndex: number) {
    if (this.callbacks) { this.callbacks.onSwitchPressed(switchIndex); }
  }
}