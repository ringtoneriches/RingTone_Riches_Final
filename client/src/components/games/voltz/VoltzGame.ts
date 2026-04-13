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

  // Premium glow properties
  private ambientGlow!: Phaser.GameObjects.Rectangle;
  private btnGlows: { red: Phaser.GameObjects.Graphics | null; blue: Phaser.GameObjects.Graphics | null; green: Phaser.GameObjects.Graphics | null } = { red: null, blue: null, green: null };
  private floatingParticles: Phaser.GameObjects.Graphics[] = [];
  private electroGlow!: Phaser.GameObjects.Graphics;

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

  private showRevealText(switchIdx: number, text: string) {
    const xPositions = [this.width * 0.2, this.width * 0.5, this.width * 0.8];
    const x = xPositions[switchIdx];
    const preBaseW = Math.round(this.width * 0.224);
    const preBaseH = Math.round(preBaseW * 0.75);
    const y = this.height * 0.32 - preBaseH * 0.035;

    // Premium glowing colors - Voltz signature
    const coreColor = 0xffaa33;      // Rich amber gold
    const midColor = 0xffdd77;       // Bright gold
    const outerColor = 0xfff5cc;     // Soft radiant glow
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

    // === PREMIUM MULTI-LAYER GLOW SYSTEM ===
    
    // Layer 5: Outermost aura (largest, softest)
    const outerAura = this.add.graphics();
    outerAura.fillStyle(outerColor, 0.08);
    outerAura.fillRoundedRect(bx - boxW / 2 - 35, y - boxH / 2 - 35, boxW + 70, boxH + 70, radius + 18);
    outerAura.setDepth(5);
    outerAura.setAlpha(0);

    // Layer 4: Wide glow
    const wideGlow = this.add.graphics();
    wideGlow.fillStyle(midColor, 0.15);
    wideGlow.fillRoundedRect(bx - boxW / 2 - 22, y - boxH / 2 - 22, boxW + 44, boxH + 44, radius + 12);
    wideGlow.setDepth(6);
    wideGlow.setAlpha(0);

    // Layer 3: Medium intense glow
    const mediumGlow = this.add.graphics();
    mediumGlow.fillStyle(coreColor, 0.3);
    mediumGlow.fillRoundedRect(bx - boxW / 2 - 12, y - boxH / 2 - 12, boxW + 24, boxH + 24, radius + 7);
    mediumGlow.setDepth(7);
    mediumGlow.setAlpha(0);

    // Layer 2: Inner hot glow
    const innerHotGlow = this.add.graphics();
    innerHotGlow.fillStyle(0xffaa44, 0.55);
    innerHotGlow.fillRoundedRect(bx - boxW / 2 - 5, y - boxH / 2 - 5, boxW + 10, boxH + 10, radius + 3);
    innerHotGlow.setDepth(7.5);
    innerHotGlow.setAlpha(0);

    // Layer 1: Main solid metallic box with gradient feel
    const mainBox = this.add.graphics();
    mainBox.fillStyle(coreColor, 1);
    mainBox.fillRoundedRect(bx - boxW / 2, y - boxH / 2, boxW, boxH, radius);
    mainBox.setDepth(8);
    mainBox.setAlpha(0);
    mainBox.setScale(1, 0.02);
    
    // Premium shimmer line (top edge highlight)
    const topShimmer = this.add.graphics();
    topShimmer.fillStyle(0xffeedd, 0.7);
    topShimmer.fillRoundedRect(bx - boxW / 2 + 5, y - boxH / 2 + 3, boxW - 10, 5, 2);
    topShimmer.setDepth(9);
    topShimmer.setAlpha(0);
    
    // Bottom accent glow
    const bottomAccent = this.add.graphics();
    bottomAccent.fillStyle(coreColor, 0.4);
    bottomAccent.fillRoundedRect(bx - boxW / 2 + 5, y + boxH / 2 - 8, boxW - 10, 5, 2);
    bottomAccent.setDepth(9);
    bottomAccent.setAlpha(0);
    
    this.revealedBgs[switchIdx] = mainBox;

    // Main text with premium styling
    const main = this.add.text(bx, y, text, {
      fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif",
      fontSize: `${baseFontSize}px`,
      color: textColor,
      align: "center",
      stroke: "#000000",
      strokeThickness: Math.round(7 * sf),
      wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
      shadow: {
        offsetX: 0,
        offsetY: Math.round(4 * sf),
        color: 'rgba(0,0,0,0.98)',
        blur: Math.round(15 * sf),
        fill: true,
      },
    }).setOrigin(0.5).setAlpha(0).setScale(0.05).setDepth(12);

    // Text inner glow effect (duplicate text with blur)
    const textGlow = this.add.text(bx, y, text, {
      fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif",
      fontSize: `${baseFontSize}px`,
      color: "#ffdd99",
      align: "center",
      stroke: "#ffaa33",
      strokeThickness: Math.round(3 * sf),
    }).setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);

    const switchLabels = ["⚡ RED ⚡", "⚡ BLUE ⚡", "⚡ GREEN ⚡"];
    const labelColors = ["#ff6666", "#66aaff", "#66ff88"];
    const subFontSize = Math.max(Math.round(13 * sf), 9);
    const sub = this.add.text(bx, y + boxH / 2 + Math.round(14 * sf), switchLabels[switchIdx], {
      fontFamily: "Impact, 'Arial Black', sans-serif",
      fontSize: `${subFontSize}px`,
      color: labelColors[switchIdx],
      align: "center",
      stroke: "#000000",
      strokeThickness: Math.round(4 * sf),
      letterSpacing: Math.round(8 * sf),
    }).setOrigin(0.5).setAlpha(0).setDepth(11);

    this.revealedTexts[switchIdx] = main;
    this.revealedSubs[switchIdx] = sub;
    this.revealedBgExtras[switchIdx] = [mainBox, outerAura, wideGlow, mediumGlow, innerHotGlow, topShimmer, bottomAccent, textGlow];

    // === ANIMATION SEQUENCE ===
    
    // Main box pop
    this.tweens.add({ 
      targets: mainBox, 
      scaleY: 1, 
      alpha: 1, 
      duration: 200, 
      ease: "Back.easeOutCubic" 
    });

    // Glow layers fade in with cascade
    this.time.delayedCall(20, () => {
      this.tweens.add({ targets: outerAura, alpha: 0.8, duration: 250, ease: "Sine.easeOut" });
    });
    
    this.time.delayedCall(45, () => {
      this.tweens.add({ targets: wideGlow, alpha: 0.9, duration: 220, ease: "Sine.easeOut" });
      this.tweens.add({ targets: topShimmer, alpha: 0.9, duration: 280, ease: "Sine.easeOut" });
    });
    
    this.time.delayedCall(70, () => {
      this.tweens.add({ targets: mediumGlow, alpha: 1, duration: 200, ease: "Sine.easeOut" });
      this.tweens.add({ targets: bottomAccent, alpha: 0.6, duration: 250, ease: "Sine.easeOut" });
    });
    
    this.time.delayedCall(95, () => {
      this.tweens.add({ targets: innerHotGlow, alpha: 1, duration: 180, ease: "Sine.easeOut" });
    });

    // Text reveal with bounce
    this.time.delayedCall(110, () => {
      this.tweens.add({ 
        targets: main, 
        alpha: 1, 
        scaleX: 1, 
        scaleY: 1, 
        duration: 250, 
        ease: "Back.easeOutCubic" 
      });
      this.tweens.add({ 
        targets: textGlow, 
        alpha: 0.6, 
        duration: 300, 
        ease: "Power2" 
      });
      this.tweens.add({ 
        targets: sub, 
        alpha: 1, 
        duration: 250, 
        ease: "Back.easeOut" 
      });
    });

    // === PREMIUM SUSTAINED PULSING ===
    this.time.delayedCall(400, () => {
      // Outer aura gentle breathe
      this.tweens.add({
        targets: outerAura,
        alpha: { from: 0.08, to: 0.18 },
        duration: 1500,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1
      });
      
      // Wide glow pulse
      this.tweens.add({
        targets: wideGlow,
        alpha: { from: 0.15, to: 0.28 },
        duration: 1200,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1
      });
      
      // Medium glow energetic pulse
      this.tweens.add({
        targets: mediumGlow,
        alpha: { from: 0.3, to: 0.55 },
        duration: 900,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1
      });
      
      // Inner hot glow fast flicker
      this.tweens.add({
        targets: innerHotGlow,
        alpha: { from: 0.55, to: 0.85 },
        duration: 600,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1
      });
      
      // Text glow shimmer
      this.tweens.add({
        targets: textGlow,
        alpha: { from: 0.4, to: 0.9 },
        duration: 800,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1
      });
      
      // Top shimmer flowing
      this.tweens.add({
        targets: topShimmer,
        alpha: { from: 0.5, to: 1 },
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
  }

  private createAmbientGlow() {
    // Dynamic ambient glow that pulses with energy
    this.ambientGlow = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x2244aa, 0.05);
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
      edgeGlowLeft.fillStyle(0xff4488, 0.03 - i * 0.003);
      edgeGlowLeft.fillRect(0, 0, 20 + i * 12, this.height);
    }
    const edgeGlowRight = this.add.graphics();
    edgeGlowRight.setDepth(3);
    for (let i = 0; i < 6; i++) {
      edgeGlowRight.fillStyle(0x44aaff, 0.03 - i * 0.003);
      edgeGlowRight.fillRect(this.width - 20 - i * 12, 0, 20 + i * 12, this.height);
    }
    this.tweens.add({ targets: edgeGlowLeft, alpha: { from: 0, to: 0.7 }, duration: 2500, ease: "Sine.easeInOut", yoyo: true, repeat: -1 });
    this.tweens.add({ targets: edgeGlowRight, alpha: { from: 0, to: 0.7 }, duration: 2800, ease: "Sine.easeInOut", yoyo: true, repeat: -1, delay: 800 });

    // === FLOATING ENERGY PARTICLES ===
    const glowColors = [0xff3366, 0x33ff66, 0x3399ff, 0xffaa33, 0xff66cc, 0x66ffcc];
    for (let i = 0; i < 35; i++) {
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
    const bgUpper = this.add.sprite(this.width / 2, this.height / 2, "bg11").setDepth(2).play("bgUpperAnim");
    bgUpper.setDisplaySize(this.width, this.height);
  }

  private createButtonGlows() {
    const redX = this.width * 0.2;
    const blueX = this.width * 0.5;
    const greenX = this.width * 0.8;
    const btnY = this.redBtnH + 330;

    const redColor = 0xff4466;
    const blueColor = 0x44aaff;
    const greenColor = 0x44ff88;

    this.btnGlows.red = this.add.graphics();
    this.btnGlows.red.setDepth(0);
    this.createGlowForButton(this.btnGlows.red, redX, btnY, redColor);
    
    this.btnGlows.blue = this.add.graphics();
    this.btnGlows.blue.setDepth(0);
    this.createGlowForButton(this.btnGlows.blue, blueX, btnY, blueColor);
    
    this.btnGlows.green = this.add.graphics();
    this.btnGlows.green.setDepth(0);
    this.createGlowForButton(this.btnGlows.green, greenX, btnY, greenColor);
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
    if (this.callbacks) { this.callbacks.onSwitchPressed(switchIndex); }
  }
}