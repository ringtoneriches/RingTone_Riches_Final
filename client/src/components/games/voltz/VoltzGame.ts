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
  const switchNum = idx + 1;
  
  // Faster electro animation
  this.currentElectro.setScale(1, 0.2);
  this.currentElectro.setAlpha(0.4);
  this.anims.play(anims[idx] + "Electro", this.currentElectro);

  // Compressed timeline - all animations happen faster
  this.tweens.add({
    targets: this.currentElectro,
    scaleY: 0.8,
    alpha: 1,
    duration: 300, // Reduced from 400+600
    ease: "Sine.easeInOut",
  });

  // Quick flash effects
  for (let i = 0; i < 3; i++) {
    this.time.delayedCall(i * 60, () => { // Reduced from 120
      this.tweens.add({
        targets: [this.lightOverlay],
        alpha: 0.15 + i * 0.04,
        duration: 40, // Reduced from 60
        yoyo: true,
        ease: "Linear",
      });
    });
  }

  // Faster peak and fade
  this.time.delayedCall(400, () => { // Reduced from 1200
    this.tweens.add({
      targets: this.currentElectro,
      scaleY: 1.1,
      alpha: 1,
      duration: 300, // Reduced from 500
      ease: "Sine.easeOut",
    });
  });

  this.time.delayedCall(700, () => { // Reduced from 1800
    this.tweens.add({
      targets: this.currentElectro,
      scaleY: 1.2,
      alpha: 1,
      duration: 250, // Reduced from 400
      ease: "Power2",
    });
  });

  this.time.delayedCall(950, () => { // Reduced from 2300
    this.tweens.add({
      targets: this.currentElectro,
      scaleY: 0.1,
      alpha: 0,
      duration: 250, // Reduced from 400
      ease: "Sine.easeIn",
    });

    this.game.events.emit("electricStop");

    this.showRevealText(idx, text);

    this.switchesPressed[idx] = true;
    this.switchCount++;

    if (this.switchCount >= 3) {
      this.time.delayedCall(800, () => { // Slightly reduced
        this.finishRound();
      });
    } else {
      this.time.delayedCall(400, () => { // Reduced from 600
        this.isPlaying = false;
      });
    }
  });
}

 private showRevealText(switchIdx: number, text: string) {
  const xPositions = [this.width * 0.2, this.width * 0.5, this.width * 0.8];
  const x = xPositions[switchIdx];
  const preBaseW = Math.round(this.width * 0.224);
  const preBaseH = Math.round(preBaseW * 0.75);
  const y = this.height * 0.32 - preBaseH * 0.035;

  let textColor = "#ffffff";
  let glowColor = "#ffd700";
  let bgHex = 0x3d2e0a;
  let fillHex = 0xd4af37;
  let borderHex = 0xf5d76e;
  let accentHex = 0xffd700;
  let screenLightHex = 0x5c4a12;

  if (this.pendingResult) {
    if (this.pendingResult.outcome === "win") {
      textColor = "#fffbe6";
      glowColor = "#ffd700";
      bgHex = 0x4a3a0c;
      fillHex = 0xd4af37;
      borderHex = 0xffd700;
      accentHex = 0xf5d76e;
      screenLightHex = 0x6b5518;
    } else if (this.pendingResult.outcome === "freeReplay") {
      textColor = "#e8ffff";
      glowColor = "#00e5ff";
      bgHex = 0x0a3040;
      fillHex = 0x06b6d4;
      borderHex = 0x22d3ee;
      accentHex = 0x67e8f9;
      screenLightHex = 0x0e4a5e;
    } else {
      textColor = "#fffbe6";
      glowColor = "#ffd700";
      bgHex = 0x3d2e0a;
      fillHex = 0xd4af37;
      borderHex = 0xf5d76e;
      accentHex = 0xffd700;
      screenLightHex = 0x5c4a12;
    }
  }

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

  const extras: Phaser.GameObjects.GameObject[] = [];

  const makeRoundedRect = (cx: number, cy: number, w: number, h: number, color: number, depth: number, r?: number): Phaser.GameObjects.Graphics => {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r !== undefined ? r : radius);
    g.setDepth(depth);
    g.setAlpha(0);
    return g;
  };

  const outerGlow1 = makeRoundedRect(bx, y, boxW + 24, boxH + 24, accentHex, 7, radius + 6);
  const outerGlow2 = makeRoundedRect(bx, y, boxW + 16, boxH + 16, fillHex, 7.5, radius + 4);
  extras.push(outerGlow1, outerGlow2);

  const borderThick = Math.max(3, Math.round(4 * sf));
  const borderOuter = makeRoundedRect(bx, y, boxW + borderThick * 2, boxH + borderThick * 2, borderHex, 8, radius + borderThick);
  extras.push(borderOuter);

  const screenBg = makeRoundedRect(bx, y, boxW, boxH, bgHex, 8.5);
  screenBg.setAlpha(1);
  screenBg.setScale(1, 0.02);
  this.revealedBgs[switchIdx] = screenBg;

  const screenLight = makeRoundedRect(bx, y, boxW - 2, boxH - 2, screenLightHex, 8.6);
  extras.push(screenLight);

  const innerFill = makeRoundedRect(bx, y, boxW - 4, boxH - 4, fillHex, 8.8);
  extras.push(innerFill);

  const innerHighlight = makeRoundedRect(bx, y - boxH * 0.18, boxW - 8, boxH * 0.3, 0xffffff, 8.9, Math.round(radius * 0.5));
  extras.push(innerHighlight);

  const bottomHighlight = makeRoundedRect(bx, y + boxH * 0.2, boxW - 8, boxH * 0.2, fillHex, 8.85, Math.round(radius * 0.5));
  extras.push(bottomHighlight);

  const cornerSize = Math.round(12 * sf);
  const corners = [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ].map(([dx, dy]) => {
    const cx = bx + dx * (boxW / 2 - cornerSize / 2);
    const cy = y + dy * (boxH / 2 - cornerSize / 2);
    const corner = makeRoundedRect(cx, cy, cornerSize, cornerSize, accentHex, 9.5, Math.round(cornerSize * 0.3));
    extras.push(corner);
    return corner;
  });

  const glow = this.add.text(bx, y, text, {
    fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif",
    fontSize: `${baseFontSize + 4}px`,
    color: glowColor,
    align: "center",
    stroke: glowColor,
    strokeThickness: Math.round(16 * sf),
    wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
  })
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(10);

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
  })
    .setOrigin(0.5)
    .setAlpha(0)
    .setScale(0.05)
    .setDepth(11);

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
  })
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(11);

  this.revealedTexts[switchIdx] = main;
  this.revealedGlows[switchIdx] = glow;
  this.revealedSubs[switchIdx] = sub;
  this.revealedBgExtras[switchIdx] = extras;

  // ============= OPTIMIZED ANIMATIONS =============
  // All durations and delays reduced by ~40-50%

  // Screen background grows quickly
  this.tweens.add({
    targets: screenBg,
    scaleY: 1,
    alpha: 1,
    duration: 120, // Was 200
    ease: "Power4",
  });

  // Quick flash
  this.time.delayedCall(40, () => { // Was 60
    this.tweens.add({
      targets: [this.lightOverlay],
      alpha: 0.25,
      duration: 30, // Was 50
      yoyo: true,
      ease: "Linear",
    });
  });

  // Border and glows appear faster
  this.time.delayedCall(80, () => { // Was 150
    this.tweens.add({
      targets: borderOuter,
      alpha: 1,
      duration: 80, // Was 150
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: outerGlow2,
      alpha: 0.35,
      duration: 150, // Was 300
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: outerGlow1,
      alpha: 0.2,
      duration: 200, // Was 400
      ease: "Sine.easeOut",
    });
  });

  // Screen light appears
  this.time.delayedCall(60, () => { // Was 120
    this.tweens.add({
      targets: screenLight,
      alpha: 0.5,
      duration: 120, // Was 200
      ease: "Sine.easeOut",
    });
  });

  // Inner elements appear
  this.time.delayedCall(100, () => { // Was 200
    this.tweens.add({
      targets: innerFill,
      alpha: 0.2,
      duration: 150, // Was 250
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: innerHighlight,
      alpha: 0.12,
      duration: 180, // Was 300
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: bottomHighlight,
      alpha: 0.08,
      duration: 180, // Was 300
      ease: "Sine.easeOut",
    });

    corners.forEach((c, i) => {
      this.time.delayedCall(i * 20, () => { // Was 40
        this.tweens.add({
          targets: c,
          alpha: 0.9,
          duration: 80, // Was 150
          ease: "Sine.easeOut",
        });
      });
    });
  });

  // Text reveals
  this.time.delayedCall(150, () => { // Was 250
    // Faster light flashes
    for (let i = 0; i < 3; i++) { // Reduced from 4 flashes to 3
      this.time.delayedCall(i * 30, () => { // Was 50
        this.tweens.add({
          targets: [this.lightOverlay],
          alpha: 0.08 + i * 0.05,
          duration: 15, // Was 25
          yoyo: true,
          ease: "Linear",
        });
      });
    }

    // Main text pops in
    this.tweens.add({
      targets: main,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 200, // Was 350
      ease: "Back.easeOut",
    });

    // Glow appears
    this.tweens.add({
      targets: glow,
      alpha: 0.4,
      duration: 180, // Was 300
      ease: "Sine.easeOut",
    });

    // Subtext appears
    this.tweens.add({
      targets: sub,
      alpha: 0.9,
      duration: 180, // Was 300
      ease: "Power2",
    });
  });

  // Looping animations start sooner but with less intensity
  this.time.delayedCall(400, () => { // Was 600
    // Outer glow pulsing - faster cycle
    this.tweens.add({
      targets: outerGlow1,
      alpha: { from: 0.2, to: 0.1 },
      duration: 600, // Was 1000
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: outerGlow2,
      alpha: { from: 0.35, to: 0.2 },
      duration: 500, // Was 800
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: 100, // Was 200
    });

    // Border pulsing
    this.tweens.add({
      targets: borderOuter,
      alpha: { from: 1, to: 0.6 },
      duration: 800, // Was 1200
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Text glow pulsing
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 0.2 },
      scaleX: { from: 1, to: 1.04 }, // Less scale change
      scaleY: { from: 1, to: 1.04 },
      duration: 600, // Was 1000
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Screen light pulsing
    this.tweens.add({
      targets: screenLight,
      alpha: { from: 0.5, to: 0.3 },
      duration: 1000, // Was 1800
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Inner fill pulsing
    this.tweens.add({
      targets: innerFill,
      alpha: { from: 0.2, to: 0.1 },
      duration: 900, // Was 1500
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Corner pulses - faster
    corners.forEach((c, i) => {
      this.tweens.add({
        targets: c,
        alpha: { from: 0.9, to: 0.4 },
        duration: 600, // Was 900
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: i * 60, // Was 100
      });
    });

    // Removed some redundant highlights to reduce complexity
    // (innerHighlight and bottomHighlight pulsing removed - they're subtle anyway)
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
  }

  private lightEffects() {
    this.lightBg = this.add
      .image(this.width / 2, this.height / 2, "blink")
      .setAlpha(0.08)
      .setDepth(5);
    this.lightOverlay = this.add
      .rectangle(this.width / 2, this.height / 2, this.width, this.height, 0xffffff)
      .setAlpha(0)
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    const glowColors = [0xff4444, 0x4488ff, 0x44dd66, 0xffd700, 0xff6600, 0xaa44ff, 0x00e5ff];
    const glowOrbs: Phaser.GameObjects.Graphics[] = [];
    const orbPositions = [
      { x: this.width * 0.15, y: this.height * 0.2 },
      { x: this.width * 0.85, y: this.height * 0.15 },
      { x: this.width * 0.5, y: this.height * 0.08 },
      { x: this.width * 0.1, y: this.height * 0.55 },
      { x: this.width * 0.9, y: this.height * 0.5 },
      { x: this.width * 0.3, y: this.height * 0.45 },
      { x: this.width * 0.7, y: this.height * 0.4 },
    ];

    orbPositions.forEach((pos, i) => {
      const color = glowColors[i % glowColors.length];
      const orbSize = 80 + Math.random() * 120;
      const g = this.add.graphics();
      g.setDepth(3);
      g.setAlpha(0);
      g.fillStyle(color, 0.3);
      g.fillCircle(pos.x, pos.y, orbSize);
      g.fillStyle(color, 0.15);
      g.fillCircle(pos.x, pos.y, orbSize * 1.6);
      g.fillStyle(color, 0.05);
      g.fillCircle(pos.x, pos.y, orbSize * 2.4);
      glowOrbs.push(g);

      this.tweens.add({
        targets: g,
        alpha: { from: 0, to: 0.25 + Math.random() * 0.2 },
        duration: 2000 + Math.random() * 2000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: i * 600,
      });
    });

    const sweepBar = this.add.graphics();
    sweepBar.setDepth(4);
    sweepBar.setAlpha(0);
    sweepBar.fillStyle(0xffd700, 0.08);
    sweepBar.fillRect(0, 0, this.width, this.height * 0.15);
    sweepBar.fillStyle(0xffffff, 0.03);
    sweepBar.fillRect(0, this.height * 0.03, this.width, this.height * 0.08);

    this.tweens.add({
      targets: sweepBar,
      y: { from: -this.height * 0.2, to: this.height * 1.2 },
      alpha: { from: 0, to: 0.6 },
      duration: 4000,
      ease: "Sine.easeInOut",
      repeat: -1,
      delay: 2000,
      onUpdate: (_tw: any, target: any) => {
        const progress = _tw.progress;
        if (progress > 0.8) {
          target.setAlpha(0.6 * (1 - (progress - 0.8) / 0.2));
        } else if (progress < 0.15) {
          target.setAlpha(0.6 * (progress / 0.15));
        }
      },
    });

    const edgeGlowLeft = this.add.graphics();
    edgeGlowLeft.setDepth(3.5);
    edgeGlowLeft.setAlpha(0);
    for (let i = 0; i < 5; i++) {
      edgeGlowLeft.fillStyle(0xff4444, 0.06 - i * 0.01);
      edgeGlowLeft.fillRect(0, 0, 20 + i * 15, this.height);
    }
    const edgeGlowRight = this.add.graphics();
    edgeGlowRight.setDepth(3.5);
    edgeGlowRight.setAlpha(0);
    for (let i = 0; i < 5; i++) {
      edgeGlowRight.fillStyle(0x4488ff, 0.06 - i * 0.01);
      edgeGlowRight.fillRect(this.width - 20 - i * 15, 0, 20 + i * 15, this.height);
    }

    this.tweens.add({
      targets: edgeGlowLeft,
      alpha: { from: 0, to: 0.7 },
      duration: 3000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: edgeGlowRight,
      alpha: { from: 0, to: 0.7 },
      duration: 3500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: 1500,
    });

    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const px = Math.random() * this.width;
      const py = Math.random() * this.height * 0.7;
      const pColor = glowColors[Math.floor(Math.random() * glowColors.length)];
      const pSize = 2 + Math.random() * 4;
      const particle = this.add.graphics();
      particle.setDepth(4.5);
      particle.setAlpha(0);
      particle.fillStyle(pColor, 1);
      particle.fillCircle(0, 0, pSize);
      particle.fillStyle(pColor, 0.3);
      particle.fillCircle(0, 0, pSize * 2.5);
      particle.setPosition(px, py);

      const driftX = (Math.random() - 0.5) * 100;
      const driftY = -30 - Math.random() * 60;
      const dur = 3000 + Math.random() * 4000;

      this.tweens.add({
        targets: particle,
        alpha: { from: 0, to: 0.5 + Math.random() * 0.4 },
        x: px + driftX,
        y: py + driftY,
        duration: dur,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 5000,
      });
    }

    const coronaTop = this.add.graphics();
    coronaTop.setDepth(3);
    coronaTop.setAlpha(0);
    const gradSteps = 8;
    for (let i = 0; i < gradSteps; i++) {
      const a = 0.06 * (1 - i / gradSteps);
      coronaTop.fillStyle(0xffd700, a);
      coronaTop.fillRect(0, i * (this.height * 0.06 / gradSteps), this.width, this.height * 0.06 / gradSteps);
    }
    this.tweens.add({
      targets: coronaTop,
      alpha: { from: 0.2, to: 0.8 },
      duration: 2500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.time.addEvent({
      delay: 8000,
      callback: () => {
        const flashColor = glowColors[Math.floor(Math.random() * glowColors.length)];
        const flash = this.add.graphics();
        flash.setDepth(5.5);
        flash.setAlpha(0);
        flash.fillStyle(flashColor, 0.12);
        flash.fillRect(0, 0, this.width, this.height);
        this.tweens.add({
          targets: flash,
          alpha: { from: 0, to: 0.3 },
          duration: 120,
          yoyo: true,
          ease: "Linear",
          onComplete: () => {
            flash.destroy();
          },
        });
      },
      loop: true,
    });

    this.time.addEvent({
      delay: 15000,
      callback: () => {
        for (let i = 0; i < 4; i++) {
          this.time.delayedCall(i * 150, () => {
            this.tweens.add({
              targets: [this.lightOverlay],
              alpha: 0.08 + i * 0.02,
              duration: 80,
              yoyo: true,
              ease: "Linear",
            });
          });
        }
      },
      loop: true,
    });

    this.time.addEvent({
      delay: 2500,
      callback: () => {
        this.tweens.add({
          targets: [this.lightBg],
          alpha: { from: 0.08, to: 0.2 },
          duration: 150,
          yoyo: true,
          ease: "Linear",
        });
      },
      loop: true,
    });
  }

  private createAnims() {
    const frameRate = 6;
    this.anims.create({
      key: "bgAnim",
      frames: [{ key: "bg1" }, { key: "bg2" }, { key: "bg3" }],
      frameRate: 2,
      repeat: -1,
    });
    this.anims.create({
      key: "bgUpperAnim",
      frames: [{ key: "bg11" }, { key: "bg21" }, { key: "bg31" }],
      frameRate: 2,
      repeat: -1,
    });
    this.anims.create({
      key: "electronics",
      frames: [{ key: "electro1" }, { key: "electro2" }],
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: "redElectro",
      frames: [{ key: "redElectro1" }, { key: "redElectro2" }],
      frameRate: frameRate,
      repeat: -1,
    });
    this.anims.create({
      key: "blueElectro",
      frames: [{ key: "blueElectro1" }, { key: "blueElectro2" }],
      frameRate: frameRate,
      repeat: -1,
    });
    this.anims.create({
      key: "greenElectro",
      frames: [{ key: "greenElectro1" }, { key: "greenElectro2" }],
      frameRate: frameRate,
      repeat: -1,
    });
  }

  private createBg() {
    const bg = this.add
      .sprite(this.width / 2, this.height / 2, "bg1")
      .play("bgAnim");
    bg.setDisplaySize(this.width, this.height);
    const bgUpper = this.add
      .sprite(this.width / 2, this.height / 2, "bg11")
      .setDepth(2)
      .play("bgUpperAnim");
    bgUpper.setDisplaySize(this.width, this.height);
  }

  private createBtns() {
    this.redBtnImg = this.add.sprite(this.width / 2, this.redBtnH, "redBtn");
    this.blueBtnImg = this.add.sprite(this.width / 2, this.blueBtnH, "blueBtn");
    this.greenBtnImg = this.add.sprite(this.width / 2, this.greenBtnH, "greenBtn");

    this.redBtn = this.physics.add
      .sprite(this.width * 0.2, this.redBtnH + 330, "redBtn")
      .setScale(0.15, 0.06)
      .setDepth(-1)
      .setInteractive();
    this.blueBtn = this.physics.add
      .sprite(this.width * 0.5, this.blueBtnH + 320, "redBtn")
      .setScale(0.15, 0.06)
      .setDepth(-1)
      .setInteractive();
    this.greenBtn = this.physics.add
      .sprite(this.width * 0.8, this.greenBtnH + 320, "redBtn")
      .setScale(0.15, 0.06)
      .setDepth(-1)
      .setInteractive();

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
        this.tweens.add({
          targets: this.redBtnImg,
          y: this.redBtnH + 10,
          duration: 100,
          yoyo: false,
          onComplete: () => this.handleSwitchPress(1),
        });
      }
    });
    this.blueBtn.on("pointerdown", () => {
      if (!this.isPlaying && this.buttonsEnabled && !this.switchesPressed[1]) {
        this.isPlaying = true;
        this.pendingSwitchIndex = 1;
        this.tweens.add({
          targets: this.blueBtnImg,
          y: this.blueBtnH + 10,
          duration: 100,
          yoyo: false,
          onComplete: () => this.handleSwitchPress(2),
        });
      }
    });
    this.greenBtn.on("pointerdown", () => {
      if (!this.isPlaying && this.buttonsEnabled && !this.switchesPressed[2]) {
        this.isPlaying = true;
        this.pendingSwitchIndex = 2;
        this.tweens.add({
          targets: this.greenBtnImg,
          y: this.greenBtnH + 10,
          duration: 100,
          yoyo: false,
          onComplete: () => this.handleSwitchPress(3),
        });
      }
    });
  }

  private handleSwitchPress(switchIndex: number) {
    if (this.callbacks) {
      this.callbacks.onSwitchPressed(switchIndex);
    }
  }
}