import { Scene } from "phaser";
import { ALL_SYM_KEYS } from "./Preload";

export interface SpinResult {
  isWin: boolean;
  coinsWon: number;
  prizeType: string;
  prizeName: string;
}

export interface SlotCallbacks {
  onSpinRequest: () => void;
}

const ACTIVE_SYMS = [
  "sym_coin", "sym_tomato", "sym_apple", "sym_pts750", "sym_pts1000",
];

export class SlotGame extends Scene {
  private W = 0;
  private H = 0;

  // ─────────────────────────────────────────────────────────────
  // TUNING KNOBS — adjust these 6 numbers to match YOUR artwork.
  // They are fractions of the slot-machine image's half-width /
  // half-height, measured from the image's own center point.
  // Negative = up/left, Positive = down/right, 0 = dead center.
  //
  // Example: if the reel window in your PNG sits slightly above
  // center and takes up about half the image width, try:
  //   REEL_CENTER_X_PCT = 0
  //   REEL_CENTER_Y_PCT = -0.05
  //   REEL_SPAN_X_PCT   = 0.55
  //   REEL_SPAN_Y_PCT   = 0.30
  //
  // Bump these up/down in small steps (0.02-0.05 at a time) and
  // reload until the symbols land inside the actual window cutout.
  // ─────────────────────────────────────────────────────────────
  private readonly REEL_CENTER_X_PCT = 0;
  private readonly REEL_CENTER_Y_PCT = -0.02;
  private readonly REEL_SPAN_X_PCT = 0.33;
  private readonly REEL_SPAN_Y_PCT = 0.22;

  // Spin button position, same fraction system, relative to the
  // slot machine image. Your "Ringtone Riches" art already draws its
  // own "SPIN TO WIN" button baked into the PNG, so we ONLY place an
  // invisible clickable hotspot on top of it — no second button image.
  private readonly USE_VISIBLE_SPIN_BUTTON = false;
  private readonly SPIN_BTN_X_PCT = 0;
  private readonly SPIN_BTN_Y_PCT = 0.66;
  private readonly SPIN_BTN_HOTSPOT_W_PCT = 0.26;
  private readonly SPIN_BTN_HOTSPOT_H_PCT = 0.10;

  // Your reference image fills its box edge-to-edge (the casino hall
  // background touches every side), so fit it close to 100% instead
  // of leaving padding around it.
  private readonly MACHINE_FIT_WIDTH_RATIO = 0.98;
  private readonly MACHINE_FIT_HEIGHT_RATIO = 0.98;

  // Your "slot" image already bakes in the frame, crown, jackpot
  // banner, spin button, AND the handle — so we skip drawing separate
  // handle/logo/lamp sprites entirely to avoid doubling them up.
  private readonly DRAW_DECORATIVE_EXTRAS = true;

  private CX = 0;
  private CY = 0;
  private machineDisplayW = 0;
  private machineDisplayH = 0;
  private colXs: number[] = [];
  private rowYs: number[] = [];
  private symbolSize = 90;

  private cells: Phaser.GameObjects.Image[][] = [];
  private spinBtn!: Phaser.GameObjects.Image | Phaser.GameObjects.Zone;
  private sounds: Record<string, Phaser.Sound.BaseSound | null> = {};
private reelBgs: Phaser.GameObjects.Image[] = [];
  private spinning = false;
  private reelStopped = [false, false, false];
  private spinTimer: Phaser.Time.TimerEvent | null = null;
  private spinStartTime = 0;
  private readonly MIN_SPIN_MS = 2200;
  private callbacks: SlotCallbacks | null = null;
  private pendingFull: any = null;

  // UI Elements
  private slotMachine!: Phaser.GameObjects.Image;
  private handle!: Phaser.GameObjects.Image | null;
  private handleBall!: Phaser.GameObjects.Image | null;
  private logo!: Phaser.GameObjects.Image | null;
  private lampsArray: any[] = [];
  private lampOn!: Phaser.GameObjects.Image | null;
  private lampOff!: Phaser.GameObjects.Image | null;

  private winAmountText!: Phaser.GameObjects.Text;

  private reelSpacing = 0;
private readonly STRIP_LEN = 5; // 3 visible rows + 2 buffer symbols (top/bottom)
private colStrips: Phaser.GameObjects.Image[][] = [[], [], []];
private colSpinning: boolean[] = [false, false, false];
private readonly SPIN_SPEED = 1300; // px/sec while spinning
private reelMask: Phaser.Display.Masks.GeometryMask | null = null;

  constructor() {
    super("SlotGame");
  }

 create() {
    this.W = this.cameras.main.width;
    this.H = this.cameras.main.height;
    this.CX = this.W / 2;
    this.CY = this.H / 2;

    // Fix: Make sure background is added properly
    const bg = this.add.image(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "background"
    );

   bg.setOrigin(0.5, 0.5);

    // COVER behavior: scale by the larger ratio so the image fills
    // the whole canvas with no gaps, cropping whatever overflows
    // (instead of stretching/squashing to fit both dimensions).
    const bgScale = Math.max(
      this.cameras.main.width / bg.width,
      this.cameras.main.height / bg.height
    );
    bg.setScale(bgScale);

    // Ensure it's behind everything
    bg.setDepth(-100);
    bg.setOrigin(0.5, 0.5); // Add this line to ensure proper centering

    this.drawSlotMachine();
    this.computeReelLayout();
    this.drawReelCells();
    this.drawSpinButton();
    this.drawUI();
    this.initSounds();
}

  setCallbacks(cb: SlotCallbacks) {
    this.callbacks = cb;
  }

  deliverResult(result: SpinResult, fullResult?: any) {
    if (fullResult) this.pendingFull = fullResult;
    const elapsed = Date.now() - this.spinStartTime;
    const wait = Math.max(0, this.MIN_SPIN_MS - elapsed);
    this.time.delayedCall(wait, () => this.stopReels(result));
  }

  // ──────────────────────── Slot Machine Visual ────────────────────────

  private drawSlotMachine() {
    // const bg = this.add.graphics();
    // bg.fillStyle(0x1a0a2e, 1);
    // bg.fillRect(0, 0, this.W, this.H);
    // bg.setDepth(-10);

    const isMobile = this.W < 768;

this.slotMachine = this.add.image(
    this.CX,
    this.CY,
    "slot"
);

    // Auto-fit the machine image to the available canvas instead of a
    // hardcoded 0.9 scale, so it doesn't overflow small containers.
    const nativeW = this.slotMachine.width;
    const nativeH = this.slotMachine.height;


 const fitScale = Math.min(
      (this.W * this.MACHINE_FIT_WIDTH_RATIO) / nativeW,
      (this.H * this.MACHINE_FIT_HEIGHT_RATIO) / nativeH
    );
    this.slotMachine.setScale(fitScale);
    this.slotMachine.setDepth(0);

    this.machineDisplayW = nativeW * fitScale;
    this.machineDisplayH = nativeH * fitScale;

    // ---------- Draw 3 reel backgrounds ----------

const reelCenterX =
  this.CX + this.REEL_CENTER_X_PCT * (this.machineDisplayW / 2);

const reelCenterY =
  this.CY + this.REEL_CENTER_Y_PCT * (this.machineDisplayH / 2);

const spanX = this.REEL_SPAN_X_PCT * this.machineDisplayW;
const spanY = this.REEL_SPAN_Y_PCT * this.machineDisplayH;

const reelWidth = spanX / 3;
const reelHeight = spanY * 1.5;

const reelXs = [
  reelCenterX - spanX / 2,
  reelCenterX,
  reelCenterX + spanX / 2,
];

for (const x of reelXs) {
  const reel = this.add.image(x, reelCenterY, "reel");

  reel.setDisplaySize(reelWidth * 1.2, reelHeight);

  reel.setDepth(1);

  this.reelBgs.push(reel);
}

    if (!this.DRAW_DECORATIVE_EXTRAS) {
      this.handle = null;
      this.handleBall = null;
      this.logo = null;
      return;
    }

    // These optional decorative pieces (handle, ball, logo) only get
    // drawn if the textures were actually loaded. Wrap in try/catch so
    // a themed asset pack that doesn't include them (like a baked
    // "Royal Reels" card image) doesn't crash the scene.
    this.handle = this.tryAddImage(
      this.CX + this.machineDisplayW * 0.32,
      this.CY + this.machineDisplayH * 0.13,
      "handle"
    );
    if (this.handle) {
      this.handle.setOrigin(0.5, 1.2);
      this.handle.setScale(0.5 * fitScale * 1.6);
      this.handle.setDepth(5);
    }

    this.handleBall = this.tryAddImage(
      this.CX + this.machineDisplayW * 0.33,
      this.CY - this.machineDisplayH * 0.13,
      "handle_ball"
    );
    if (this.handleBall) {
      this.handleBall.setScale(0.6 * fitScale * 1.6);
      this.handleBall.setDepth(5);
    }

    this.logo = this.tryAddImage(this.CX, this.CY - this.machineDisplayH * 0.35, "logo");
    if (this.logo) {
      this.logo.setScale(0.2 * fitScale * 1.4);;
      this.logo.setDepth(5);
    }
  }

  private tryAddImage(x: number, y: number, key: string): Phaser.GameObjects.Image | null {
    if (!this.textures.exists(key)) return null;
    return this.add.image(x, y, key);
  }

  private drawLampsIfAvailable() {
    if (!this.DRAW_DECORATIVE_EXTRAS) return;
    if (!this.textures.exists("lamp_on")) return;

    const lampX = this.machineDisplayW * 0.44;
    const lampY = this.CY - this.machineDisplayH * 0.5;

    this.lampOn = this.add.image(this.CX - lampX, lampY, "lamp_on");
    this.lampOn.setScale(0.8);
    this.lampOn.setDepth(5);

    const rightKey = this.textures.exists("lamp_off") ? "lamp_off" : "lamp_on";
    this.lampOff = this.add.image(this.CX + lampX, lampY, rightKey);
    this.lampOff.setScale(-0.8, 0.8);
    this.lampOff.setDepth(5);

    this.lampsArray = [this.lampOn, this.lampOff];

    this.tweens.add({
      targets: this.lampsArray,
      alpha: { from: 1, to: 0.3 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // ──────────────────────── Reel layout & cells ────────────────────────

  private computeReelLayout() {
    const reelCenterX = this.CX + this.REEL_CENTER_X_PCT * (this.machineDisplayW / 2);
    const reelCenterY = this.CY + this.REEL_CENTER_Y_PCT * (this.machineDisplayH / 2);
    const spanX = this.REEL_SPAN_X_PCT * this.machineDisplayW;
    const spanY = this.REEL_SPAN_Y_PCT * this.machineDisplayH;

    this.colXs = [reelCenterX - spanX / 2, reelCenterX, reelCenterX + spanX / 2];
    this.rowYs = [reelCenterY - spanY / 2, reelCenterY, reelCenterY + spanY / 2];

    // Symbol size scales with the column spacing so it stays
    // proportionate no matter how big/small the machine image is.
    this.symbolSize = Math.max(24, (spanX / 2) * 0.55);
    this.reelSpacing = this.rowYs[1] - this.rowYs[0];
  }

  private drawReelCells() {
  this.cells = [[], [], []];
  this.colStrips = [[], [], []];

  const maskX = this.colXs[0] - this.symbolSize * 0.7;
  const maskW = (this.colXs[2] - this.colXs[0]) + this.symbolSize * 1.4;
  const maskY = this.rowYs[0] - this.symbolSize * 0.55;
  const maskH = (this.rowYs[2] - this.rowYs[0]) + this.symbolSize * 1.1;

  const maskGfx = this.make.graphics(undefined, false);
  maskGfx.fillStyle(0xffffff);
  maskGfx.fillRect(maskX, maskY, maskW, maskH);
  this.reelMask = maskGfx.createGeometryMask();

  const offsets = [-2, -1, 0, 1, 2]; // top buffer -> bottom buffer

  for (let col = 0; col < 3; col++) {
    this.colStrips[col] = [];
    for (let i = 0; i < this.STRIP_LEN; i++) {
      const key = ALL_SYM_KEYS[Math.floor(Math.random() * ALL_SYM_KEYS.length)];
      const y = this.rowYs[1] + offsets[i] * this.reelSpacing;
      const img = this.add.image(this.colXs[col], y, key);
      this.fitSymbol(img);
      img.setDepth(2);
      img.setMask(this.reelMask);
      this.colStrips[col].push(img);

      if (i >= 1 && i <= 3) this.cells[i - 1][col] = img; // visible rows
    }
  }
}

private fitSymbol(img: Phaser.GameObjects.Image) {
  const scale = Math.min(this.symbolSize / img.width, this.symbolSize / img.height);
  img.setScale(scale);
}

  // ──────────────────────── Spin Button ────────────────────────

  private drawSpinButton() {
    const btnX = this.CX + this.SPIN_BTN_X_PCT * (this.machineDisplayW / 2);
    const btnY = this.CY + this.SPIN_BTN_Y_PCT * (this.machineDisplayH / 2);
    const hotspotW = this.SPIN_BTN_HOTSPOT_W_PCT * this.machineDisplayW;
    const hotspotH = this.SPIN_BTN_HOTSPOT_H_PCT * this.machineDisplayH;

    if (this.USE_VISIBLE_SPIN_BUTTON && this.textures.exists("button_spin")) {
      const btn = this.add.image(btnX, btnY, "button_spin");
      btn.setDisplaySize(hotspotW, hotspotH);
      btn.setDepth(6);
      btn.setInteractive({ useHandCursor: true });
      btn.on("pointerover", () => {
        if (!this.spinning && this.textures.exists("button_spin_hover")) {
          btn.setTexture("button_spin_hover");
        }
      });
      btn.on("pointerout", () => {
        if (!this.spinning) btn.setTexture("button_spin");
      });
      btn.on("pointerdown", () => {
        if (!this.spinning) this.beginSpin();
      });
      this.spinBtn = btn;
    } else {
      // Invisible clickable hotspot over the baked-in button artwork.
      const zone = this.add.zone(btnX, btnY, hotspotW, hotspotH);
      zone.setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => {
        if (!this.spinning) this.beginSpin();
      });
      this.spinBtn = zone;
    }
  }

  // ──────────────────────── UI Elements ────────────────────────

  private drawUI() {
    // Credit / total bet text removed — the surrounding app UI already
    // shows Total Credits, Credits/Spin, and Credits Won as cards.

    this.winAmountText = this.add.text(
      this.CX,
      this.rowYs[1],
      "0",
      {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#E6BE00",
        fontStyle: "bold",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
      }
    ).setOrigin(0.5).setDepth(10);
    this.winAmountText.setVisible(false);
  }

  // ──────────────────────── Sounds ────────────────────────

  private initSounds() {
    const add = (key: string, src: string) => {
      try { this.sounds[key] = this.sound.add(src); } catch { this.sounds[key] = null; }
    };
    add("spin", "spin_clip");
    add("win", "win_clip");
    add("lose", "lose_clip");
    add("coins", "wincoins_clip");
    add("button", "button_click");
  }

  private play(key: string) {
    try { this.sounds[key]?.play(); } catch {}
  }

  // ──────────────────────── Spin logic ────────────────────────

private beginSpin() {
  this.spinning = true;
  this.reelStopped = [false, false, false];
  this.colSpinning = [true, true, true];
  this.spinStartTime = Date.now();
  this.pendingFull = null;

  this.play("button");
  this.play("spin");

  if (this.spinBtn instanceof Phaser.GameObjects.Image) {
    this.tweens.add({
      targets: this.spinBtn,
      y: this.spinBtn.y + 4,
      duration: 80,
      yoyo: true,
      onComplete: () => (this.spinBtn as Phaser.GameObjects.Image).setAlpha(1),
    });
  }

  this.callbacks?.onSpinRequest();
}

private animateHandle() {
  if (!this.handle || !this.handleBall) return;

  const handle = this.handle;
  const ball = this.handleBall;

  // Save original positions
  const handleX = handle.x;
  const handleY = handle.y;
  const ballX = ball.x;
  const ballY = ball.y;

  // Rotate handle around its top
  handle.setOrigin(0.5, 0.08);

  this.tweens.add({
    targets: handle,
    angle: 170,          // almost a full pull
    duration: 220,
    ease: "Cubic.easeIn",

    onUpdate: () => {
      // Move the ball with the handle
      const r = Phaser.Math.DegToRad(handle.angle);

      const length = 95; // distance from pivot to ball

      ball.x = handle.x + Math.sin(r) * length;
      ball.y = handle.y + Math.cos(r) * length;
    },

    onComplete: () => {

      this.tweens.add({
        targets: handle,
        angle: 0,
        duration: 450,
        ease: "Back.easeOut",

        onUpdate: () => {
          const r = Phaser.Math.DegToRad(handle.angle);

          const length = 95;

          ball.x = handle.x + Math.sin(r) * length;
          ball.y = handle.y + Math.cos(r) * length;
        },

        onComplete: () => {
          handle.setOrigin(0.5, 1.2);

          handle.x = handleX;
          handle.y = handleY;

          ball.x = ballX;
          ball.y = ballY;
        }
      });

    }
  });
}

  private startSymbolCycling() {
    this.spinTimer = this.time.addEvent({
      delay: 68,
      callback: () => {
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            if (this.reelStopped[col]) continue;
            this.cells[row][col].setTexture(ALL_SYM_KEYS[Math.floor(Math.random() * ALL_SYM_KEYS.length)]);
          }
        }
      },
      loop: true,
    });
  }

  update(time: number, delta: number) {
  if (!this.spinning) return;
  const dy = (this.SPIN_SPEED * delta) / 1000;
  const total = this.STRIP_LEN * this.reelSpacing;
  const bottomLimit = this.rowYs[1] + 2.5 * this.reelSpacing;

  for (let col = 0; col < 3; col++) {
    if (!this.colSpinning[col]) continue;
    for (const img of this.colStrips[col]) {
      img.y += dy;
      if (img.y > bottomLimit) {
        img.y -= total;
        img.setTexture(ALL_SYM_KEYS[Math.floor(Math.random() * ALL_SYM_KEYS.length)]);
        this.fitSymbol(img);
      }
    }
  }
}

private stopReels(result: SpinResult) {
  const grid = this.buildFinalGrid(result);
  const total = this.STRIP_LEN * this.reelSpacing;
  const offsets = [-2, -1, 0, 1, 2];
  const topBound = this.rowYs[1] - 2.5 * this.reelSpacing;

  [0, 1, 2].forEach((col) => {
    this.time.delayedCall(col * 350, () => {
      this.reelStopped[col] = true;
      this.colSpinning[col] = false;

      const strip = this.colStrips[col];

      strip.forEach((img, i) => {
        const targetY = this.rowYs[1] + offsets[i] * this.reelSpacing;

        if (i >= 1 && i <= 3) {
          img.setTexture(grid[i - 1][col]);
        } else {
          img.setTexture(ALL_SYM_KEYS[Math.floor(Math.random() * ALL_SYM_KEYS.length)]);
        }
        this.fitSymbol(img);

        const startY = img.y;
        let diff = targetY - startY;
        diff = ((diff % total) + total) % total;
        diff += total * 2; // two extra laps = visible slow-down before landing

        const proxy = { p: 0 };
        this.tweens.add({
          targets: proxy,
          p: 1,
          duration: 900,
          ease: "Cubic.easeOut",
          onUpdate: () => {
            const raw = startY + diff * proxy.p;
            // wrap continuously so it never leaves the masked window
            img.y = topBound + (((raw - topBound) % total) + total) % total;
          },
          onComplete: () => {
            img.y = targetY; // pixel-perfect snap, kills float drift
            if (i === 2 && col === 2) {
              this.time.delayedCall(150, () => this.showResult(result));
            }
          },
        });
      });
    });
  });
}

  private buildFinalGrid(result: SpinResult): string[][] {
    const grid: string[][] = [[], [], []];
    if (result.isWin) {
      const w = this.chooseWinSym(result);
      for (let c = 0; c < 3; c++) grid[1][c] = w;
      for (const r of [0, 2]) {
        for (let c = 0; c < 3; c++) {
          let s: string; let t = 0;
          do { s = ACTIVE_SYMS[Math.floor(Math.random() * ACTIVE_SYMS.length)]; t++; }
          while (s === w && t < 10);
          grid[r][c] = s;
        }
      }
    } else {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          let s: string; let t = 0;
          do {
            s = ALL_SYM_KEYS[Math.floor(Math.random() * ALL_SYM_KEYS.length)];
            t++;
          } while (c > 0 && s === grid[r][c - 1] && t < 10);
          grid[r][c] = s;
        }
        if (grid[r][0] === grid[r][1] && grid[r][1] === grid[r][2]) {
          grid[r][2] = ALL_SYM_KEYS[(ALL_SYM_KEYS.indexOf(grid[r][2]) + 1) % ALL_SYM_KEYS.length];
        }
      }
    }
    return grid;
  }

  private chooseWinSym(result: SpinResult): string {
    if (result.prizeType === "points") return result.coinsWon >= 1000 ? "sym_pts1000" : "sym_pts750";
    const v = result.coinsWon;
    if (v >= 1000) return "sym_diamond";
    if (v >= 500)  return "sym_star";
    if (v >= 80)   return "sym_orange";
    if (v >= 50)   return "sym_cherry";
    if (v >= 25)   return "sym_banana";
    if (v >= 5)    return "sym_grape";
    if (v >= 3)    return "sym_apple";
    if (v >= 2)    return "sym_tomato";
    return "sym_coin";
  }

  // ──────────────────────── Result display ────────────────────────

  private showResult(result: SpinResult) {
    if (result.isWin) {
      this.play("coins");
      this.flashWinCells();
      this.spawnParticles();
      this.floatText("🏆 WIN! 🏆", "#FFD700", 40);
      this.showWinAmount(result.coinsWon);
    } else {
      this.play("lose");
      this.shakeAll();
      this.floatText("No Match", "#F87171", 30);
      this.winAmountText.setVisible(false);
    }

    this.time.delayedCall(result.isWin ? 1800 : 800, () => {
      this.spinning = false;
      if (this.spinBtn instanceof Phaser.GameObjects.Image) {
        this.spinBtn.setAlpha(1);
        this.spinBtn.setTexture("button_spin");
      }
      this.game.events.emit("spinComplete", result, this.pendingFull);
      this.pendingFull = null;
    });
  }

  private showWinAmount(amount: number) {
    this.winAmountText.setText(`${amount}£`);
    this.winAmountText.setVisible(true);
    this.winAmountText.setAlpha(0);
    this.winAmountText.setScale(0.5);

    this.tweens.add({
      targets: this.winAmountText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: "Back.easeOut",
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: this.winAmountText,
        alpha: 0,
        duration: 300,
        onComplete: () => this.winAmountText.setVisible(false),
      });
    });
  }

  private flashWinCells() {
    const C = this.symbolSize;
    for (let col = 0; col < 3; col++) {
      const x = this.colXs[col];
      const y = this.rowYs[1];
      const f = this.add.graphics().setDepth(12);
      f.fillStyle(0xffd700, 0.45);
      f.fillRoundedRect(x - C / 2, y - C / 2, C, C, 8);
      f.lineStyle(3, 0xffd700, 1);
      f.strokeRoundedRect(x - C / 2, y - C / 2, C, C, 8);
      this.tweens.add({
        targets: f,
        alpha: { from: 1, to: 0 },
        duration: 500,
        delay: col * 80,
        yoyo: true,
        repeat: 2,
        onComplete: () => f.destroy(),
      });
    }
  }

  private spawnParticles() {
    for (let i = 0; i < 22; i++) {
      this.time.delayedCall(i * 50, () => {
        const px = this.CX + (Math.random() - 0.5) * this.machineDisplayW * 0.6;
        const py = this.CY + (Math.random() - 0.5) * this.machineDisplayH * 0.4;
        const p = this.add.circle(px, py, 4 + Math.random() * 6, 0xffd700, 1).setDepth(14);
        this.tweens.add({
          targets: p,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          x: px + (Math.random() - 0.5) * 120,
          y: py - 80 - Math.random() * 80,
          duration: 750 + Math.random() * 350,
          ease: "Power2",
          onComplete: () => p.destroy(),
        });
      });
    }
  }

  private shakeAll() {
    this.cells.flat().forEach((img) => {
      this.tweens.add({
        targets: img,
        x: img.x + 5,
        duration: 55,
        yoyo: true,
        repeat: 3,
        ease: "Linear",
      });
    });
  }

  private floatText(msg: string, color: string, size: number) {
    const t = this.add.text(this.CX, this.rowYs[0] - this.symbolSize - 20, msg, {
      fontSize: `${size}px`,
      fontFamily: "Impact, 'Arial Black', sans-serif",
      color,
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(15).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: t,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 280,
      ease: "Back.easeOut",
    });

    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: t,
        alpha: 0,
        duration: 280,
        onComplete: () => t.destroy(),
      });
    });
  }
}