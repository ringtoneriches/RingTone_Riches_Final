// ═══════════════════════════════════════════════
//  ROYAL REELS  — Slot Config
//  Red / Gold casino theme with custom royal symbols
// ═══════════════════════════════════════════════
var slotConfigRoyalReels = {
    slotTextColor : 0xD4AF37,   // gold text

    symbolSizeY: 150,
    spinTime: 2000,
    winShowTime: 3000,
    winMessageTime: 2000,

    symbAnimFrameRate: 28,
    frameWidth : 164,
    frameHeight : 164,

    lineColor : 0xFFD700,

    lineBetMaxValue: 20,
    useWild: true,
    wild: 'RWild',
    useScatter: false,
    scatter: 'Scatter',
    selectedLines: 'all',

    useWildInFirstPosition: true,
    useLineBetMultiplier: true,
    useLineBetFreeSpinMultiplier: false,
    defaultCoins: 1000,

    localOffsetX: 0,
    localOffsetY: 100,

    fonts: [
        { fontName: 'gameFont',        filePNG: 'fonts/roboto_72.png',      fileXML: 'fonts/roboto_72.xml' },
        { fontName: 'gameFont_e',      filePNG: 'fonts/roboto_72_e.png',    fileXML: 'fonts/roboto_72.xml' },
        { fontName: 'gameFont_skew15', filePNG: 'fonts/rb_30_skew15r.png',  fileXML: 'fonts/rb_30.xml'     },
        { fontName: 'gameFont_skewm15',filePNG: 'fonts/rb_30_skewm15r.png', fileXML: 'fonts/rb_30.xml'     }
    ],

    sprites: [
        { fileName: 'SlotMachine_3x3.png',         name: 'slot'                 },
        { fileName: 'SlotMachineHandle.png',        name: 'handle'               },
        { fileName: 'Reel3x3.png',                  name: 'reel'                 },
        { fileName: 'red/HandleBall.png',           name: 'handle_ball'          },
        { fileName: 'red/LampOn.png',               name: 'lamp_on'              },
        { fileName: 'red/LampOff.png',              name: 'lamp_off'             },
        { fileName: 'red/ButtonBet.png',            name: 'button_bet'           },
        { fileName: 'red/ButtonBetHover.png',       name: 'button_bet_hover'     },
        { fileName: 'red/ButtonInfo.png',           name: 'button_info'          },
        { fileName: 'red/ButtonInfoHover.png',      name: 'button_info_hover'    },
        { fileName: 'red/ButtonLines.png',          name: 'button_lines'         },
        { fileName: 'red/ButtonLinesHover.png',     name: 'button_lines_hover'   },
        { fileName: 'red/ButtonMaxBet.png',         name: 'button_maxbet'        },
        { fileName: 'red/ButtonMaxBetHover.png',    name: 'button_maxbet_hover'  },
        { fileName: 'red/ButtonSpin.png',           name: 'button_spin'          },
        { fileName: 'red/ButtonSpinHover.png',      name: 'button_spin_hover'    },
        { fileName: 'red/LineButton.png',           name: 'line_button'          },
        { fileName: 'red/LineButtonHover.png',      name: 'line_button_hover'    },
        { fileName: 'gui/ButtonSettings.png',       name: 'button_settings'      },
        { fileName: 'gui/ButtonSettingsHover.png',  name: 'button_settings_hover'},
        { fileName: 'gui/ButtonSoundsOn.png',       name: 'button_soundson'      },
        { fileName: 'gui/ButtonSoundsOff.png',      name: 'button_soundsoff'     },
        { fileName: 'gui/MessagePanel.png',         name: 'message_panel'        },
        { fileName: 'gui/ExitButtonNormal.png',     name: 'exit_button'          },
        { fileName: 'gui/ExitButtonHover.png',      name: 'exit_button_hover'    },
        { fileName: 'gui/MiddleButtonNormal.png',   name: 'middle_button'        },
        { fileName: 'gui/MiddleButtonHover.png',    name: 'middle_button_hover'  },
        { fileName: 'gui/InfoPanel.png',            name: 'info_panel'           },
        { fileName: 'gui/grayBkg_50.png',           name: 'gray_background'      },
        { fileName: 'gui/NextButtonHover.png',      name: 'next_button_hover'    },
        { fileName: 'gui/NextButton.png',           name: 'next_button'          },
        { fileName: 'gui/PrevButtonHover.png',      name: 'prev_button_hover'    },
        { fileName: 'gui/PrevButton.png',           name: 'prev_button'          },
        { fileName: 'gui/MinorTitle.png',           name: 'minor_title'          },
        { fileName: 'gui/MajorTitle.png',           name: 'major_title'          },
        { fileName: 'gui/SpecialTitle.png',         name: 'special_title'        },
        { fileName: 'gui/SymbolsPlate.png',         name: 'symbol_plate'         },
        { fileName: 'gui/SpecSymbolsPlate.png',     name: 'specsymbol_plate'     },
        { fileName: 'gui/NaviDot.png',              name: 'navi_dot'             },
        { fileName: 'gui/NaviDotActive.png',        name: 'navi_dot_active'      },
        { fileName: 'gui/PayLinesTitle.png',        name: 'paylines_title'       },
        { fileName: 'gui/PayLinesTable.png',        name: 'paylines_table'       },
    ],

    symbols: [
        // Royal symbols — blurred versions are duplicates (static during spin is fine)
        { fileName: 'RCoin.png',        name: 'RCoin',        fileNameBlurred: 'RCoinBlurred.png',        animation: null, useWildSubstitute: true  },
        { fileName: 'RApple.png',       name: 'RApple',       fileNameBlurred: 'RAppleBlurred.png',       animation: null, useWildSubstitute: true  },
        { fileName: 'RTomato.png',      name: 'RTomato',      fileNameBlurred: 'RTomatoBlurred.png',      animation: null, useWildSubstitute: true  },
        { fileName: 'RBell.png',        name: 'RBell',        fileNameBlurred: 'RBellBlurred.png',        animation: null, useWildSubstitute: true  },
        { fileName: 'RGrape.png',       name: 'RGrape',       fileNameBlurred: 'RGrapeBlurred.png',       animation: null, useWildSubstitute: true  },
        { fileName: 'RCherry.png',      name: 'RCherry',      fileNameBlurred: 'RCherryBlurred.png',      animation: null, useWildSubstitute: true  },
        { fileName: 'RStar.png',        name: 'RStar',        fileNameBlurred: 'RStarBlurred.png',        animation: null, useWildSubstitute: true  },
        { fileName: 'RDice.png',        name: 'RDice',        fileNameBlurred: 'RDiceBlurred.png',        animation: null, useWildSubstitute: true  },
        { fileName: 'RSeven.png',       name: 'RSeven',       fileNameBlurred: 'RSevenBlurred.png',       animation: null, useWildSubstitute: true  },
        { fileName: 'RDiamond.png',     name: 'RDiamond',     fileNameBlurred: 'RDiamondBlurred.png',     animation: null, useWildSubstitute: true  },
        { fileName: 'RTrophy.png',      name: 'RTrophy',      fileNameBlurred: 'RTrophyBlurred.png',      animation: null, useWildSubstitute: true  },
        { fileName: 'RWild.png',        name: 'RWild',        fileNameBlurred: 'RWildBlurred.png',        animation: null, useWildSubstitute: false },
    ],

    reels: [
        {
            symbolImages: ['RCoin','RBell','RCherry','RStar','RApple','RTomato','RDice','RGrape','RSeven','RDiamond','RCherry','RTrophy'],
            offsetX: -233, offsetY: -166, windowImage: 'reel', windowsCount: 3, addSpinTime: 0,
        },
        {
            symbolImages: ['RBell','RCoin','RStar','RCherry','RDiamond','RApple','RTomato','RWild','RSeven','RTrophy','RGrape','RDice','RTrophy','RSeven','RBell','RWild'],
            offsetX: 0, offsetY: -166, windowImage: 'reel', windowsCount: 3, addSpinTime: 100,
        },
        {
            symbolImages: ['RStar','RDiamond','RCherry','RBell','RTrophy','RCoin','RSeven','RApple','RGrape','RTomato','RWild','RDice','RTrophy','RStar','RWild'],
            offsetX: 235, offsetY: -166, windowImage: 'reel', windowsCount: 3, addSpinTime: 200,
        }
    ],

    lines: [
        [1, 1, 1], [2, 2, 2], [0, 0, 0], [2, 1, 0], [0, 1, 2],
        [1, 2, 1], [1, 0, 1], [2, 2, 1], [0, 0, 1], [1, 1, 0],
        [2, 1, 1], [2, 1, 2], [2, 2, 0], [1, 2, 2], [1, 0, 0],
        [0, 1, 0], [0, 2, 1], [2, 0, 1], [0, 2, 0], [0, 0, 2]
    ],

    payLines: [
        { line: ['RCoin',    'RCoin',    'RCoin'   ], pay: 2,   freeSpins: 0 },
        { line: ['RApple',   'RApple',   'RApple'  ], pay: 3,   freeSpins: 0 },
        { line: ['RTomato',  'RTomato',  'RTomato' ], pay: 5,   freeSpins: 0 },
        { line: ['RBell',    'RBell',    'RBell'   ], pay: 8,   freeSpins: 0 },
        { line: ['RGrape',   'RGrape',   'RGrape'  ], pay: 10,  freeSpins: 0 },
        { line: ['RCherry',  'RCherry',  'RCherry' ], pay: 12,  freeSpins: 0 },
        { line: ['RStar',    'RStar',    'RStar'   ], pay: 20,  freeSpins: 0 },
        { line: ['RDice',    'RDice',    'RDice'   ], pay: 30,  freeSpins: 0 },
        { line: ['RSeven',   'RSeven',   'RSeven'  ], pay: 50,  freeSpins: 0 },
        { line: ['RDiamond', 'RDiamond', 'RDiamond'], pay: 100, freeSpins: 0 },
        { line: ['RTrophy',  'RTrophy',  'RTrophy' ], pay: 250, freeSpins: 0 },
        { line: ['RWild',    'RWild',    'RWild'   ], pay: 500, freeSpins: 5 },
    ],

    createSlotGraphic: function(scene) {
        scene.lampsArray = [];
        scene.leftLamp  = new Lamp(scene, -366, -490);
        scene.rightLamp = new Lamp(scene,  366, -490);
        scene.rightLamp.lamp.setScale(-1, 1);
        scene.lampsArray.push(scene.leftLamp);
        scene.lampsArray.push(scene.rightLamp);
        scene.leftLamp.on();
        scene.rightLamp.on();
        scene.slot       = scene.addSpriteLocPos('slot',   0,   -100);
        scene.handle     = scene.addSpriteLocPos('handle', 550, -45).setOrigin(0.5, 1);
        scene.handleBall = scene.addSpriteLocPos('handle_ball', 550, -350);
    },

    createReels: function(scene) {
        var _reels = [];
        for (var ri = 0; ri < this.reels.length; ri++) {
            _reels.push(new Reel(scene, this.reels[ri], ri, this.symbolSizeY, this.reels[ri].windowsCount, false, this.spinTime, this.symbAnimFrameRate));
        }
        return _reels;
    },

    lineButtonsLeftOrder:  [4, 2, 8, 10, 6, 1, 7, 9, 3, 5],
    lineButtonsRightOrder: [14, 20, 12, 18, 16, 11, 17, 13, 15, 19],

    createLineButtons: function(scene) {
        return null;
    },

    createControls: function(scene, slotControls) {
        // Only the SPIN button — all other buttons removed
        slotControls.slotSpinButton = new SpinButton(scene, 'button_spin', 'button_spin_hover', false);
        slotControls.buttons.push(slotControls.slotSpinButton);
        slotControls.slotSpinButton.create(0, 225, 0.5, 0.5);
        slotControls.slotSpinButton.clickEvent.add(scene.handleAnimation, scene);

        slotControls.slotAutoSpinButton = new SceneButton(scene, 'button_spin', 'button_spin_hover', false);
        slotControls.buttons.push(slotControls.slotAutoSpinButton);
        slotControls.slotAutoSpinButton.create(0, 325, 0.5, 0.5);
        slotControls.slotAutoSpinButton.button.setVisible(false);

        slotControls.soundButton = new SceneButton(scene, 'button_soundson', 'button_soundsoff', true);
        slotControls.soundButton.create(760, -570, 0.5, 0.5);
        slotControls.soundButton.addClickEvent(() => { scene.soundController.soundOn(!scene.soundController._soundOn); }, scene);
        slotControls.soundButton.button.setVisible(true);

        // Cover the baked-in LINES / TOTAL BET / BET panel area with a dark rect
        var coverBottom = scene.add.rectangle(scene.centerX, scene.centerY + 120, 760, 60, 0x0d0005, 1).setOrigin(0.5);
        // Cover CREDIT area at top of machine
        var coverTop = scene.add.rectangle(scene.centerX, scene.centerY - 515, 420, 50, 0x0d0005, 1).setOrigin(0.5);

        // Dummy text nodes expected by the engine (kept invisible)
        slotControls.linesCountText    = scene.add.bitmapText(0, -9999, 'gameFont_skewm15', '', 40, 1);
        slotControls.lineBetAmountText = scene.add.bitmapText(0, -9999, 'gameFont_skew15',  '', 40, 1);
        slotControls.totalBetText      = scene.add.bitmapText(0, -9999, 'gameFont', '', 30, 1);
        slotControls.totalBetSumText   = scene.add.bitmapText(0, -9999, 'gameFont', '', 30, 1);
        slotControls.creditText        = scene.add.bitmapText(0, -9999, 'gameFont', '', 30, 1);
        slotControls.creditSumText     = scene.add.bitmapText(0, -9999, 'gameFont', '', 30, 1);

        slotControls.winAmountText = scene.add.bitmapText(scene.centerX, scene.centerY + 75, 'gameFont', '0', 30, 1).setOrigin(0.5);
        slotControls.winAmountText.tint = this.slotTextColor;
        slotControls.winAmountText.setVisible(false);
        slotControls.infoText = scene.add.bitmapText(0, -9999, 'gameFont', '', 30, 1);
        slotControls.infoText.setVisible(false);
        slotControls.freeSpinCountText = scene.add.bitmapText(scene.centerX, scene.centerY + 360, 'gameFont', '9999', 30, 1).setOrigin(0.5);
        slotControls.freeSpinCountText.tint = this.slotTextColor;
        slotControls.freeSpinCountText.setVisible(false);
    },

    createInfoPUHandler: function(popup) {
        function createSymbolPlate3x(popup, parentContainer, panelSpriteName, symbSpriteName, posX, posY, price) {
            let symbContainer = popup.scene.add.container(posX, posY);
            parentContainer.add(symbContainer);
            let symbPlate = popup.scene.add.sprite(0, 0, panelSpriteName).setOrigin(0.5);
            let symbIcon  = popup.scene.add.sprite(-140, 0, symbSpriteName).setOrigin(0.5);
            symbContainer.add(symbPlate);
            symbContainer.add(symbIcon);
            let text3x    = popup.scene.add.bitmapText(-20, 0, 'gameFont', '3x - ', 38, 1).setOrigin(0, 0.5);
            let priceText = popup.scene.add.bitmapText(40,  0, 'gameFont_e', price, 38, 1).setOrigin(0, 0.5);
            symbContainer.add(text3x);
            symbContainer.add(priceText);
        }
        function createSpecSymbolPlate(popup, parentContainer, panelSpriteName, symbSpriteName, posX, posY, info) {
            let symbContainer = popup.scene.add.container(posX, posY);
            parentContainer.add(symbContainer);
            let symbPlate = popup.scene.add.sprite(0, 0, panelSpriteName).setOrigin(0.5);
            let symbIcon  = popup.scene.add.sprite(0, -240, symbSpriteName).setOrigin(0.5);
            symbContainer.add(symbPlate);
            symbContainer.add(symbIcon);
            let textInfo  = popup.scene.add.bitmapText(0, -140, 'gameFont', info, 32, 1).setOrigin(0.5, 0);
            symbContainer.add(textInfo);
        }
        function refreshInfoPu(containers, selectors, index) {
            for (let i = 0; i < containers.length; i++) {
                containers[i].visible = (index === i);
                selectors[i].setTexture((index === i) ? 'navi_dot_active' : 'navi_dot');
            }
        }

        let index = 0, containers = [], selectors = [], offsetY = -100;
        let backGround = popup.scene.add.sprite(0, 0 + offsetY, 'gray_background').setOrigin(0.5).setScale(300);
        backGround.setInteractive();
        backGround.setAlpha(0.05);
        popup.add(backGround);
        let panel = popup.scene.add.sprite(0, 0 + offsetY, 'info_panel').setOrigin(0.5);
        popup.add(panel);

        popup.addButton('exitButton','exit_button','exit_button_hover',false,770,-285+offsetY);
        popup.addButton('nextButton','next_button','next_button_hover',false,175,440+offsetY);
        popup.addButton('prevButton','prev_button','prev_button_hover',false,-175,440+offsetY);
        popup['exitButton'].clickEvent.add(()=>{ popup.scene.soundController.playClip('button_click',false); },popup);
        popup['nextButton'].clickEvent.add(()=>{ popup.scene.soundController.playClip('button_click',false); },popup);
        popup['prevButton'].clickEvent.add(()=>{ popup.scene.soundController.playClip('button_click',false); },popup);
        popup['exitButton'].clickEvent.add(()=>{ popup.scene.guiController.closePopUp(popup); });
        popup['nextButton'].clickEvent.add(()=>{ if(index<containers.length-1)index++;else index=0; refreshInfoPu(containers,selectors,index); },this);
        popup['prevButton'].clickEvent.add(()=>{ if(index>0)index--;else index=containers.length-1; refreshInfoPu(containers,selectors,index); },this);

        // Paylines page
        let linesContainer = popup.scene.add.container(0, 0+offsetY);
        containers.push(linesContainer); popup.add(linesContainer);
        linesContainer.add(popup.scene.add.sprite(0,-305,'paylines_title').setOrigin(0.5));
        linesContainer.add(popup.scene.add.sprite(0,30,'paylines_table').setOrigin(0.5));

        // Lower symbols (coin, apple, tomato, bell, grape, cherry)
        let minorContainer = popup.scene.add.container(0, 0+offsetY);
        containers.push(minorContainer); popup.add(minorContainer);
        minorContainer.add(popup.scene.add.sprite(0,-305,'minor_title').setOrigin(0.5));
        let r1=-130, r2=r1+270, c1=-420, cd=470, c2=c1+cd, c3=c2+cd;
        createSymbolPlate3x(popup,minorContainer,'symbol_plate','RCoin',   c1,r1,2);
        createSymbolPlate3x(popup,minorContainer,'symbol_plate','RApple',  c2,r1,3);
        createSymbolPlate3x(popup,minorContainer,'symbol_plate','RTomato', c3,r1,5);
        createSymbolPlate3x(popup,minorContainer,'symbol_plate','RBell',   c1+0.5*cd,r2,8);
        createSymbolPlate3x(popup,minorContainer,'symbol_plate','RGrape',  c2+0.5*cd,r2,10);
        minorContainer.visible = false;

        // Higher symbols
        let majorContainer = popup.scene.add.container(0, 0+offsetY);
        containers.push(majorContainer); popup.add(majorContainer);
        majorContainer.add(popup.scene.add.sprite(0,-305,'major_title').setOrigin(0.5));
        createSymbolPlate3x(popup,majorContainer,'symbol_plate','RCherry',  c1,r1,12);
        createSymbolPlate3x(popup,majorContainer,'symbol_plate','RStar',    c2,r1,20);
        createSymbolPlate3x(popup,majorContainer,'symbol_plate','RDice',    c3,r1,30);
        createSymbolPlate3x(popup,majorContainer,'symbol_plate','RSeven',   c1+0.5*cd,r2,50);
        createSymbolPlate3x(popup,majorContainer,'symbol_plate','RDiamond', c2+0.5*cd,r2,100);
        majorContainer.visible = false;

        // Special: Trophy + Wild (Royal Replay)
        let specialContainer = popup.scene.add.container(0, 0+offsetY);
        containers.push(specialContainer); popup.add(specialContainer);
        specialContainer.add(popup.scene.add.sprite(0,-305,'special_title').setOrigin(0.5));
        createSymbolPlate3x(popup,specialContainer,'symbol_plate','RTrophy',c1+0.5*cd,r1,250);
        createSpecSymbolPlate(popup,specialContainer,'specsymbol_plate','RWild',c2+0.5*cd,100,'Crown (Wild)\nsubstitutes any\nsymbol & triggers\nROYAL REPLAY\n(5 free spins)');
        specialContainer.visible = false;

        // nav dots
        let dotDist = 50, offsetDots = dotDist*(containers.length-1)/2;
        for (let i = 0; i < containers.length; i++) {
            var selector = popup.scene.add.sprite(-offsetDots+i*dotDist,440+offsetY,'navi_dot').setOrigin(0.5);
            selectors.push(selector); popup.add(selector);
        }
        refreshInfoPu(containers, selectors, index);
    }
};