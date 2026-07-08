// 3x1 1 line red slot 
var slotConfigRed3x1 = {
    slotTextColor : 0xF42D3B,   // text color

    symbolSizeY: 166,           // 164 sizeY
    spinTime: 2000,             // time, milliseconds
    winShowTime: 3000,          // time, milliseconds
    winMessageTime: 2000,

    symbAnimFrameRate: 28,
    frameWidth : 164,
    frameHeight : 164,

    lineColor : 0xFFEA31,       // line color

    lineBetMaxValue: 20,
    useWild: true,
    wild: 'Wild',
    useScatter: false,
    scatter: 'Scatter',
    selectedLines: 'all',       //'all' / 'first'

    useWildInFirstPosition: false,
    useLineBetMultiplier: true,
    useLineBetFreeSpinMultiplier: false,
    defaultCoins: 1000,

    localOffsetX: 0,
    localOffsetY: 100,
    
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
        }
    ],

    sprites: [
        // common sprites 
        {
            fileName: 'SlotMachine_3x1.png',
            name: 'slot'
        },
        {
            fileName: 'SlotMachineHandle.png',
            name: 'handle'
        },
        {
            fileName: 'Reel3x1.png',
            name: 'reel'
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
            fileName: 'red/ButtonBetBig.png',
            name: 'button_bet'
        },
        {
            fileName: 'red/ButtonBetBigHover.png',
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
            fileName: 'red/ButtonSpin.png',
            name: 'button_spin'
        },
        {
            fileName: 'red/ButtonSpinHover.png',
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
    ],

    symbols:
    [
        {
            fileName: 'A.png',          
            name: 'A',                   
            fileNameBlurred: 'ABlurred.png', 
            animation: 'ASheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'Cherry.png',          
            name: 'Cherry',                   
            fileNameBlurred: 'CherryBlurred.png', 
            animation: 'CherrySheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'Grape.png',          
            name: 'Grape',                   
            fileNameBlurred: 'GrapeBlurred.png', 
            animation: 'GrapeSheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'J.png',          
            name: 'J',                   
            fileNameBlurred: 'JBlurred.png', 
            animation: 'JSheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'K.png',          
            name: 'K',                   
            fileNameBlurred: 'KBlurred.png', 
            animation: 'KSheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'Lemon.png',          
            name: 'Lemon',                   
            fileNameBlurred: 'LemonBlurred.png', 
            animation: 'LemonSheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'Melon.png',          
            name: 'Melon',                   
            fileNameBlurred: 'MelonBlurred.png', 
            animation: 'MelonSheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'Orrange.png',          
            name: 'Orrange',                   
            fileNameBlurred: 'OrrangeBlurred.png', 
            animation: 'OrrangeSheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'Q.png',          
            name: 'Q',                   
            fileNameBlurred: 'QBlurred.png', 
            animation: 'QSheet.png',
            useWildSubstitute: true
        },
        {
            fileName: 'Wild.png',          
            name: 'Wild',                   
            fileNameBlurred: 'WildBlurred.png', 
            animation: 'WildSheet.png',
            useWildSubstitute: false
        }
    ],

    reels:[
        {
            symbolImages: ['A','Grape','Orrange','Melon' ,'Cherry', 'J', 'Lemon', 'K', 'Orrange', 'Q', 'Lemon', 'Melon'], // 12
            offsetX: -230,
            offsetY: -172,
            windowImage: 'reel',
            windowsCount: 1,    
            addSpinTime: 0, // additional spin time for reel milliseconds   
        },
        {
            symbolImages: ['Grape','A','J','Q', 'Orrange', 'Cherry', 'K', 'Wild', 'Orrange', 'A', 'Melon', 'Lemon', 'A', 'Melon', 'Lemon', 'Wild'], //16
            offsetX: 0,
            offsetY: -172,
            windowImage: 'reel',
            windowsCount: 1,
            addSpinTime: 100, // additional spin time for reel milliseconds   
        },
        {
            symbolImages: ['J','Lemon','Q','Grape','K','A', 'Orrange', 'Melon', 'Cherry', 'A', 'Wild', 'Orrange', 'A', 'Lemon', 'Wild'], // 15
            offsetX: 230,
            offsetY: -172,
            windowImage: 'reel',
            windowsCount: 1,
            addSpinTime: 200, // additional spin time for reel milliseconds     
        }
    ],

    // reels_simulate: [4, 7, 8], // -1 - avoid reel simulate

    payLines:[
        {
            line: ['Cherry', 'Cherry', 'Cherry'],
            pay: 3,  
            freeSpins: 0
        },
        {
            line: ['Grape', 'Grape', 'Grape'],
            pay: 5,
            freeSpins: 0
        },
        {
            line: ['Lemon', 'Lemon', 'Lemon'],
            pay: 8,
            freeSpins: 0
        },
        {
            line: ['Melon', 'Melon', 'Melon'],
            pay: 10,
            freeSpins: 0
        },
        {
            line: ['Orrange', 'Orrange', 'Orrange'],
            pay: 12,
            freeSpins: 0
        },
        {
            line: ['J', 'J', 'J'],
            pay: 20,
            freeSpins: 0
        },
        {
            line: ['Q', 'Q', 'Q'],
            pay: 25,
            freeSpins: 0
        },
        {
            line: ['K', 'K', 'K'],
            pay: 30,
            freeSpins: 0
        },
        {
            line: ['A', 'A', 'A'],
            pay: 40,
            freeSpins: 0
        },    
    ],
    
    createSlotGraphic: function(scene){
        // scene.background =  scene.addSpriteLocPos('background', 0, 0); //?.setScale(1.5);
        // scene.background.depth = -5;
        scene.lampsArray = []; 
        scene.leftLamp = new Lamp (scene, -366, -395);
        scene.rightLamp = new Lamp (scene, 366, -395);
        scene.rightLamp.lamp.setScale(-1, 1); // mirror right lamp
        scene.lampsArray.push(scene.leftLamp);
        scene.lampsArray.push(scene.rightLamp);
        scene.leftLamp.on();
        scene.rightLamp.on();
        scene.slot =  scene.addSpriteLocPos('slot', 0, -100); 
        scene.handle =  scene.addSpriteLocPos('handle', 550, -45).setOrigin(0.5, 1); 
        scene.handleBall =  scene.addSpriteLocPos('handle_ball', 550, -350);
    },

    createReels: function(scene) {
        var _reels = [];
        for(var ri = 0; ri < this.reels.length; ri++)
        {
            _reels.push(new Reel(scene, this.reels[ri], ri, this.symbolSizeY, this.reels[ri].windowsCount, false, this.spinTime, this.symbAnimFrameRate));
        }
        return _reels;
    },

    createControls: function(scene, slotControls) {
        // lines loop button
        // slotControls.slotLinesLoopButton = new SceneButton(scene, 'button_lines', 'button_lines_hover', false);   
        // slotControls.buttons.push(slotControls.slotLinesLoopButton);
        // slotControls.slotLinesLoopButton.create(-360, 225, 0.5, 0.5);
        // slotControls.slotLinesLoopButton.addClickEvent(slotControls.linesLoop_Click, slotControls);

        // linebet loop button
        slotControls.slotLineBetLoopButton = new SceneButton(scene, 'button_bet','button_bet_hover', false);   
        slotControls.buttons.push(slotControls.slotLineBetLoopButton);
        slotControls.slotLineBetLoopButton.create(310, 130, 0.5, 0.5);
        slotControls.slotLineBetLoopButton.addClickEvent(slotControls.lineBetLoop_Click, slotControls);

        // info button
        slotControls.slotInfoButton = new SceneButton(scene, 'button_info', 'button_info_hover', false);   
        slotControls.buttons.push(slotControls.slotInfoButton);
        slotControls.slotInfoButton.create(-310, 130, 0.5, 0.5);
        slotControls.slotInfoButton.addClickEvent(()=>{
            var pu = scene.guiController.showPopUp(this.createInfoPUHandler);
            scene.soundController.playClip('button_click');
        }, this);   

        // maxbet button
        // slotControls.slotMaxBetButton = new SceneButton(scene, 'button_maxbet', 'button_maxbet_hover', false);   
        // slotControls.buttons.push(slotControls.slotMaxBetButton);
        // slotControls.slotMaxBetButton.create(198, 130, 0.5, 0.5);
        // slotControls.slotMaxBetButton.addClickEvent(slotControls.maxBet_Click, slotControls);     
         
        // spin button
        slotControls.slotSpinButton = new SpinButton(scene, 'button_spin', 'button_spin_hover', false);   
        slotControls.buttons.push(slotControls.slotSpinButton);
        slotControls.slotSpinButton.create(0, 130, 0.5, 0.5);    
        slotControls.slotSpinButton.clickEvent.add(scene.handleAnimation, scene);  

        // autoSpin button
        slotControls.slotAutoSpinButton = new SceneButton(scene, 'button_spin', 'button_spin_hover', false); 
        slotControls.buttons.push(slotControls.slotAutoSpinButton);
        slotControls.slotAutoSpinButton.create(0, 325, 0.5, 0.5);
        slotControls.slotAutoSpinButton.button.setVisible(false);   
        
        // settings button - not used
        slotControls.settingsButton = new SceneButton(scene, 'button_settings', 'button_settings_hover', false);   
        slotControls.buttons.push(slotControls.settingsButton);
        slotControls.settingsButton.create(760, -570, 0.5, 0.5);
        slotControls.settingsButton.addClickEvent(()=>{ 
            console.log('settings click');
            scene.soundController.playClip('button_click');}, this);
        slotControls.settingsButton.button.setVisible(false);  

        // sound button
        slotControls.soundButton = new SceneButton(scene, 'button_soundson', 'button_soundsoff', true);   
        // slotControls.buttons.push(slotControls.soundButton);
        slotControls.soundButton.create(760, -570, 0.5, 0.5);
        slotControls.soundButton.addClickEvent(()=>{scene.soundController.soundOn(!scene.soundController._soundOn);}, scene);
        slotControls.soundButton.button.setVisible(true); 
 
        // adding the text fields
        // slotControls.linesCountText = scene.add.bitmapText(scene.centerX - 360, scene.centerY + 200, 'gameFont_skewm15', slotControls.selectedLinesCount, 40, 1).setOrigin(0.5);
        // slotControls.slotLinesLoopButton.pointerDownEvent.add(()=>{slotControls.linesCountText.setPosition(slotControls.linesCountText.x, scene.centerY + 212);});
        // slotControls.slotLinesLoopButton.pointerUpEvent.add(()=>{slotControls.linesCountText.setPosition(slotControls.linesCountText.x, scene.centerY + 200);});
 
        slotControls.lineBetAmountText = scene.add.bitmapText(scene.centerX + 310, scene.centerY + 105, 'gameFont_skew15', slotControls.lineBet, 40, 1).setOrigin(0.5);
        slotControls.slotLineBetLoopButton.pointerDownEvent.add(()=>{slotControls.lineBetAmountText.setPosition(slotControls.lineBetAmountText.x, scene.centerY + 117);});
        slotControls.slotLineBetLoopButton.pointerUpEvent.add(()=>{slotControls.lineBetAmountText.setPosition(slotControls.lineBetAmountText.x, scene.centerY + 105);});
 
        slotControls.totalBetText = scene.add.bitmapText(scene.centerX - 120, scene.centerY + 20, 'gameFont', 'TOTAL BET', 30, 1).setOrigin(0, 0.5);
        slotControls.totalBetText.tint = this.slotTextColor;
  
        slotControls.totalBetSumText = scene.add.bitmapText(scene.centerX + 120, scene.centerY + 20, 'gameFont', slotControls.getTotalBet(), 30, 1).setOrigin(1, 0.5);
        slotControls.totalBetSumText.tint = this.slotTextColor;
 
        slotControls.creditText = scene.add.bitmapText(scene.centerX - 80, scene.centerY - 420, 'gameFont', 'CREDIT', 30, 1).setOrigin(0.5);
        slotControls.creditText.tint = this.slotTextColor;

        slotControls.creditSumText = scene.add.bitmapText(scene.centerX + 120, scene.centerY - 420, 'gameFont', '$' + scene.slotPlayer.coins, 30, 1).setOrigin(1, 0.5);
        slotControls.creditSumText.tint = this.slotTextColor;
         
        slotControls.winAmountText = scene.add.bitmapText(scene.centerX, scene.centerY - 50, 'gameFont', '0', 30, 1).setOrigin(0.5);
        slotControls.winAmountText.tint = this.slotTextColor;
        slotControls.winAmountText.setVisible(false);
 
        slotControls.infoText = scene.add.bitmapText(scene.centerX, scene.centerY + 320, 'gameFont', 'info', 30, 1).setOrigin(0.5);
        slotControls.infoText.tint = this.slotTextColor;
        slotControls.infoText.setVisible(false);
 
        slotControls.freeSpinCountText = scene.add.bitmapText(scene.centerX, scene.centerY + 360, 'gameFont', '9999', 30, 1).setOrigin(0.5);
        slotControls.freeSpinCountText.tint = this.slotTextColor;
        slotControls.freeSpinCountText.setVisible(false);
    },

    createInfoPUHandler: function(popup)
    {
        function createSymbolPlate3x (popup, parentContainer, panelSpriteName, symbSpriteName, posX, posY, price)
        {
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

        function createSpecSymbolPlate(popup, parentContainer, panelSpriteName, symbSpriteName, posX, posY, info)
        {
            let symbContainer = popup.scene.add.container(posX, posY);
            parentContainer.add(symbContainer);
            let symbPlate = popup.scene.add.sprite(0, 0, panelSpriteName).setOrigin(0.5);
            let symbIcon = popup.scene.add.sprite(0, -240, symbSpriteName).setOrigin(0.5);
            symbContainer.add(symbPlate);
            symbContainer.add(symbIcon);
    
            let textInfo = popup.scene.add.bitmapText(0, -140, 'gameFont', info, 32, 1).setOrigin(0.5, 0);
            symbContainer.add(textInfo);
        };
    
        function refreshInfoPu (containers, selectors, index)
        {
            for(let i = 0; i < containers.length; i++)
            {
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
        backGround.setInteractive(); // block bottom controls
        backGround.setAlpha(0.05);
        popup.add(backGround);
        let panel = popup.scene.add.sprite(0, 0 + offsetY, 'info_panel').setOrigin(0.5);
        popup.add(panel);

        popup.addButton('exitButton','exit_button', 'exit_button_hover', false, 770, -285 + offsetY);
        popup.addButton('nextButton','next_button', 'next_button_hover', false, 150, 440 + offsetY);
        popup.addButton('prevButton','prev_button', 'prev_button_hover', false, -150, 440 + offsetY);
        popup['exitButton'].clickEvent.add(()=>{popup.scene.soundController.playClip('button_click', false);}, popup);
        popup['nextButton'].clickEvent.add(()=>{popup.scene.soundController.playClip('button_click', false);}, popup);
        popup['prevButton'].clickEvent.add(()=>{popup.scene.soundController.playClip('button_click', false);}, popup);

        popup['exitButton'].clickEvent.add(()=>{popup.scene.guiController.closePopUp(popup);});

        popup['nextButton'].clickEvent.add(()=>
        {
            if(index < containers.length - 1) index++;
            else index = 0;
            refreshInfoPu(containers, selectors, index);
        }, this);

        popup['prevButton'].clickEvent.add(()=>
        {
            if(index > 0) index--;
            else index = containers.length - 1;
            refreshInfoPu(containers, selectors, index);
        }, this);

        // create minor symbols panel
        let minorContainer = popup.scene.add.container(0, 0 + offsetY);
        containers.push(minorContainer);
        popup.add(minorContainer);
        let minorTitle =  popup.scene.add.sprite(0, -305, 'minor_title').setOrigin(0.5);
        minorContainer.add(minorTitle);

        let row1Y = -130;
        let row2Y = row1Y + 270;
        let col1X = -420;
        let colDist = 470;
        let col2X = col1X + colDist;
        let col3X = col2X + colDist;

        // minor row 1
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', 'Cherry', col1X, row1Y, 3);
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', 'Grape', col2X, row1Y, 5);
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', 'Lemon', col3X, row1Y, 8);

        // minor row 2
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', 'Melon', col1X + 0.5 * colDist, row2Y, 10);
        createSymbolPlate3x(popup, minorContainer, 'symbol_plate', 'Orrange', col2X + 0.5 * colDist, row2Y, 12);
        // createSymbolPlate3x(popup, minorContainer, 'symbol_plate', '2Bars', col3X, row2Y, 100);
        minorContainer.visible = false;

        // create major symbols panel
        let majorContainer = popup.scene.add.container(0, 0 + offsetY);
        containers.push(majorContainer);
        popup.add(majorContainer);
        let majorTitle =  popup.scene.add.sprite(0, -305, 'major_title').setOrigin(0.5);
        majorContainer.add(majorTitle);

        // major row 1
        createSymbolPlate3x(popup, majorContainer , 'symbol_plate', 'J', col1X , row1Y, 20);
        createSymbolPlate3x(popup, majorContainer , 'symbol_plate', 'Q', col2X , row1Y, 25);
        createSymbolPlate3x(popup, majorContainer , 'symbol_plate', 'K', col3X , row1Y, 30);

        // major row 2
       // createSymbolPlate3x(popup, majorContainer , 'symbol_plate', 'J', col1X , row2Y, 100);
        createSymbolPlate3x(popup, majorContainer , 'symbol_plate', 'A', col2X, row2Y, 40);
       // createSymbolPlate3x(popup, majorContainer , 'symbol_plate', 'A', col3X, row2Y, 100);
        majorContainer.visible = false;

        // create special symbols panel
        let specialContainer = popup.scene.add.container(0, 0 + offsetY);
        containers.push(specialContainer);
        popup.add(specialContainer);
        let specialTitle =  popup.scene.add.sprite(0, -305, 'special_title').setOrigin(0.5);
        specialContainer.add(specialTitle);
    
        // special row 1
        createSpecSymbolPlate(popup, specialContainer , 'specsymbol_plate', 'Wild', 0 , 100, 'wild \n can be used with \n any symbols on \n the reels to create \n winning combinations \n (exclude first reel)');
      // createSpecSymbolPlate(popup, specialContainer , 'specsymbol_plate', 'Scatter', 235 , 100, 'scatter \n symbol info \n symbol info');
        specialContainer.visible = false;

        // create navi selectors
        let dotDist = 50;
        let offsetDots = dotDist * (containers.length - 1) / 2;
        for(let i = 0; i < containers.length; i++)
        {
            var selector = popup.scene.add.sprite(-offsetDots + i * dotDist, 440 + offsetY, 'navi_dot').setOrigin(0.5);
            selectors.push(selector);
            popup.add(selector);
        }
        refreshInfoPu(containers, selectors, index);
    }
}

