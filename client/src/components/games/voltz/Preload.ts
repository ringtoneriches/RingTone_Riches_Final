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
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x2222aa, 0.5);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        color: "#ffffff",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create() {
    this.scene.start("Game");
  }
}