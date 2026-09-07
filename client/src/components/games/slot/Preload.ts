import { Scene } from "phaser";
import {
  ALL_SYM_KEYS,
  generateEmojiSymbolTextures,
  IMAGE_SYMBOLS,
} from "./symbols";

export { ALL_SYM_KEYS } from "./symbols";

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
      this.game.events.emit("slot-load-progress", v);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadText.destroy();
    });

    this.load.setPath("/slotmachine");

    this.load.image("slot", "png/SlotMachine.webp");
    this.load.image("logo", "png/BrandLogo.webp");
    this.load.image("background", "png/Background_2.webp");
    this.load.image("reel", "png/Reel3x3.webp");
    this.load.image("lamp_on", "png/red/LampOn.png");
    this.load.image("lamp_off", "png/red/LampOff.png");

    IMAGE_SYMBOLS.forEach(({ key, file }) => {
      this.load.image(key, `png/Symbols/${file.replace(/\.png$/i, ".webp")}`);
    });

    this.load.audio("spin_clip", ["audio/spin_sound.wav"]);
    this.load.audio("win_clip", ["audio/mixkit_win.wav"]);
    this.load.audio("lose_clip", ["audio/lose.wav"]);
    this.load.audio("button_click", ["audio/button.wav"]);
    this.load.audio("wincoins_clip", ["audio/win_coins.wav"]);
  }

  create() {
    generateEmojiSymbolTextures(this);

    const linear = Phaser.Textures.FilterMode.LINEAR;
    for (const key of ["slot", "background", "reel", "logo", ...ALL_SYM_KEYS]) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(linear);
      }
    }

    this.scene.start("SlotGame");
  }
}
