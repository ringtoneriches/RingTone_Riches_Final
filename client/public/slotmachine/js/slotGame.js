//"use strict";
let slotGame;
let slotConfig;
window.gameWidth = window.innerWidth;
window.gameHeight = window.innerHeight;

// window loads event
window.onload = function () {

    if (window.gameWidth > window.gameHeight) {
        window.gameWidth = 1920;
        window.gameHeight = 1080;
    }

    // phaser game configuration object
    var gameConfig = {
        type: Phaser.WEBGL,             // render type
        // width: 1920,                    // game width, in pixels
        // height: 1080,              // render type
        width: window.gameWidth,                    // game width, in pixels
        height: window.gameHeight,                   // game height, in pixels
        transparent: true,              // without background 
        scene: [SlotGame],              // scenes used by the game  
        audio:
        {
            // disableWebAudio: true
        },
        scale: {
            mode: Phaser.Scale.FIT // SHOW_ALL, RESIZE, FIT, autoCenter: Phaser.Scale.CENTER_BOTH   
        }
    };

    slotGame = new Phaser.Game(gameConfig);                 // game constructor
    window.focus();                                         // pure javascript to give focus to the page/frame 
    // scale  resize();  window.addEventListener("resize", resize, false); - not used
}

// SlotGame scene
class SlotGame extends Phaser.Scene {

    // constructor
    constructor() {
        super("SlotGame"); // scene key 
    }

    loadSceneConfig() {
        slotConfig = slotConfigRed3x3_20L;
    }

    // method to be executed when the scene preloads
    preload() {
        // create preloader
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBar.depth = 20;
        progressBox.depth = 19;
        progressBox.fillStyle(0x222222, 1);
        progressBox.fillRect((slotGame.config.width / 2) - 10 - 160, (slotGame.config.height / 2) - 10, 320, 50);

        this.load.on('progress', function (value) {
            ////console.log(value);
            progressBar.clear();
            progressBar.fillStyle(0xA16AF7, 1);
            progressBar.fillRect((slotGame.config.width / 2) - 160, (slotGame.config.height / 2), 300 * value, 30);
        });

        this.load.on('fileprogress', function (file) {
            ////console.log('fileprogress: '+ file.src);
        });

        this.load.on('complete', function () {
            ////console.log('complete');
            progressBar.destroy();
            progressBox.destroy();
        });

        this.updateEvent = new MKEvent();
        this.loadSceneConfig();

        // 1) loading png images, sprite sheets
        slotConfig.sprites.forEach((s) => {
            if (s.fileName != null) {
                // if(this.textures.exists(s.name))  this.textures.remove(s.name);                                  // uncomment for game with multiple slot scenes
                this.load.image(s.name, "png/" + s.fileName);
            }
        });   // load png textures from png folder
        slotConfig.symbols.forEach((s) => {
            if (s.fileName != null) {
                // if(this.textures.exists(s.name)) this.textures.remove(s.name);                                // uncomment for game with multiple slot scenes   
                this.load.image(s.name, "png/Symbols/" + s.fileName);
            }
        });
        // slotConfig.symbols.forEach((s) => {
        //     if (s.fileNameBlurred != null) {
        //         // if(this.textures.exists(s.name + 'Blurred')) this.textures.remove(s.name + 'Blurred');        // uncomment for game with multiple slot scenes
        //         this.load.image(s.name + 'Blurred', "png/SymbolsBlurred/" + s.fileNameBlurred);
        //     }
        // });
        slotConfig.symbols.forEach((s) => {
            if (s.animation != null) {
                // if(this.textures.exists(s.name + 'Sheet')) this.textures.remove(s.name + 'Sheet');            // uncomment for game with multiple slot scenes
                // this.load.spritesheet(s.name + 'Sheet', "png/SymbolsSheet/" + s.animation, { frameWidth: slotConfig.frameWidth, frameHeight: slotConfig.frameHeight });
            }
        });

        // 2) loading sounds
        this.load.audio('box_click_clip', ['audio/box_click.ogg', 'audio/box_click.mp3']);  // this.load.audio('wheel_spin_clip', 'audio/spin_sound.mp3'); this.load.audio('coins_clip', 'audio/win_coins.wav');
        this.load.audio('wincoins_clip', ['audio/mixkit_win.wav']); // this.load.audio('win_clip', ['audio/win_sound.ogg','audio/win_sound.mp3']);
        this.load.audio('button_click', ['audio/button.wav']);
        this.load.audio('spin_clip', ['audio/spin_sound.wav']);
        this.load.audio('win_clip', ['audio/win_coins.wav']);
        this.load.audio('lose_clip', ['audio/lose.wav']);

        // 3) loading bitmap fonts
        slotConfig.fonts.forEach((f) => { this.load.bitmapFont(f.fontName, f.filePNG, f.fileXML); });



        // 4) load new symbols
        if (slotConfig.loadNewSymbols) {
            slotConfig.loadNewSymbols(this);
        }




    }

    // method to be executed once the scene has been created
    create() {
        // 0) events
        this.endWinCalcEvent = new MKEvent();
        this.winCoinsEvent = new MKEvent();
        this.endFreeGamesEvent = new MKEvent();
        this.freeSpinWinEvent = new MKEvent();
        this.startFreeGamesEvent = new MKEvent();

        // 1) main properties
        this.centerX = (slotGame.config.width / 2) + slotConfig.localOffsetX;
        this.centerY = (slotGame.config.height / 2) + slotConfig.localOffsetY;
        this.useWild = (slotConfig.useWild && slotConfig.hasOwnProperty('wild') && slotConfig.wild !== null);
        this.isCascadeSpin = false;         // cascade spin flag (used only in cascade slot)
        this.sumCascadeCoins = 0;           // used only in cascade slot
        this.isFreeSpin = false;            // free spin flag
        this.reelSpin = false;              // reel spin flag
        this.playFreeSpins = false;
        this.startFreeGames = false;
        this.endFreeGames = false;
        this.cTime = 0;
        this.useWildInFirstPosition = slotConfig.useWildInFirstPosition;
        this.useLineBetMultiplier = slotConfig.useLineBetMultiplier;
        this.useLineBetFreeSpinMultiplier = slotConfig.useLineBetFreeSpinMultiplier;
        this.symbolsDict = {};
        slotConfig.symbols.forEach((s) => { if (s.fileName != null) this.symbolsDict[s.name] = s; });
        this.spinCount = 0;

        // 2) pay tables
        this.payTable = [];
        slotConfig.payLines.forEach((pLine) => { this.payTable.push(new PayLine(this, pLine.line, pLine.pay, pLine.freeSpins, slotConfig.wild, pLine.euro)); });
        this.payTableFull = createFullPaytable(this.payTable, this.useWild);
        //console.log('paytable full length: ' + this.payTableFull.length);  // this.payTableFull.forEach((pLine)=>{//console.log(pLine);});
        this.scatterPayTable = [];

        // 3) create slot graphic
        slotConfig.createSlotGraphic(this);

        // 4) main objects
        this.slotPlayer = new SlotPlayer(slotConfig.defaultCoins, slotConfig.defaultPoints); // default coins
        this.reels = slotConfig.createReels(this);
        // this.lineButtons = (slotConfig.createLineButtons) ? slotConfig.createLineButtons(this) : null;  // add line buttons - optional
        this.soundController = new SoundController(this);
        this.guiController = new GuiController(this);
        this.slotControls = new SlotControls(this, this.slotPlayer, slotConfig.lines, slotConfig.lineColor, slotConfig.lineBetMaxValue);
        this.winController = new WinController(this, this.slotControls.linesController, slotConfig.useScatter, slotConfig.scatter, slotConfig.winShowTime);

        // 5) add sounds 
        this.box_click_clip = this.sound.add('box_click_clip');
        this.win_clip = this.sound.add('win_clip');
        this.button_click = this.sound.add('button_click');
        this.spin_clip = this.sound.add('spin_clip');
        this.wincoins_clip = this.sound.add('wincoins_clip');
        this.lose_clip = this.sound.add('lose_clip');

        // 6) controls
        slotConfig.createControls(this, this.slotControls);
        this.slotControls.init(slotConfig.selectedLines, true);

        // 7) state machine
        this.stateMachine = new StateMachine();
        this.iddleState = new IddleState(this, this.stateMachine);
        this.winState = new WinState(this, this.stateMachine);
        this.loseState = new LoseState(this, this.stateMachine);
        this.spinState = new SpinState(this, this.stateMachine);
        this.preSpinState = new PreSpinState(this, this.stateMachine);
        this.freeInputWinState = new FreeInputWinState(this, this.stateMachine);
        this.stateMachine.initialize(this.iddleState);
        this.endWinCalcEvent.add((win) => {
            if (win) {
                this.stateMachine.changeState(this.winState);
                this.lampsBlink(true);
            }
            else this.stateMachine.changeState(this.loseState);
        }, this);

        // 8) coroutines
        this.loseCorout = null;
        this.winCorout = null;
        this.freeInputWinCorout = null;

        // 9) debug 
        // this.fpsText = this.add.bitmapText(this.centerX, this.centerY, 'gameFont', 'fps: ', 40, 1).setOrigin(0.5);
    }

    update(time, delta) // https://newdocs.phaser.io/docs/3.52.0/focus/Phaser.Scene-update
    {
        this.cTime = time;
        simpleTweener.update(delta);
        this.updateEvent.events.forEach((eW) => { if (eW != null && eW.action != null) eW.action.call(eW.context, time, delta); });

        // this.fpsText.text = 'fps: ' + Math.round(slotGame.loop.actualFps);
    }

    runSlot() {
        // 0) prepare, set flags
        let anyWin = false;
        let lineCoins = 0;          // lines win coins
        let scatterCoins = 0;       // scatter win coins
        let jpCoins = 0;            // jack pot win coins
        let winSpins = 0;
        this.isCascadeSpin = false;
        this.reelSpin = true;
        if (this.slotControls.auto && !this.isFreeSpin) this.slotControls.incAutoSpinsCounter();
        this.slotPlayer.setWinCoinsCount(0);
        this.slotControls.linesController.hideAllLines();
        if (this.loseCorout !== null) this.loseCorout.stop();
        if (this.winCorout !== null) this.winCorout.stop();
        if (this.freeInputWinCorout !== null) this.freeInputWinCorout.stop();
        this.lampsBlink(false);

        // 1) start spin sound
        this.soundController.stopAll();
        this.soundController.playClip('spin_clip', true);

        // 2) create spin sequence
        this.spinCount++;
        var sA = new SequencedActions();
        sA.add((callBack) => { spinReels(this.reels, slotConfig, callBack); }, this);
        sA.add((callBack) => {
            //console.log('spin complete');
            this.soundController.stopAll();
            callBack();
        }, this);

        sA.add((callBack) => {
            this.winController.searchWinSymbols();
            callBack();
        }, this);  // search spin result

        sA.add((callBack) => {
            anyWin = this.winController.hasAnyWinn();
            if (anyWin) {
                lineCoins = this.winController.getLineWinCoins();
                scatterCoins = this.winController.getScatterWinCoins();
                if (this.useLineBetMultiplier) {
                    lineCoins *= this.slotControls.lineBet;
                    scatterCoins *= this.slotControls.lineBet;
                }
                var summCoins = jpCoins + lineCoins + scatterCoins;
                if (summCoins > 0) this.winCoinsEvent.events.forEach((eW) => { if (eW != null && eW.action != null) eW.action.call(eW.context, summCoins); });

                winSpins = this.winController.getWinSpins();
                if (this.useLineBetFreeSpinMultiplier) winSpins *= this.slotControls.lineBet;
                if (winSpins > 0) this.freeSpinWinEvent.events.forEach((eW) => { if (eW != null && eW.action != null) eW.action.call(eW.context, winSpins); });
            }
            else {
                this.isCascadeSpin = false;
            }
            this.endWinCalcEvent.events.forEach((eW) => { if (eW != null && eW.action != null) eW.action.call(eW.context, anyWin); });   // start win show or loose show
            callBack();
        }, this);

        sA.add((callBack) => { callBack(); }, this);

        sA.start();
    }

    // add sprite relative to scene center
    addSpriteLocPos(name, posX, posY) {
        return this.add.sprite(this.centerX + posX, this.centerY + posY, name);
    }

    // wait miliseconds coroutine
    *wait_ms(ms) {
        var timeTarget = this.cTime + ms;
        while (timeTarget > this.cTime) {
            //  //console.log('wait_ms: ' + (-this.cTime + timeTarget));
            yield (timeTarget - this.cTime);
        }
    }

    // start win show coroutine
    winShow(completeCallBack) {
        this.miniGame = null;
        this.winCorout = new Coroutiner(this, this.winShowC(completeCallBack));
        this.winCorout.start();
    }

    // win show coroutine
    *winShowC(completeCallBack) {
        //console.log("win show start: " + this.spinCount);
        //3a ------ any win show event -------
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            //console.log("wait: this.miniGame and popups:  " + this.miniGame + " : " + this.guiController.hasNoPopUp());
            yield null;
        }

        // 3b0 ---- show particles, line flasing  -----------
        let winShowEnd = false;
        this.winController.winSymbolShowOnce(() => { winShowEnd = true; });

        yield* this.wait_ms(1000);

        //3b1 --------- check Jack pot -------------
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        //3c0 -----------------calc coins -------------------
        let winCoins = this.winController.getLineWinCoins() + this.winController.getScatterWinCoins();
        let winEuro = this.winController.getLineWinEuro();
        if (this.useLineBetMultiplier) winCoins *= this.slotControls.lineBet;

        console.log('win coins: ' + winCoins + ', win euro: ' + winEuro + ', line bet: ' + this.slotControls.lineBet);

        this.slotPlayer.setWinCoinsCount(winCoins);
        this.slotPlayer.addCoins(winCoins);
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'slotSpinResult', isWin: true, coinsWon: winCoins, balance: this.slotPlayer.coins }, '*');
        }
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        //3c1 ----------- calc free spins ----------------
        let winSpins = this.winController.getWinSpins();
        let winLinesCount = this.winController.winLines.length;
        if (this.useLineBetFreeSpinMultiplier) winSpins *= this.slotControls.lineBet;

        // win coins, big win, win spins sounds and messages
        let bigWin = (winCoins > 0 && winCoins >= this.slotPlayer.minWin && this.slotPlayer.useBigWinCongratulation);


        if (bigWin) {
            //console.log('big win congratulation : ' + winCoins);
            // If any winning line is euro=true -> show £, else show points.
            // If both euro and non-euro wins exist on the same spin -> show both.
            const euroFlags = this.winController.winLines.map((lB) => (lB && lB.win ? lB.win.euro : undefined));
            // In this version, winController sums all wins into a single number.
            // We use a simple rule from config: if any payLine uses euro=true, display in £.
            // (If you add mixed euro/points logic per-line later, this can be refined.)
            // Suppressed: React overlay handles win display
            // this.showBigWinMessage(winCoins, slotConfig.payLines.some((p) => p.euro) ? true : false);

            this.soundController.playClip('wincoins_clip', false);
        }
        else if (winCoins > 0) {
            //console.log('win coins congratulation : ' + winCoins);
            // Suppressed: React overlay handles win display
            // this.showWinCoinsMessage(winCoins, winEuro, slotConfig.winMessageTime);
            this.soundController.playClip('wincoins_clip', false);
        }


        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        if (winSpins > 0) {
            if (winCoins > 0) yield* this.wait_ms(1000);   // delay between messages
            //console.log('win free spins congratulation : ' + winSpins);
            this.showWinFreeSpinsMessage(``);
            setTimeout(() => {
                this.soundController.playClip('win_clip', false);
            }, winCoins > 0 ? 1500 : 100);

        }

        // When player wins free spins, add coins to main balance so free wins can proceed
        // Requirement: win 1 free spin => +20 coins
        const freeSpinCoinBonus = 20;
        if (winSpins > 0) {
            this.slotPlayer.addCoins(winSpins * freeSpinCoinBonus);
        }

        this.slotControls.addFreeSpins(winSpins);
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        this.playFreeSpins = (this.slotControls.autoPlayFreeSpins && this.slotControls.hasFreeSpin());
        this.startFreeGames = !this.isFreeSpin && this.playFreeSpins;
        this.endFreeGames = this.isFreeSpin && !this.playFreeSpins;
        if (this.endFreeGames) this.endFreeGamesEvent.invoke();
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        //3d0 ----- invoke scatter win event -----------
        if (this.winController.scatterWin != null && winController.scatterWin.winEvent != null) {
            yield* this.wait_ms(1000);
            this.winController.scatterWin.winEvent.invoke();
            while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
                yield null;
            }
        }

        // 3d1 -------- add levelprogress --------------
        this.slotPlayer.addLevelProgress((this.useLineBetProgressMultiplier) ? this.winSpinLevelProgress * winLinesCount * this.slotControls.lineBet : this.winSpinLevelProgress * winLinesCount); // for each win line
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        // 3d2 ------------ start line events ----------
        //  this.winController.startLineEvents();
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        // start free games events
        if (this.startFreeGames) {
            var fgPU = this.guiController.showMessage("START FREE GAME", winSpins, this, () => { this.guiController.closePopUp(fgPU); });
            this.startFreeGamesEvent.invoke();
            while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
                yield null;
            }
        }

        //3e ---- ENABLE player interaction -----------
        this.reelsSpin = false;
        //  this.soundController.playMusic('');

        /*
        if (this.slotControls.auto && this.slotControls.autoSpinsCounter >= slotConfig.maxAutoSpins)
        {
            this.slotControls.resetAutoSpinsMode();
        }
        */
        while (!winShowEnd) {
            yield null;
        }

        //if (logStatistic) SlotStatistic.PrintStatistic();
        completeCallBack();
        //console.log('win show end: ' + this.spinCount);
    }

    // start win show coroutine while waiting for player action
    freeInputWinShow(completeCallBack) {
        this.freeInputWinCorout = new Coroutiner(this, this.freeInputWinShowC(completeCallBack));
        this.freeInputWinCorout.start();
    }

    // win show coroutine while waiting for player action
    *freeInputWinShowC(completeCallBack) {
        yield* this.wait_ms(1000);
        let winShowEnd = false;
        this.winController.winSymbolShowOnce(() => { winShowEnd = true; });

        while (!winShowEnd) {
            //  //console.log('wait win symbols show');
            yield null;
        }
        completeCallBack(this.slotControls.auto || this.playFreeSpins);
    }

    // start lose show coroutine
    loseShow(completeCallBack) {
        this.loseCorout = new Coroutiner(this, this.loseShowC(completeCallBack));
        this.loseCorout.start();
    }

    // lose show coroutine
    *loseShowC(completeCallBack) {
        this.soundController.playClip('lose_clip', false);
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'slotSpinResult', isWin: false, coinsWon: 0, balance: this.slotPlayer ? this.slotPlayer.coins : 0 }, '*');
        }
        //console.log('lose show, spinCount: ' + this.spinCount);
        //console.log('play lose sound');  // play sound loseSound
        this.slotPlayer.addLevelProgress(this.loseSpinLevelProgress);
        this.playFreeSpins = (this.slotControls.autoPlayFreeSpins && this.slotControls.hasFreeSpin());
        this.reelSpin = false;
        //console.log('enable background music');  // restore background music
        //console.log('wait for popups');
        /*
        if (this.slotControls.auto && this.slotControls.autoSpinsCounter >= this.slotControls.autoSpinCount)
        {
            this.slotControls.resetAutoSpinsMode();
        }
        */
        yield* this.wait_ms(1000);  // wait 1 sec before call completeCallBack
        completeCallBack(this.slotControls.auto || this.playFreeSpins);
    }

    handleAnimation() {
        if (this.hAnim) return;
        this.hAnim = true;

        var sA_0 = new SequencedActions();
        var sA_1 = new SequencedActions();

        let hHPosY_0 = this.handle.y;
        let hHPosX = this.handle.x;
        let hHPosX_1 = this.handle.x + 10;

        let hBPosY_0 = this.handleBall.y;
        let hBPosY_1 = this.handleBall.y + 200;
        let hBPosX = this.handleBall.x;
        let hBPosX_1 = this.handleBall.x + 10;
        let aTime = 200;

        sA_0.add((callBack) => {
            new SimpleTweenFloat(this, .5, 0, aTime,
                (v, dv) => {
                    this.handle.setScale(.5, v);
                    this.handle.setPosition(hHPosX_1 - 20 * v, hHPosY_0);
                },
                () => { callBack(); });

        }, this);
        sA_0.add((callBack) => {
            new SimpleTweenFloat(this, hHPosX_1, hHPosX, aTime,
                (v, dv) => { this.handle.setPosition(v, hHPosY_0); },
                () => { });
            new SimpleTweenFloat(this, 0, .5, aTime,
                (v, dv) => {
                    this.handle.setScale(.5, v);
                    this.handle.setPosition(hHPosX_1 - 20 * v, hHPosY_0);
                },
                () => { this.handle.setScale(.5, .5); callBack(); });

        }, this);
        sA_0.start();

        sA_1.add((callBack) => {
            new SimpleTweenFloat(this, hBPosY_0, hBPosY_1, aTime,
                (v, dv) => { this.handleBall.setPosition(hBPosX_1, v); },
                () => { callBack(); });
        }, this);
        sA_1.add((callBack) => {
            new SimpleTweenFloat(this, hBPosY_1, hBPosY_0, aTime,
                (v, dv) => { this.handleBall.setPosition(hBPosX, v); },
                () => { this.hAnim = false; this.handleBall.setPosition(hBPosX, hBPosY_0); callBack(); });
        }, this);
        sA_1.start();
    }

    showBigWinMessage(winAmount, showEuro) {
        const text = this.formatWinAmountText(winAmount, showEuro);
        const fullMsg = 'Big win: ' + text;
        console.log('[WIN]', fullMsg);
        var wMess = this.guiController.showMessage('Congratulation!', fullMsg, this, () => { this.guiController.closePopUp(wMess); });
    }

    showWinCoinsMessage(winAmount, showEuro, time) {
        const text = this.formatWinAmountText(winAmount, showEuro);
        const fullMsg = 'You win: ' + text;
        console.log('[WIN]', winAmount, 'showEuro:', showEuro, 'formatted:', text);

        var wMess = this.guiController.showMessage('Congratulation!', fullMsg, this,
            () => {
                if (this.timeoutMess) clearTimeout(this.timeoutMess);
                this.timeoutMess = null;
                this.guiController.closePopUp(wMess);
            });
        if (time && time > 0) this.timeoutMess = setTimeout(() => { this.guiController.closePopUp(wMess); }, time);
    }


    showWinFreeSpinsMessage(winAmount) {
        // Keep free spin message as-is (coins/points not shown here in current UI)
        var wMess = this.guiController.showMessage('Congratulation!', 'You win 1 free spin ', this, () => { this.guiController.closePopUp(wMess); });
    }

    // Formats win amount based on pay line currency type.
    // If euro=true -> show £<amount>
    // If euro=false -> show <amount> points
    // If both -> show £<amount> and <amount> points
    // Note: current win calculation uses win coins as a single number; we derive the currency from config flags.
    formatWinAmountText(amount, euro) {
        // euro can be true/false/'both'
        // Requirement: points => "4 points" (no £), euro => "4£" (no space)
        if (euro === 'both') {
            return `${amount}£ and ${amount} points`;
        }
        if (euro) {
            return `${amount}£`;
        }
        return `${amount} points`;
    }




    lampsBlink(blink) {
        if (blink && !this.lampsIntervalID) {
            this._lampsOn = false;
            this.lampsIntervalID = setInterval(() => {
                this.lampsArray.forEach((l) => { l.setOn(this._lampsOn); });
                this._lampsOn = !this._lampsOn;
            }, 1000);
        }
        else if (!blink && this.lampsIntervalID) {
            clearInterval(this.lampsIntervalID);
            this.lampsArray.forEach((l) => { l.setOn(true); });
            this.lampsIntervalID = null;
        }
    }
}

// ---helper functions--- 

// return symbol data from the config_.js file
function getSymboldData(_slotConfig, spriteName) {
    for (var si = 0; si < _slotConfig.symbols.length; si++) {
        if (_slotConfig.symbols[si].name === spriteName) return _slotConfig.symbols[si];
    }
    return null;
}

function spinReels(reels, _slotConfig, completeCallback) {

    var pA = new ParallelActions();
    var ri = 0;
    reels.forEach((r) => {
        pA.add((callBack) => {
            var rand = (_slotConfig.reels_simulate && _slotConfig.reels_simulate[ri] >= 0) ? _slotConfig.reels_simulate[ri] : r.getRandomOrderPosition();
            r.spin(rand, () => { callBack(); });
            ri++;
        });
    });
    pA.start(completeCallback);
}

function createFullPaytable(payTable, useWild) {
    var payTableFull = [];
    for (var j = 0; j < payTable.length; j++) {
        payTableFull.push(payTable[j]);
        var wildLines = payTable[j].getWildLines();
        if (useWild) wildLines.forEach((wl) => { payTableFull.push(wl); });
    }
    return payTableFull;
}

function getTime() {
    //make a new date object
    let d = new Date();

    //return the number of milliseconds since 1 January 1970 00:00:00.
    return d.getTime();
}