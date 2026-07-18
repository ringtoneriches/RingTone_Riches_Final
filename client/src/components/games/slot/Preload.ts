import { Scene } from "phaser";

export const SYMBOL_KEYS = [
  { key: "sym_coin",      file: "Coin £1.png" },
  { key: "sym_tomato",    file: "Tomato £2.png" },
  { key: "sym_apple",     file: "Apple £3.png" },
  { key: "sym_bell",      file: "Bell £4.png" },
  { key: "sym_grape",     file: "Grape £5.png" },
  { key: "sym_banana",    file: "Banana £25.png" },
  { key: "sym_cherry",    file: "Cherry £50.png" },
  { key: "sym_orange",    file: "Orange £80.png" },
  { key: "sym_star",      file: "Star £100.png" },
  { key: "sym_diamond",   file: "Diamond £1000.png" },
  { key: "sym_pts750",    file: "750 Points.png" },
  { key: "sym_pts1000",   file: "1000 Points.png" },
];

export const ALL_SYM_KEYS = SYMBOL_KEYS.map((s) => s.key);

export class Preload extends Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x1a0a30, 1);
    progressBox.fillRoundedRect(w / 2 - 170, h / 2 - 20, 340, 40, 8);

    const loadText = this.make.text({
      x: w / 2,
      y: h / 2 - 50,
      text: "Loading Slot Machine...",
      style: { font: "18px monospace", color: "#A16AF7" },
    });
    loadText.setOrigin(0.5, 0.5);

    this.load.on("progress", (v: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xa16af7, 1);
      progressBar.fillRoundedRect(w / 2 - 160, h / 2 - 10, 320 * v, 20, 6);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadText.destroy();
    });

    this.load.setPath("/slotmachine");

    // ── Core machine visuals ──
    // NOTE: keys below MUST match what SlotGame.tsx calls this.add.image(x, y, "KEY") with.
    this.load.image("slot", "png/SlotMachine.png");
    this.load.image("reel", "png/Reel3x3.png");
    this.load.image("handle", "png/SlotMachineHandle.png");
    this.load.image("handle_ball", "png/red/HandleBall.png");
    this.load.image("button_spin", "png/red/ButtonSpinUp2.png");
    this.load.image("button_spin_hover", "png/red/ButtonSpinUp3.png");
    this.load.image("logo", "png/Symbols/logo.png");

    // Lamps — were missing entirely before, which is why lampOn/lampOff never showed.
    this.load.image("lamp_on", "png/red/LampOn.png");
    this.load.image("lamp_off", "png/red/LampOff.png");

    // ── Symbols ──
    SYMBOL_KEYS.forEach(({ key, file }) => {
      this.load.image(key, `png/Symbols/${file}`);
    });

    // ── Audio ──
    // NOTE: keys below MUST match this.sound.add("KEY") calls in SlotGame.tsx's initSounds().
    this.load.audio("spin_clip", ["audio/spin_sound.wav"]);
    this.load.audio("win_clip", ["audio/mixkit_win.wav"]);
    this.load.audio("lose_clip", ["audio/lose.wav"]);
    this.load.audio("button_click", ["audio/button.wav"]);
    this.load.audio("wincoins_clip", ["audio/win_coins.wav"]);
  }

  create() {
    this.scene.start("SlotGame");
  }
}