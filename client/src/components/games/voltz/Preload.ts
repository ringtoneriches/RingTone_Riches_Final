import { Scene } from "phaser";

export class Preload extends Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    this.load.setPath("/voltz-assets");

    this.load.image("a", "a.png");
    this.load.image("b", "b.png");
    this.load.image("bg1", "bg1.png");
    this.load.image("bg2", "bg2.png");
    this.load.image("bg3", "bg3.png");
    this.load.image("bg4", "bg4.png");
    this.load.image("bg11", "bg11.png");
    this.load.image("bg21", "bg21.png");
    this.load.image("blink", "blink.png");
    this.load.image("bg31", "bg31.png");
    this.load.image("electro1", "electro1.png");
    this.load.image("electro2", "electro2.png");
    this.load.image("redElectro1", "redElectro1.png");
    this.load.image("redElectro2", "redElectro2.png");
    this.load.image("blueElectro1", "blueElectro1.png");
    this.load.image("blueElectro2", "blueElectro2.png");
    this.load.image("greenElectro1", "greenElectro1.png");
    this.load.image("greenElectro2", "greenElectro2.png");
    this.load.image("blueBtn", "blueBtn.png");
    this.load.image("greenBtn", "greenBtn.png");
    this.load.image("redBtn", "redBtn.png");
    this.load.image("backupPower", "backupPower.png");
    this.load.image("win500", "win500.png");
    this.load.image("noWin", "noWin.png");

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.cameras.main.setBackgroundColor("#050505");

    const cx = width / 2;
    const cy = height / 2;

    const wash = this.add.graphics();
    wash.fillStyle(0xC8102E, 0.08);
    wash.fillCircle(cx, cy - 40, 220);
    wash.fillStyle(0xF1D47A, 0.05);
    wash.fillCircle(cx, cy - 40, 140);

    const ring = this.add.graphics();
    ring.lineStyle(2, 0xF1D47A, 0.35);
    ring.strokeCircle(cx, cy - 86, 54);
    ring.lineStyle(1, 0xC8102E, 0.45);
    ring.strokeCircle(cx, cy - 86, 66);

    const kicker = this.add
      .text(cx, cy - 168, "RINGTONE", {
        fontFamily: "Oswald, Arial Black, sans-serif",
        fontSize: "18px",
        color: "#fff8ee",
        fontStyle: "bold",
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0.72);

    const title = this.add
      .text(cx, cy - 86, "VOLTZ", {
        fontFamily: "Oswald, Arial Black, sans-serif",
        fontSize: "52px",
        color: "#F1D47A",
        fontStyle: "bold",
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const status = this.add
      .text(cx, cy - 18, "CHARGING", {
        fontFamily: "Oswald, Arial Black, sans-serif",
        fontSize: "20px",
        color: "#F1D47A",
        fontStyle: "bold",
        letterSpacing: 5,
      })
      .setOrigin(0.5);

    const trackW = 320;
    const trackH = 4;
    const trackX = cx - trackW / 2;
    const trackY = cy + 28;

    const track = this.add.graphics();
    track.fillStyle(0xffffff, 0.08);
    track.fillRoundedRect(trackX, trackY, trackW, trackH, 2);

    const fill = this.add.graphics();

    this.tweens.add({
      targets: status,
      alpha: { from: 0.45, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.load.on("progress", (value: number) => {
      fill.clear();
      fill.fillStyle(0xF1D47A, 1);
      fill.fillRoundedRect(trackX, trackY, Math.max(4, trackW * value), trackH, 2);
      if (value > 0.08) {
        fill.fillStyle(0xC8102E, 1);
        fill.fillRoundedRect(trackX + trackW * value - 6, trackY, 6, trackH, 2);
      }
    });

    this.load.on("complete", () => {
      wash.destroy();
      ring.destroy();
      kicker.destroy();
      title.destroy();
      status.destroy();
      track.destroy();
      fill.destroy();
    });
  }

  create() {
    this.scene.start("Game");
  }
}
