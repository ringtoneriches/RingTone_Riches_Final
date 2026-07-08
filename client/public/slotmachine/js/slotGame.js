//"use strict";
let slotGame;
let slotConfig;

// window loads event
window.onload = function() {
    // Get competition type from URL parameter or global variable
    const urlParams = new URLSearchParams(window.location.search);
    const competitionType = urlParams.get('type') || window.competitionType || 'slot';
    
    // Store competition type globally for the game to access
    window.competitionType = competitionType;
    
    console.log('🎯 Competition type:', competitionType);
    
    // phaser game configuration object
    var gameConfig = {    
        type: Phaser.WEBGL,
        width: 1920,
        height: 1080,
        parent: document.getElementById('game-container'),
        transparent: true,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        audio: {
            disableWebAudio: false
        },
        scene: [SlotGame]
    };
   
    slotGame = new Phaser.Game(gameConfig);
    window.focus();
}

// Backend integration class
class SlotGameBackend {
    constructor(scene) {
        this.scene = scene;
        this.backendCallbacks = scene.backendCallbacks || {};
        this.isProcessing = false;
        this.pendingResult = null;
    }

    async handleSpinResult(result) {
        if (this.isProcessing) {
            this.pendingResult = result;
            return;
        }

        this.isProcessing = true;

        try {
            if (this.backendCallbacks.onSpinComplete) {
                await this.backendCallbacks.onSpinComplete({
                    outcome: result.outcome || "noWin",
                    winAmount: result.winAmount || 0,
                    prizeName: result.prizeName || "",
                    isWin: result.isWin || false,
                    isPhysical: result.isPhysical || false,
                    symbols: result.symbols || [],
                    paylines: result.paylines || [],
                    switchTexts: result.switchTexts || ["?", "?", "?"],
                });
            }

            // Update plays remaining from backend
            if (this.backendCallbacks.playsRemaining !== undefined) {
                this.scene.playsRemaining = this.backendCallbacks.playsRemaining;
            }

            if (this.pendingResult) {
                const pending = this.pendingResult;
                this.pendingResult = null;
                await this.handleSpinResult(pending);
            }

        } catch (error) {
            console.error("Backend error:", error);
        } finally {
            this.isProcessing = false;
        }
    }

    hasPlaysRemaining() {
        console.log('🔍 Checking plays remaining:', this.scene.playsRemaining);
        return this.scene.playsRemaining > 0;
    }

    getPlaysRemaining() {
        return this.scene.playsRemaining;
    }
    
    decrementPlays() {
        if (this.scene.playsRemaining > 0) {
            this.scene.playsRemaining--;
            console.log('⬇️ Plays remaining decremented to:', this.scene.playsRemaining);
            
            // Update UI if plays counter exists
            const playsCountEl = document.getElementById('playsCount');
            if (playsCountEl) {
                playsCountEl.textContent = this.scene.playsRemaining;
            }
            
            return true;
        }
        return false;
    }
}

// SlotGame scene
class SlotGame extends Phaser.Scene {
    constructor(){
        super("SlotGame");
        this.backend = null;
        this.playsRemaining = 0;
        this.isBackendMode = false;
        this.reelSpin = false;
        this.isFreeSpin = false;
        this.isCascadeSpin = false;
        this.sumCascadeCoins = 0;
        this.playFreeSpins = false;
        this.startFreeGames = false;
        this.endFreeGames = false;
        this.cTime = 0;
        this.spinCount = 0;
        this.lampsIntervalID = null;
        this._lampsOn = false;
        this.loseCorout = null;
        this.winCorout = null;
        this.freeInputWinCorout = null;
        this.miniGame = null;
        this.timeoutMess = null;
        this.useWild = false;
        this.useWildInFirstPosition = false;
        this.useLineBetMultiplier = true;
        this.useLineBetFreeSpinMultiplier = true;
        this.symbolsDict = {};
        this.payTable = [];
        this.payTableFull = [];
        this.scatterPayTable = [];
        this.reels = [];
        this.lineButtons = null;
        this.slotPlayer = null;
        this.soundController = null;
        this.guiController = null;
        this.slotControls = null;
        this.winController = null;
        this.stateMachine = null;
        this.iddleState = null;
        this.winState = null;
        this.loseState = null;
        this.spinState = null;
        this.preSpinState = null;
        this.freeInputWinState = null;
        this.box_click_clip = null;
        this.win_clip = null;
        this.button_click = null;
        this.spin_clip = null;
        this.wincoins_clip = null;
        this.lose_clip = null;
        this.centerX = 0;
        this.centerY = 0;
        this.lampsArray = [];
        this.leftLamp = null;
        this.rightLamp = null;
        this.slot = null;
        this.handle = null;
        this.handleBall = null;
        this.updateEvent = new MKEvent();
        this.endWinCalcEvent = new MKEvent();
        this.winCoinsEvent = new MKEvent();
        this.endFreeGamesEvent = new MKEvent();
        this.freeSpinWinEvent = new MKEvent();
        this.startFreeGamesEvent = new MKEvent();
        this.backendCallbacks = {};
    }

    loadSceneConfig() {
        // Get competition type from global variable
        const competitionType = window.competitionType || 'slot';
        
        console.log('🎯 Competition type:', competitionType);
        
        if (competitionType === 'royal') {
            // Load Royal Reels config (3x3)
            if (typeof slotConfigRoyal !== 'undefined') {
                slotConfig = slotConfigRoyal;
                console.log('✅ Loaded config: slotConfigRoyal (Royal Reels 3x3)');
            } else {
                console.warn('⚠️ slotConfigRoyal not found, falling back to 3x3 config');
                // Fallback to any 3x3 config
                if (typeof slotConfigYellow3x3_20L !== 'undefined') {
                    slotConfig = slotConfigYellow3x3_20L;
                    console.log('✅ Loaded fallback config: slotConfigYellow3x3_20L');
                } else if (typeof slotConfigRed3x3_20L !== 'undefined') {
                    slotConfig = slotConfigRed3x3_20L;
                    console.log('✅ Loaded fallback config: slotConfigRed3x3_20L');
                } else if (typeof slotConfigViolet3x3_20L !== 'undefined') {
                    slotConfig = slotConfigViolet3x3_20L;
                    console.log('✅ Loaded fallback config: slotConfigViolet3x3_20L');
                } else {
                    console.warn('⚠️ No 3x3 config found, using default');
                    slotConfig = this.getDefaultConfig();
                }
            }
        } else {
            // Load standard Slot config (3x1)
            if (typeof slotConfigYellow3x1 !== 'undefined') {
                slotConfig = slotConfigYellow3x1;
                console.log('✅ Loaded config: slotConfigYellow3x1 (3x1)');
            } else if (typeof slotConfigRed3x1 !== 'undefined') {
                slotConfig = slotConfigRed3x1;
                console.log('✅ Loaded config: slotConfigRed3x1 (3x1)');
            } else if (typeof slotConfigViolet3x1 !== 'undefined') {
                slotConfig = slotConfigViolet3x1;
                console.log('✅ Loaded config: slotConfigViolet3x1 (3x1)');
            } else {
                console.warn('⚠️ No 3x1 config found, trying 3x3 configs as fallback');
                // Try 3x3 configs as fallback
                if (typeof slotConfigYellow3x3_20L !== 'undefined') {
                    slotConfig = slotConfigYellow3x3_20L;
                    console.log('⚠️ No 3x1 config found, using 3x3 fallback: slotConfigYellow3x3_20L');
                } else if (typeof slotConfigRed3x3_20L !== 'undefined') {
                    slotConfig = slotConfigRed3x3_20L;
                    console.log('⚠️ No 3x1 config found, using 3x3 fallback: slotConfigRed3x3_20L');
                } else if (typeof slotConfigViolet3x3_20L !== 'undefined') {
                    slotConfig = slotConfigViolet3x3_20L;
                    console.log('⚠️ No 3x1 config found, using 3x3 fallback: slotConfigViolet3x3_20L');
                } else {
                    console.warn('⚠️ No config found, using default');
                    slotConfig = this.getDefaultConfig();
                }
            }
        }
    }

    getDefaultConfig() {
        return {
            localOffsetX: 0,
            localOffsetY: 0,
            symbols: [
                { name: 'symbol1', fileName: 'symbol1.png', value: 10 },
                { name: 'symbol2', fileName: 'symbol2.png', value: 20 },
                { name: 'symbol3', fileName: 'symbol3.png', value: 30 },
                { name: 'symbol4', fileName: 'symbol4.png', value: 40 },
                { name: 'symbol5', fileName: 'symbol5.png', value: 50 },
            ],
            sprites: [],
            fonts: [],
            lines: 20,
            lineColor: 0xFFFFFF,
            lineBetMaxValue: 100,
            defaultCoins: 1000,
            selectedLines: 1,
            useWild: false,
            wild: null,
            useWildInFirstPosition: false,
            useLineBetMultiplier: true,
            useLineBetFreeSpinMultiplier: true,
            useScatter: false,
            scatter: null,
            winShowTime: 3000,
            winMessageTime: 2000,
            frameWidth: 100,
            frameHeight: 100,
            maxAutoSpins: 100,
            createSlotGraphic: function(scene) {
                // Default slot graphic
                const graphics = scene.add.graphics();
                graphics.fillStyle(0x1a1a1a, 0.8);
                graphics.fillRoundedRect(0, 0, 800, 600, 20);
                graphics.setPosition(scene.centerX - 400, scene.centerY - 300);
            },
            createReels: function(scene) {
                // Default reels
                const reels = [];
                for (let i = 0; i < 3; i++) {
                    reels.push(new Reel(scene, { offsetX: (i - 1) * 230, offsetY: 0, symbolImages: ['A', 'B', 'C', 'D', 'E'] }, i, 164, 1, false, 2000, 28));
                }
                return reels;
            },
            createControls: function(scene, controls) {
                // Default controls
                controls.enableControls(true);
            },
            createLineButtons: function(scene) {
                return null;
            },
            reels_simulate: null
        };
    }

    preload() {
        // Create preloader
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBar.depth = 20;
        progressBox.depth = 19;
        
        if (typeof slotGame !== 'undefined' && slotGame && slotGame.config) {
            progressBox.fillStyle(0x222222, 1);
            progressBox.fillRect((slotGame.config.width / 2) - 10 - 160, (slotGame.config.height / 2) - 10, 320, 50);

            this.load.on('progress', function (value) {
                progressBar.clear();
                progressBar.fillStyle(0xA16AF7, 1);
                progressBar.fillRect((slotGame.config.width / 2) - 160, (slotGame.config.height / 2), 300 * value, 30);
            });

            this.load.on('complete', function () {
                progressBar.destroy();
                progressBox.destroy();
            });
        }

        this.updateEvent = new MKEvent();
        this.loadSceneConfig();

        // Load sprites
        if (slotConfig.sprites) {
            slotConfig.sprites.forEach((s) => {
                if (s.fileName != null) {
                    this.load.image(s.name, "png/" + s.fileName);
                }
            });
        }

        // Load symbols
        if (slotConfig.symbols) {
            slotConfig.symbols.forEach((s) => {
                if (s.fileName != null) {
                    this.load.image(s.name, "png/Symbols/" + s.fileName);
                }
                if (s.fileNameBlurred != null) {
                    this.load.image(s.name + 'Blurred', "png/SymbolsBlurred/" + s.fileNameBlurred);
                }
                if (s.animation != null) {
                    this.load.spritesheet(s.name + 'Sheet', "png/SymbolsSheet/" + s.animation, {
                        frameWidth: slotConfig.frameWidth || 100,
                        frameHeight: slotConfig.frameHeight || 100
                    });
                }
            });
        }

        // Load sounds
        this.load.audio('box_click_clip', ['audio/box_click.ogg', 'audio/box_click.mp3']);
        this.load.audio('wincoins_clip', ['audio/mixkit_win.wav']);
        this.load.audio('button_click', ['audio/button.wav']);
        this.load.audio('spin_clip', ['audio/spin_sound.wav']);
        this.load.audio('win_clip', ['audio/win_coins.wav']);
        this.load.audio('lose_clip', ['audio/lose.wav']);

        // Load fonts
        if (slotConfig.fonts) {
            slotConfig.fonts.forEach((f) => {
                this.load.bitmapFont(f.fontName, f.filePNG, f.fileXML);
            });
        }
    }

    create() {
        // Get plays remaining from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const playsRemainingParam = urlParams.get('playsRemaining');
        
        if (playsRemainingParam !== null) {
            this.playsRemaining = parseInt(playsRemainingParam, 10);
            console.log('📊 Plays remaining from URL:', this.playsRemaining);
        } else {
            // Default value if not in URL
            this.playsRemaining = 10;
            console.log('📊 No plays remaining in URL, using default:', this.playsRemaining);
        }
        
        // Update UI plays counter
        const playsCountEl = document.getElementById('playsCount');
        if (playsCountEl) {
            playsCountEl.textContent = this.playsRemaining;
        }

        // Initialize backend support
        this.backend = new SlotGameBackend(this);
        this.isBackendMode = true;
        
        // Set plays remaining in backend callbacks
        if (this.backendCallbacks) {
            this.backendCallbacks.playsRemaining = this.playsRemaining;
        }

        // Events
        this.endWinCalcEvent = new MKEvent();
        this.winCoinsEvent = new MKEvent();
        this.endFreeGamesEvent = new MKEvent();
        this.freeSpinWinEvent = new MKEvent();
        this.startFreeGamesEvent = new MKEvent();

        // Main properties
        this.centerX = (slotGame.config.width / 2) + (slotConfig.localOffsetX || 0);
        this.centerY = (slotGame.config.height / 2) + (slotConfig.localOffsetY || 0);
        this.useWild = (slotConfig.useWild && slotConfig.hasOwnProperty('wild') && slotConfig.wild !== null);
        this.isCascadeSpin = false;
        this.sumCascadeCoins = 0;
        this.isFreeSpin = false;
        this.reelSpin = false;
        this.playFreeSpins = false;
        this.startFreeGames = false;
        this.endFreeGames = false;
        this.cTime = 0;
        this.useWildInFirstPosition = slotConfig.useWildInFirstPosition || false;
        this.useLineBetMultiplier = slotConfig.useLineBetMultiplier !== undefined ? slotConfig.useLineBetMultiplier : true;
        this.useLineBetFreeSpinMultiplier = slotConfig.useLineBetFreeSpinMultiplier !== undefined ? slotConfig.useLineBetFreeSpinMultiplier : true;
        this.symbolsDict = {};
        
        if (slotConfig.symbols) {
            slotConfig.symbols.forEach((s) => {
                if (s.fileName != null) this.symbolsDict[s.name] = s;
            });
        }
        this.spinCount = 0;

        // Pay tables
        this.payTable = [];
        if (slotConfig.payLines) {
            slotConfig.payLines.forEach((pLine) => {
                this.payTable.push(new PayLine(this, pLine.line, pLine.pay, pLine.freeSpins, slotConfig.wild));
            });
        }
        this.payTableFull = createFullPaytable(this.payTable, this.useWild);
        console.log('paytable full length: ' + this.payTableFull.length);
        this.scatterPayTable = [];

        // Create slot graphic
        if (slotConfig.createSlotGraphic) {
            slotConfig.createSlotGraphic(this);
        }

        // Main objects
        this.slotPlayer = new SlotPlayer(slotConfig.defaultCoins || 1000);
        this.reels = slotConfig.createReels ? slotConfig.createReels(this) : [];
        this.lineButtons = (slotConfig.createLineButtons) ? slotConfig.createLineButtons(this) : null;
        this.soundController = new SoundController(this);
        this.guiController = new GuiController(this);
        this.slotControls = new SlotControls(
            this,
            this.slotPlayer,
            slotConfig.lines || 20,
            slotConfig.lineColor || 0xFFFFFF,
            slotConfig.lineBetMaxValue || 100
        );
        this.winController = new WinController(
            this,
            this.slotControls.linesController,
            slotConfig.useScatter || false,
            slotConfig.scatter || null,
            slotConfig.winShowTime || 3000
        );

        // Add sounds
        this.box_click_clip = this.sound.add('box_click_clip');
        this.win_clip = this.sound.add('win_clip');
        this.button_click = this.sound.add('button_click');
        this.spin_clip = this.sound.add('spin_clip');
        this.wincoins_clip = this.sound.add('wincoins_clip');
        this.lose_clip = this.sound.add('lose_clip');

        // Controls
        if (slotConfig.createControls) {
            slotConfig.createControls(this, this.slotControls);
        }
        this.slotControls.init(slotConfig.selectedLines || 1, true);

        // State machine
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
            } else {
                this.stateMachine.changeState(this.loseState);
            }
        }, this);

        // Coroutines
        this.loseCorout = null;
        this.winCorout = null;
        this.freeInputWinCorout = null;

        console.log('Slot game created successfully with competition type:', window.competitionType);
        console.log('✅ Initial plays remaining:', this.playsRemaining);
    }

    update(time, delta) {
        this.cTime = time;
        if (typeof simpleTweener !== 'undefined') {
            simpleTweener.update(delta);
        }
        if (this.updateEvent && this.updateEvent.events) {
            this.updateEvent.events.forEach((eW) => {
                if (eW != null && eW.action != null) eW.action.call(eW.context, time, delta);
            });
        }
    }

    // FIXED: Main spin handler - this is called when spin button is clicked
    handleAnimation() {
        console.log('🎰 Spin button clicked');
        console.log('📊 Plays remaining:', this.playsRemaining);
        console.log('🎯 Is backend mode:', this.isBackendMode);
        console.log('🔧 Backend instance:', this.backend);
        
        // Check if backend mode and if user has plays remaining
        if (this.isBackendMode && this.backend) {
            if (!this.backend.hasPlaysRemaining()) {
                console.log('❌ No plays remaining, showing dialog');
                this.showNoPlaysDialog();
                return;
            }
            
            // Decrement plays remaining
            this.backend.decrementPlays();
        }
        
        // If we get here, we have plays remaining, proceed with spin
        console.log('✅ Proceeding with spin');
        this.runSlot();
    }

    runSlot() {
        // Additional safety check
        if (this.isBackendMode && this.backend) {
            if (!this.backend.hasPlaysRemaining()) {
                console.log('❌ No plays remaining in runSlot');
                this.showNoPlaysDialog();
                return;
            }
        }

        // Prepare, set flags
        let anyWin = false;
        let lineCoins = 0;
        let scatterCoins = 0;
        let jpCoins = 0;
        let winSpins = 0;
        this.isCascadeSpin = false;
        this.reelSpin = true;
        
        if (this.slotControls.auto && !this.isFreeSpin) this.slotControls.incAutoSpinsCounter();
        this.slotPlayer.setWinCoinsCount(0);
        if (this.slotControls.linesController) {
            this.slotControls.linesController.hideAllLines();
        }
        if (this.loseCorout !== null) this.loseCorout.stop();
        if (this.winCorout !== null) this.winCorout.stop();
        if (this.freeInputWinCorout !== null) this.freeInputWinCorout.stop();
        this.lampsBlink(false);

        // Start spin sound
        this.soundController.stopAll();
        this.soundController.playClip('spin_clip', true);

        // Create spin sequence
        this.spinCount++;
        var sA = new SequencedActions();
        sA.add((callBack) => {
            spinReels(this.reels, slotConfig, callBack);
        }, this);
        sA.add((callBack) => {
            console.log('spin complete');
            this.soundController.stopAll();
            callBack();
        }, this);

        sA.add((callBack) => {
            this.winController.searchWinSymbols();
            callBack();
        }, this);

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
                if (summCoins > 0) {
                    this.winCoinsEvent.events.forEach((eW) => {
                        if (eW != null && eW.action != null) eW.action.call(eW.context, summCoins);
                    });
                }

                winSpins = this.winController.getWinSpins();
                if (this.useLineBetFreeSpinMultiplier) winSpins *= this.slotControls.lineBet;
                if (winSpins > 0) {
                    this.freeSpinWinEvent.events.forEach((eW) => {
                        if (eW != null && eW.action != null) eW.action.call(eW.context, winSpins);
                    });
                }
            } else {
                this.isCascadeSpin = false;
            }
            this.endWinCalcEvent.events.forEach((eW) => {
                if (eW != null && eW.action != null) eW.action.call(eW.context, anyWin);
            });
            callBack();
        }, this);

        sA.add((callBack) => {
            callBack();
        }, this);

        sA.start();
    }

    addSpriteLocPos(name, posX, posY) {
        return this.add.sprite(this.centerX + posX, this.centerY + posY, name);
    }

    *wait_ms(ms) {
        var timeTarget = this.cTime + ms;
        while (timeTarget > this.cTime) {
            yield (timeTarget - this.cTime);
        }
    }

    winShow(completeCallBack) {
        this.miniGame = null;
        this.winCorout = new Coroutiner(this, this.winShowC(completeCallBack));
        this.winCorout.start();
    }

    *winShowC(completeCallBack) {
        console.log("win show start: " + this.spinCount);

        // Get win amount
        let winAmount = 0;
        if (this.winController) {
            winAmount = this.winController.getLineWinCoins() + this.winController.getScatterWinCoins();
            if (this.useLineBetMultiplier) {
                winAmount *= this.slotControls.lineBet;
            }
        }

        // Send win to backend
        if (this.isBackendMode && this.backend && winAmount > 0) {
            this.backend.handleSpinResult({
                outcome: "win",
                winAmount: winAmount,
                prizeName: "Jackpot!",
                isWin: true,
                isPhysical: false,
                symbols: [],
                paylines: [],
                switchTexts: ["⭐", "⭐", "⭐"],
            });
        }

        // Wait for popups
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        // Show win symbols
        let winShowEnd = false;
        this.winController.winSymbolShowOnce(() => { winShowEnd = true; });

        yield* this.wait_ms(1000);

        // Wait for popups
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        // Calculate coins
        let winCoins = this.winController.getLineWinCoins() + this.winController.getScatterWinCoins();
        if (this.useLineBetMultiplier) winCoins *= this.slotControls.lineBet;
        this.slotPlayer.setWinCoinsCount(winCoins);
        this.slotPlayer.addCoins(winCoins);
        
        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        // Free spins
        let winSpins = this.winController.getWinSpins();
        if (this.useLineBetFreeSpinMultiplier) winSpins *= this.slotControls.lineBet;

        // Show win messages
        if (winCoins > 0) {
            this.showWinCoinsMessage(winCoins, slotConfig.winMessageTime || 2000);
            this.soundController.playClip('wincoins_clip', false);
        }

        while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
            yield null;
        }

        if (winSpins > 0) {
            if (winCoins > 0) yield* this.wait_ms(1000);
            this.showWinFreeSpinsMessage(winSpins);
            
            // Send free spin to backend
            if (this.isBackendMode && this.backend) {
                this.backend.handleSpinResult({
                    outcome: "freeReplay",
                    winAmount: 0,
                    prizeName: "Free Spin",
                    isWin: false,
                    isPhysical: false,
                    symbols: [],
                    paylines: [],
                    switchTexts: ["🔄", "🔄", "🔄"],
                });
            }
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

        // Scatter win event
        if (this.winController.scatterWin != null && this.winController.scatterWin.winEvent != null) {
            yield* this.wait_ms(1000);
            this.winController.scatterWin.winEvent.invoke();
            while (this.miniGame !== null || !this.guiController.hasNoPopUp()) {
                yield null;
            }
        }

        // Enable player interaction
        this.reelsSpin = false;

        while (!winShowEnd) {
            yield null;
        }

        completeCallBack();
        console.log('win show end: ' + this.spinCount);
    }

    freeInputWinShow(completeCallBack) {
        this.freeInputWinCorout = new Coroutiner(this, this.freeInputWinShowC(completeCallBack));
        this.freeInputWinCorout.start();
    }

    *freeInputWinShowC(completeCallBack) {
        yield* this.wait_ms(1000);
        let winShowEnd = false;
        this.winController.winSymbolShowOnce(() => { winShowEnd = true; });

        while (!winShowEnd) {
            yield null;
        }
        completeCallBack(this.slotControls.auto || this.playFreeSpins);
    }

    loseShow(completeCallBack) {
        this.loseCorout = new Coroutiner(this, this.loseShowC(completeCallBack));
        this.loseCorout.start();
    }

    *loseShowC(completeCallBack) {
        this.soundController.playClip('lose_clip', false);
        console.log('lose show, spinCount: ' + this.spinCount);

        // Send loss to backend
        if (this.isBackendMode && this.backend) {
            this.backend.handleSpinResult({
                outcome: "noWin",
                winAmount: 0,
                prizeName: "",
                isWin: false,
                isPhysical: false,
                symbols: [],
                paylines: [],
                switchTexts: ["❌", "❌", "❌"],
            });
        }

        this.playFreeSpins = (this.slotControls.autoPlayFreeSpins && this.slotControls.hasFreeSpin());
        this.reelSpin = false;

        yield* this.wait_ms(1000);
        completeCallBack(this.slotControls.auto || this.playFreeSpins);
    }

    showWinCoinsMessage(winCoins, time) {
        var wMess = this.guiController.showMessage('Congratulation!', 'Your win: ' + winCoins + ' coins!', this,
            () => {
                if (this.timeoutMess) clearTimeout(this.timeoutMess);
                this.timeoutMess = null;
                this.guiController.closePopUp(wMess);
            });
        if (time && time > 0) this.timeoutMess = setTimeout(() => { this.guiController.closePopUp(wMess); }, time);
    }

    showWinFreeSpinsMessage(winCoins) {
        var wMess = this.guiController.showMessage('Congratulation!', 'Your win: ' + winCoins + ' free spins!', this, () => {
            this.guiController.closePopUp(wMess);
        });
    }

    lampsBlink(blink) {
        if (blink && !this.lampsIntervalID) {
            this._lampsOn = false;
            this.lampsIntervalID = setInterval(() => {
                if (this.lampsArray) {
                    this.lampsArray.forEach((l) => { l.setOn(this._lampsOn); });
                }
                this._lampsOn = !this._lampsOn;
            }, 1000);
        } else if (!blink && this.lampsIntervalID) {
            clearInterval(this.lampsIntervalID);
            if (this.lampsArray) {
                this.lampsArray.forEach((l) => { l.setOn(true); });
            }
            this.lampsIntervalID = null;
        }
    }

    showNoPlaysDialog() {
        console.log('🚫 No plays remaining!');
        
        // Show on UI
        const statusOverlay = document.getElementById('status-overlay');
        if (statusOverlay) {
            statusOverlay.style.display = 'block';
            setTimeout(() => {
                statusOverlay.style.display = 'none';
            }, 3000);
        }
        
        if (this.backendCallbacks && this.backendCallbacks.onNoPlays) {
            this.backendCallbacks.onNoPlays();
        }
    }

    resetRound() {
        this.reelSpin = false;
        if (this.slotControls) {
            this.slotControls.enableControls(true);
        }
        if (this.stateMachine) {
            this.stateMachine.changeState(this.iddleState);
        }
    }

    deliverResult(result) {
        if (result) {
            console.log("Delivering result from React:", result);
            if (result.outcome === "win") {
                // Show win animation
                if (this.winController) {
                    this.winController.showWin(result);
                }
            } else if (result.outcome === "freeReplay") {
                this.slotControls.addFreeSpins(1);
            } else {
                this.soundController.playClip('lose_clip', false);
            }
        }
    }

    setButtonsEnabled(enabled) {
        if (this.slotControls) {
            this.slotControls.enableControls(enabled);
        }
    }
    
    setControlActivity(activity, spinButtonActivity, autoSpinButtonActivity) {
        if (this.slotControls) {
            this.slotControls.setControlActivity(activity, spinButtonActivity, autoSpinButtonActivity);
        }
    }
    
    winShowCancel() {
        if (this.slotControls) {
            this.slotControls.winShowCancel();
        }
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getSymboldData(_slotConfig, spriteName) {
    if (_slotConfig && _slotConfig.symbols) {
        for (var si = 0; si < _slotConfig.symbols.length; si++) {
            if (_slotConfig.symbols[si].name === spriteName) return _slotConfig.symbols[si];
        }
    }
    return null;
}

function spinReels(reels, _slotConfig, completeCallback) {
    var pA = new ParallelActions();
    var ri = 0;
    reels.forEach((r) => {
        pA.add((callBack) => {
            var rand = (_slotConfig.reels_simulate && _slotConfig.reels_simulate[ri] >= 0) ?
                _slotConfig.reels_simulate[ri] :
                r.getRandomOrderPosition();
            r.spin(rand, () => { callBack(); });
            ri++;
        });
    });
    pA.start(completeCallback);
}

function createFullPaytable(payTable, useWild) {
    var payTableFull = [];
    if (payTable) {
        for (var j = 0; j < payTable.length; j++) {
            payTableFull.push(payTable[j]);
            if (useWild && payTable[j].getWildLines) {
                var wildLines = payTable[j].getWildLines();
                if (wildLines) {
                    wildLines.forEach((wl) => { payTableFull.push(wl); });
                }
            }
        }
    }
    return payTableFull;
}

function getTime() {
    let d = new Date();
    return d.getTime();
}