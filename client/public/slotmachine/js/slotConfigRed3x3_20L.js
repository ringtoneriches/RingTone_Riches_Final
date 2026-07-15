// 3x3 20 lines red slot


let symbolsUsed = [
    'Coin £1',
    'Tomato £2',
    'Apple £3',
    // 'Bell £4',
    // 'Grape £5',
    // 'Banana £25',
    // 'Cherry £50',
    // 'Strawberry £50',
    // 'Orange £80',
    // 'Star £100',
    // 'Dice £250',
    // '7 £500',
    // 'Bar £750',
    // 'Diamond £1000',
    // 'Trophy £2500',
    // 'Crown £5000',
    // '100 Points',
    // '500 Points',
    '750 Points',
    '1000 Points',
]

const shuffle = (arr) => {
    const copy = [...arr];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
};

var slotConfigRed3x3_20L = {

    slotTextColor: 0xE6BE00, // Saffron Gold,   // text color

    symbolSizeY: 150,
    spinTime: 2000,             // time, milliseconds
    winShowTime: 3000,          // time, milliseconds
    winMessageTime: 2000,       // win message show time

    symbAnimFrameRate: 28,      // symbols animation frame rate
    frameWidth: 120,           // frame width
    frameHeight: 120,          // frame height

    lineColor: 0xFFEA31,       // line color

    lineBetMaxValue: 20,                // slot line bet maxvalue
    useWild: true,                      // use wild flag, wild can be substitute for any symbol to create winning combinations (exclude first reel)'
    wild: 'Wild',                       // wild symbol name
    useScatter: false,                  // use scatter flag
    scatter: 'Scatter',                 // scatter functionality is not implemented in the current version 
    selectedLines: 'all',               //'all' / 'first' - selectad lines at start

    useWildInFirstPosition: false,          // substitute of the first symbol not allowed
    useLineBetMultiplier: true,             // win multiplied by bet
    useLineBetFreeSpinMultiplier: false,    // free spins win multiplied by bet 
    defaultCoins: 100,                     // default player credit
    defaultPoins: 10,
    localOffsetX: 0,                        // x offset from center for all scene objects
    localOffsetY: 100,                      // y offset from center for all scene objects

    fonts: [
        {
            fontName: 'gameFont',
            filePNG: 'fonts/roboto_72.png',
            fileXML: 'fonts/roboto_72.xml'
        },
        {
            fontName: 'gameFont_e',
            filePNG: 'fonts/roboto_72_e.png',
            fileXML: 'fonts/roboto_72.xml'
        },
        {
            fontName: 'gameFont_skew15',
            filePNG: 'fonts/rb_30_skew15r.png',
            fileXML: 'fonts/rb_30.xml'
        },
        {
            fontName: 'gameFont_skewm15',
            filePNG: 'fonts/rb_30_skewm15r.png',
            fileXML: 'fonts/rb_30.xml'
        },

    ],

    sprites: [
        // common sprites 
        {
            fileName: 'SlotMachine.png',
            name: 'slot'
        },
        {
            fileName: 'SlotMachineHandle.png',
            name: 'handle'
        },
        {
            fileName: 'Reel3x3.png',
            name: 'reel'
        },

        {
            fileName: 'Symbols/logo.png',
            name: 'logo'
        },
        // red sprites
        {
            fileName: 'red/HandleBall.png',
            name: 'handle_ball'
        },
        {
            fileName: 'red/LampOn.png',
            name: 'lamp_on'
        },
        {
            fileName: 'red/LampOff.png',
            name: 'lamp_off'
        },
        {
            fileName: 'red/ButtonBet.png',
            name: 'button_bet'
        },
        {
            fileName: 'red/ButtonBetHover.png',
            name: 'button_bet_hover'
        },
        {
            fileName: 'red/ButtonInfo.png',
            name: 'button_info'
        },
        {
            fileName: 'red/ButtonInfoHover.png',
            name: 'button_info_hover'
        },
        {
            fileName: 'red/ButtonLines.png',
            name: 'button_lines'
        },
        {
            fileName: 'red/ButtonLinesHover.png',
            name: 'button_lines_hover'
        },
        {
            fileName: 'red/ButtonMaxBet.png',
            name: 'button_maxbet'
        },
        {
            fileName: 'red/ButtonMaxBetHover.png',
            name: 'button_maxbet_hover'
        },
        {
            fileName: 'red/ButtonSpinUp1.png',
            name: 'button_spin2'
        }, {
            fileName: 'red/ButtonSpinUp2.png',
            name: 'button_spin'
        }, {
            fileName: 'red/ButtonSpinUp3.png',
            name: 'button_spin3'
        },
        {
            fileName: 'red/ButtonSpinUp3.png',
            name: 'button_spin_hover'
        },
        {
            fileName: 'red/LineButton.png',
            name: 'line_button'
        },
        {
            fileName: 'red/LineButtonHover.png',
            name: 'line_button_hover'
        },
        // common gui sprites 
        {
            fileName: 'gui/ButtonSettings.png',
            name: 'button_settings'
        },
        {
            fileName: 'gui/ButtonSettingsHover.png',
            name: 'button_settings_hover'
        },
        {
            fileName: 'gui/ButtonSoundsOn.png',
            name: 'button_soundson'
        },
        {
            fileName: 'gui/ButtonSoundsOff.png',
            name: 'button_soundsoff'
        },
        {
            fileName: 'gui/MessagePanel.png',
            name: 'message_panel'
        },
        {
            fileName: 'gui/NegativeMessagePanel.png',
            name: 'negative_message_panel'
        },
        {
            fileName: 'gui/ExitButtonNormal.png',
            name: 'exit_button'
        },
        {
            fileName: 'gui/ExitButtonHover.png',
            name: 'exit_button_hover'
        },
        {
            fileName: 'gui/MiddleButtonNormal.png',
            name: 'middle_button'
        },
        {
            fileName: 'gui/MiddleButtonHover.png',
            name: 'middle_button_hover'
        },
        {
            fileName: 'gui/InfoPanel.png',
            name: 'info_panel'
        },
        {
            fileName: 'gui/grayBkg_50.png',
            name: 'gray_background'
        },
        {
            fileName: 'gui/NextButtonHover.png',
            name: 'next_button_hover'
        },
        {
            fileName: 'gui/NextButton.png',
            name: 'next_button'
        },
        {
            fileName: 'gui/PrevButtonHover.png',
            name: 'prev_button_hover'
        },
        {
            fileName: 'gui/PrevButton.png',
            name: 'prev_button'
        },
        {
            fileName: 'gui/MinorTitle.png',
            name: 'minor_title'
        },
        {
            fileName: 'gui/MajorTitle.png',
            name: 'major_title'
        },
        {
            fileName: 'gui/SpecialTitle.png',
            name: 'special_title'
        },
        {
            fileName: 'gui/SymbolsPlate.png',
            name: 'symbol_plate'
        },
        {
            fileName: 'gui/SpecSymbolsPlate.png',
            name: 'specsymbol_plate'
        },
        {
            fileName: 'gui/NaviDot.png',
            name: 'navi_dot'
        },
        {
            fileName: 'gui/NaviDotActive.png',
            name: 'navi_dot_active'
        },
        {
            fileName: 'gui/PayLinesTitle.png',
            name: 'paylines_title'
        },
        {
            fileName: 'gui/PayLinesTable.png',
            name: 'paylines_table'
        },
    ],

    symbols:
        [
            {
                fileName: '7 £500.png',
                name: '7 £500',
                fileNameBlurred: '7 £500.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: '100 Points.png',
                name: '100 Points',
                fileNameBlurred: '100 Points.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: '500 Points.png',
                name: '500 Points',
                fileNameBlurred: '500 Points.png',
                animation: null,
                useWildSubstitute: true
            }, {
                fileName: '750 Points.png',
                name: '750 Points',
                fileNameBlurred: '750 Points.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: '1000 Points.png',
                name: '1000 Points',
                fileNameBlurred: '1000 Points.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Apple £3.png',
                name: 'Apple £3',
                fileNameBlurred: 'Apple £3.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Banana £25.png',
                name: 'Banana £25',
                fileNameBlurred: 'Banana £25.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Bar £750.png',
                name: 'Bar £750',
                fileNameBlurred: 'Bar £750.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Bell £4.png',
                name: 'Bell £4',
                fileNameBlurred: 'Bell £4.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Cherry £50.png',
                name: 'Cherry £50',
                fileNameBlurred: 'Cherry £50.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Coin £1.png',
                name: 'Coin £1',
                fileNameBlurred: 'Coin £1.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Crown £5000.png',
                name: 'Crown £5000',
                fileNameBlurred: 'Crown £5000.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Diamond £1000.png',
                name: 'Diamond £1000',
                fileNameBlurred: 'Diamond £1000.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Dice £250.png',
                name: 'Dice £250',
                fileNameBlurred: 'Dice £250.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Grape £5.png',
                name: 'Grape £5',
                fileNameBlurred: 'Grape £5.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Orange £80.png',
                name: 'Orange £80',
                fileNameBlurred: 'Orange £80.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Star £100.png',
                name: 'Star £100',
                fileNameBlurred: 'Star £100.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Strawberry £50.png',
                name: 'Strawberry £50',
                fileNameBlurred: 'Strawberry £50.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Tomato £2.png',
                name: 'Tomato £2',
                fileNameBlurred: 'Tomato £2.png',
                animation: null,
                useWildSubstitute: true
            },
            {
                fileName: 'Trophy £2500.png',
                name: 'Trophy £2500',
                fileNameBlurred: 'Trophy £2500.png',
                animation: null,
                useWildSubstitute: true
            },
        ],



    reels: [
        {
            symbolImages: shuffle(symbolsUsed),
            offsetX: -202,
            offsetY: -120,
            windowImage: 'reel',
            windowsCount: 3,
            addSpinTime: 0
        },
        {
            symbolImages: shuffle(symbolsUsed),
            offsetX: 0,
            offsetY: -120,
            windowImage: 'reel',
            windowsCount: 3,
            addSpinTime: 100
        },
        {
            symbolImages: shuffle(symbolsUsed),
            offsetX: 202,
            offsetY: -120,
            windowImage: 'reel',
            windowsCount: 3,
            addSpinTime: 200
        }
    ],

    // reels_simulate: [2, 2, -1], // -1 - avoid reel simulate

    lines: [ // predefined  slot lines positions 0 - most bottom window on reels
        [1, 1, 1],  // line 0 
        [2, 2, 2],  // line 1 
        [0, 0, 0],  // line 2
        [2, 1, 0],  // line 3
        [0, 1, 2],  // line 4
        [1, 2, 1],  // line 5
        [1, 0, 1],  // line 6
        [2, 2, 1],  // line 7
        [0, 0, 1],  // line 8
        [1, 1, 0],  // line 9

        [2, 1, 1],  // line 10
        [2, 1, 2],  // line 11
        [2, 2, 0],  // line 12
        [1, 2, 2],  // line 13
        [1, 0, 0],  // line 14
        [0, 1, 0],  // line 15
        [0, 2, 1],  // line 16
        [2, 0, 1],  // line 17
        [0, 2, 0],  // line 18
        [0, 0, 2]   // line 19
    ],

    payLines: [
        {
            line: ['Coin £1', 'Coin £1', 'Coin £1'],
            pay: 1,
            euro: true,
            freeSpins: 1
        },
        {
            line: ['Tomato £2', 'Tomato £2', 'Tomato £2'],
            pay: 2,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Apple £3', 'Apple £3', 'Apple £3'],
            pay: 3,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Bell £4', 'Bell £4', 'Bell £4'],
            pay: 4,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Grape £5', 'Grape £5', 'Grape £5'],
            pay: 5,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Banana £25', 'Banana £25', 'Banana £25'],
            pay: 25,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['100 Points', '100 Points', '100 Points'],
            pay: 100,
            euro: false,
            freeSpins: 1
        },
        {
            line: ['500 Points', '500 Points', '500 Points'],
            pay: 500,
            euro: false,
            freeSpins: 0
        },
        {
            line: ['750 Points', '750 Points', '750 Points'],
            pay: 750,
            euro: false,
            freeSpins: 0
        },
        {
            line: ['1000 Points', '1000 Points', '1000 Points'],
            pay: 1000,
            euro: false,
            freeSpins: 0
        },

        // Optional (if you enable these symbols later)

        {
            line: ['Cherry £50', 'Cherry £50', 'Cherry £50'],
            pay: 50,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Strawberry £50', 'Strawberry £50', 'Strawberry £50'],
            pay: 50,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Orange £80', 'Orange £80', 'Orange £80'],
            pay: 80,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Star £100', 'Star £100', 'Star £100'],
            pay: 100,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Dice £250', 'Dice £250', 'Dice £250'],
            pay: 250,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['7 £500', '7 £500', '7 £500'],
            pay: 500,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Bar £750', 'Bar £750', 'Bar £750'],
            pay: 750,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Diamond £1000', 'Diamond £1000', 'Diamond £1000'],
            pay: 1000,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Trophy £2500', 'Trophy £2500', 'Trophy £2500'],
            pay: 2500,
            euro: true,
            freeSpins: 0
        },
        {
            line: ['Crown £5000', 'Crown £5000', 'Crown £5000'],
            pay: 5000,
            euro: true,
            freeSpins: 0
        }
    ],

    createSlotGraphic: function (scene) {
        // scene.background =  scene.addSpriteLocPos('background', 0, 0); //.setScale(1.5);
        // scene.background.depth = -5;
        scene.lampsArray = [];

        // scene.leftLamp = new Lamp(scene, -366, -490);
        // scene.rightLamp = new Lamp(scene, 366, -490);
        // scene.rightLamp.lamp.setScale(-1, 1); // mirror right lamp
        // scene.lampsArray.push(scene.leftLamp);
        // scene.lampsArray.push(scene.rightLamp);
        // scene.leftLamp.on();

        // scene.rightLamp.on();
        scene.slot = scene.addSpriteLocPos('slot', 15, -80).setScale(0.9);
        scene.handle = scene.addSpriteLocPos('handle', 420, 50).setOrigin(0.5, 1.2).setScale(0.5, 0.5);
        scene.handleBall = scene.addSpriteLocPos('handle_ball', 430, -150).setScale(0.6);




    },

    createReels: function (scene) {
        var _reels = [];
        for (var ri = 0; ri < this.reels.length; ri++) {
            _reels.push(new Reel(scene, this.reels[ri], ri, this.symbolSizeY, this.reels[ri].windowsCount, false, this.spinTime, this.symbAnimFrameRate));
        }
        return _reels;
    },

    // optional line buttons order
    lineButtonsLeftOrder: [4, 2, 8, 10, 6, 1, 7, 9, 3, 5],
    lineButtonsRightOrder: [14, 20, 12, 18, 16, 11, 17, 13, 15, 19],

    // the number of buttons must equal the number of lines
    createLineButtons: function (scene) {
        if (!this.lineButtonsLeftOrder || !this.lineButtonsRightOrder) return null;
        var lineButtons = [];
        for (var i = 0; i < this.lineButtonsLeftOrder.length; i++) {
            var lB = new LineButton(scene, 'line_button', 'line_button_hover', this.lineButtonsLeftOrder[i]);
            lineButtons.push(lB);
            lB.create(-390, -360 + 45 * i, 0.5, 0.5);
        }

        for (var i = 0; i < this.lineButtonsRightOrder.length; i++) {
            var lB = new LineButton(scene, 'line_button', 'line_button_hover', this.lineButtonsRightOrder[i]);
            lineButtons.push(lB);
            lB.create(390, -360 + 45 * i, 0.5, 0.5);
            lB.button.setScale(-1, 1);
        }

        lineButtons.sort((a, b) => a.number - b.number);
        return lineButtons;
    },


    createControls: function (scene, slotControls) {
        // lines loop button
        // slotControls.slotLinesLoopButton = new SceneButton(scene, 'button_lines', 'button_lines_hover', false);
        // slotControls.buttons.push(slotControls.slotLinesLoopButton);
        // slotControls.slotLinesLoopButton.create(-360, 225, 0.5, 0.5);
        // slotControls.slotLinesLoopButton.addClickEvent(slotControls.linesLoop_Click, slotControls);

        scene.logo = new Logo(scene, 10, -440);

        // linebet loop button
        // slotControls.slotLineBetLoopButton = new SceneButton(scene, 'button_bet', 'button_bet_hover', false);
        // slotControls.buttons.push(slotControls.slotLineBetLoopButton);
        // slotControls.slotLineBetLoopButton.create(360, 225, 0.5, 0.5);
        // slotControls.slotLineBetLoopButton.addClickEvent(slotControls.lineBetLoop_Click, slotControls);

        // info button
        // slotControls.slotInfoButton = new SceneButton(scene, 'button_info', 'button_info_hover', false);
        // slotControls.buttons.push(slotControls.slotInfoButton);
        // slotControls.slotInfoButton.create(window.gameWidth / 2 - 200, -window.gameHeight / 2 + 100, 0.5, 0.5);
        // slotControls.slotInfoButton.addClickEvent(() => {
        //     var pu = scene.guiController.showPopUp(this.createInfoPUHandler);
        //     scene.soundController.playClip('button_click');
        // }, this);

        // maxbet button
        // slotControls.slotMaxBetButton = new SceneButton(scene, 'button_maxbet', 'button_maxbet_hover', false);
        // slotControls.buttons.push(slotControls.slotMaxBetButton);
        // slotControls.slotMaxBetButton.create(198, 225, 0.5, 0.5);
        // slotControls.slotMaxBetButton.addClickEvent(slotControls.maxBet_Click, slotControls);

        // spin button
        slotControls.slotSpinButton = new SpinButton(scene, 'button_spin', 'button_spin_hover', false);
        slotControls.buttons.push(slotControls.slotSpinButton);
        slotControls.slotSpinButton.create(0, 305, 0.5, 0.5);
        slotControls.slotSpinButton.clickEvent.add(scene.handleAnimation, scene);
        // autoSpin button
        // slotControls.slotAutoSpinButton = new SceneButton(scene, 'button_spin', 'button_spin_hover', false);
        // slotControls.buttons.push(slotControls.slotAutoSpinButton);
        // slotControls.slotAutoSpinButton.create(0, 325, 0.5, 0.5);
        // slotControls.slotAutoSpinButton.button.setVisible(false);

        // settings button - not used
        slotControls.settingsButton = new SceneButton(scene, 'button_settings', 'button_settings_hover', false);
        slotControls.buttons.push(slotControls.settingsButton);
        slotControls.settingsButton.create(760, -570, 0.5, 0.5);
        slotControls.settingsButton.addClickEvent(() => {
            console.log('settings click');
            scene.soundController.playClip('button_click');
        }, this);
        slotControls.settingsButton.button.setVisible(false);

        // sound button
        // slotControls.soundButton = new SceneButton(scene, 'button_soundson', 'button_soundsoff', true);
        // // slotControls.buttons.push(slotControls.soundButton);
        // slotControls.soundButton.create(window.gameWidth / 2 - 100, -window.gameHeight / 2 + 100, 0.5, 0.5);
        // slotControls.soundButton.addClickEvent(() => { scene.soundController.soundOn(!scene.soundController._soundOn); }, scene);
        // slotControls.soundButton.button.setVisible(true);

        // adding the text fields
        // slotControls.linesCountText = scene.add.bitmapText(scene.centerX - 360, scene.centerY + 200, 'gameFont_skewm15', slotControls.selectedLinesCount, 40, 1).setOrigin(0.5);
        // slotControls.slotLinesLoopButton.pointerDownEvent.add(() => { slotControls.linesCountText.setPosition(slotControls.linesCountText.x, scene.centerY + 212); });
        // slotControls.slotLinesLoopButton.pointerUpEvent.add(() => { slotControls.linesCountText.setPosition(slotControls.linesCountText.x, scene.centerY + 200); });

        // slotControls.lineBetAmountText = scene.add.bitmapText(scene.centerX + 360, scene.centerY + 200, 'gameFont_skew15', slotControls.lineBet, 40, 1).setOrigin(0.5);
        // slotControls.slotLineBetLoopButton.pointerDownEvent.add(() => { slotControls.lineBetAmountText.setPosition(slotControls.lineBetAmountText.x, scene.centerY + 212); });
        // slotControls.slotLineBetLoopButton.pointerUpEvent.add(() => { slotControls.lineBetAmountText.setPosition(slotControls.lineBetAmountText.x, scene.centerY + 200); });

        // slotControls.totalBetText = scene.add.bitmapText(scene.centerX - 120, scene.centerY + 120, 'gameFont', 'TOTAL BET', 30, 1).setOrigin(0, 0.5);
        // slotControls.totalBetText.tint = this.slotTextColor;

        slotControls.totalBetSumText = scene.add.bitmapText(scene.centerX * 45, scene.centerY + 120, 'gameFont', slotControls.getTotalBet(), 30, 1).setOrigin(1, 0.5);
        slotControls.totalBetSumText.tint = this.slotTextColor;

        slotControls.creditText = scene.add.bitmapText(11130, 120, 'gameFont', 'CREDIT:', 40, 1).setOrigin(0.5);
        slotControls.creditText.tint = this.slotTextColor;

        // Anton-Regular is loaded as a TTF (regular text), so use add.text (not bitmapText).
        slotControls.creditSumText = scene.add.text(11300, 120, '£' + scene.slotPlayer.coins, {
            fontFamily: 'anton-regular',
            fontSize: '50px',
            fontWeight: 'bold',
            color: Phaser.Display.Color.IntegerToColor(this.slotTextColor).rgba
        }).setOrigin(1, 0.5);


        // slotControls.pointText = scene.add.bitmapText(130, 180, 'gameFont', 'POINTS:', 40, 1).setOrigin(0.5);
        // slotControls.pointText.tint = this.slotTextColor;

        // slotControls.pointSumText = scene.add.bitmapText(280, 180, 'gameFont', scene.slotPlayer.points, 40, 1).setOrigin(1, 0.5);
        // slotControls.pointSumText.tint = this.slotTextColor;

        slotControls.winAmountText = scene.add.bitmapText(scene.centerX, scene.centerY + 75, 'gameFont', '0', 30, 1).setOrigin(0.5);
        slotControls.winAmountText.tint = this.slotTextColor;
        slotControls.winAmountText.setVisible(false);

        slotControls.infoText = scene.add.bitmapText(scene.centerX, scene.centerY + 400, 'gameFont', 'info', 30, 1).setOrigin(0.5);
        slotControls.infoText.tint = this.slotTextColor;
        slotControls.infoText.setVisible(false);

        slotControls.freeSpinCountText = scene.add.bitmapText(scene.centerX, scene.centerY + 360, 'gameFont', '9999', 30, 1).setOrigin(0.5);
        slotControls.freeSpinCountText.tint = this.slotTextColor;
        slotControls.freeSpinCountText.setVisible(false);
    },

    createInfoPUHandler: function (popup) {
        function createSymbolPlate3x(popup, parentContainer, panelSpriteName, symbSpriteName, posX, posY, price) {
            let symbContainer = popup.scene.add.container(posX, posY);
            parentContainer.add(symbContainer);
            let symbPlate = popup.scene.add.sprite(0, 0, panelSpriteName).setOrigin(0.5);
            let symbIcon = popup.scene.add.sprite(-140, 0, symbSpriteName).setOrigin(0.5);
            symbContainer.add(symbPlate);
            symbContainer.add(symbIcon);

            let textXPos = -20;
            let text3x = popup.scene.add.bitmapText(textXPos, 0, 'gameFont', '3x - ', 38, 1).setOrigin(0, 0.5);
            symbContainer.add(text3x);
            let priceText = popup.scene.add.bitmapText(textXPos + 60, 0, 'gameFont_e', price, 38, 1).setOrigin(0, 0.5);
            symbContainer.add(priceText);
        };

        function createSpecSymbolPlate(popup, parentContainer, panelSpriteName, symbSpriteName, posX, posY, info) {
            let symbContainer = popup.scene.add.container(posX, posY);
            parentContainer.add(symbContainer);
            let symbPlate = popup.scene.add.sprite(0, 0, panelSpriteName).setOrigin(0.5);
            let symbIcon = popup.scene.add.sprite(0, -240, symbSpriteName).setOrigin(0.5);
            symbContainer.add(symbPlate);
            symbContainer.add(symbIcon);

            let textInfo = popup.scene.add.bitmapText(0, -140, 'gameFont', info, 32, 1).setOrigin(0.5, 0);
            symbContainer.add(textInfo);
        };

        function refreshInfoPu(containers, selectors, index) {
            for (let i = 0; i < containers.length; i++) {
                containers[i].visible = (index === i);
                selectors[i].setTexture((index === i) ? 'navi_dot_active' : 'navi_dot');
            }
        };

        let index = 0;
        let containers = [];
        let selectors = [];
        let offsetY = -100;

        // add background and panel
        let backGround = popup.scene.add.sprite(0, 0 + offsetY, 'gray_background').setOrigin(0.5).setScale(300);
        backGround.setInteractive();        // block bottom controls
        backGround.setAlpha(0.05);
        popup.add(backGround);
        let panel = popup.scene.add.sprite(0, 0 + offsetY, 'info_panel').setOrigin(0.5);
        popup.add(panel);
        let exitButtonX = 770;
        if (window.gameWidth < 1000) {
            exitButtonX = window.gameWidth / 2 - 100;
        }

        popup.addButton('exitButton', 'exit_button', 'exit_button_hover', false, exitButtonX, -285 + offsetY);
        popup.addButton('nextButton', 'next_button', 'next_button_hover', false, 175, 440 + offsetY);
        popup.addButton('prevButton', 'prev_button', 'prev_button_hover', false, -175, 440 + offsetY);
        popup['exitButton'].clickEvent.add(() => { popup.scene.soundController.playClip('button_click', false); }, popup);
        popup['nextButton'].clickEvent.add(() => { popup.scene.soundController.playClip('button_click', false); }, popup);
        popup['prevButton'].clickEvent.add(() => { popup.scene.soundController.playClip('button_click', false); }, popup);

        popup['exitButton'].clickEvent.add(() => { popup.scene.guiController.closePopUp(popup); });

        popup['nextButton'].clickEvent.add(() => {
            if (index < containers.length - 1) index++;
            else index = 0;
            refreshInfoPu(containers, selectors, index);
        }, this);

        popup['prevButton'].clickEvent.add(() => {
            if (index > 0) index--;
            else index = containers.length - 1;
            refreshInfoPu(containers, selectors, index);
        }, this);

        // create paylines panel
        let linesContainer = popup.scene.add.container(0, 0 + offsetY);
        containers.push(linesContainer);
        popup.add(linesContainer);
        let linesTitle = popup.scene.add.sprite(0, -305, 'paylines_title').setOrigin(0.5);
        linesContainer.add(linesTitle);
        let linesTable = popup.scene.add.sprite(0, 30, 'paylines_table').setOrigin(0.5);

        linesContainer.add(linesTable);
        if (window.gameWidth < 1000) {
            linesContainer.setScale(.8)
        }

        // create minor symbols panel - 5 minor symbols
        let minorContainer = popup.scene.add.container(0, 0 + offsetY);
        containers.push(minorContainer);
        popup.add(minorContainer);
        let minorTitle = popup.scene.add.sprite(0, -305, 'minor_title').setOrigin(0.5);
        minorContainer.add(minorTitle);

        let row1Y = -130;
        let row2Y = row1Y + 270;
        let col1X = -420;
        let colDist = 470;
        let col2X = col1X + colDist;
        let col3X = col2X + colDist;

        // minor row 1
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', '1Bar', col1X, row1Y, 3);
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', '2Bars', col2X, row1Y, 5);
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', '3Bars', col3X, row1Y, 8);

        // minor row 2
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', 'Seven', col1X + 0.5 * colDist, row2Y, 10);
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', '10', col2X + 0.5 * colDist, row2Y, 12);
        // createSymbolPlate3x(popup, minorContainer, 'symbol_plate', '2Bars', col3X, row2Y, 100);
        minorContainer.visible = false;

        // create major symbols panel
        let majorContainer = popup.scene.add.container(0, 0 + offsetY);
        containers.push(majorContainer);
        popup.add(majorContainer);
        let majorTitle = popup.scene.add.sprite(0, -305, 'major_title').setOrigin(0.5);
        majorContainer.add(majorTitle);

        // major row 1
        createSymbolPlate3x(popup, majorContainer, 'symbol_plate', 'J', col1X, row1Y, 20);
        createSymbolPlate3x(popup, majorContainer, 'symbol_plate', 'Q', col2X, row1Y, 25);
        createSymbolPlate3x(popup, majorContainer, 'symbol_plate', 'K', col3X, row1Y, 30);

        // major row 2
        // createSymbolPlate3x(popup, majorContainer , 'symbol_plate', 'J', col1X , row2Y, 100);
        createSymbolPlate3x(popup, majorContainer, 'symbol_plate', 'A', col2X, row2Y, 40);
        // createSymbolPlate3x(popup, majorContainer , 'symbol_plate', 'A', col3X, row2Y, 100);
        majorContainer.visible = false;

        // create special symbols panel
        let specialContainer = popup.scene.add.container(0, 0 + offsetY);
        containers.push(specialContainer);
        popup.add(specialContainer);
        let specialTitle = popup.scene.add.sprite(0, -305, 'special_title').setOrigin(0.5);
        specialContainer.add(specialTitle);

        // special row 1
        createSpecSymbolPlate(popup, specialContainer, 'specsymbol_plate', 'Wild', 0, 100, 'wild \n can be used with \n any symbols on \n the reels to create \n winning combinations \n (exclude first reel)');
        // createSpecSymbolPlate(popup, specialContainer , 'specsymbol_plate', 'Scatter', 235 , 100, 'scatter \n symbol info \n symbol info');
        specialContainer.visible = false;

        // create navi selectors
        let dotDist = 50;
        let offsetDots = dotDist * (containers.length - 1) / 2;
        for (let i = 0; i < containers.length; i++) {
            var selector = popup.scene.add.sprite(-offsetDots + i * dotDist, 440 + offsetY, 'navi_dot').setOrigin(0.5);
            selectors.push(selector);
            popup.add(selector);
        }
        refreshInfoPu(containers, selectors, index);
    }
}
