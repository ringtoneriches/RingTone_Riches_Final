// Royal Reels - 3x3 Grid Match-3 Game
const slotConfigRoyal = {
    localOffsetX: 0,
    localOffsetY: 0,
    
    // Royal symbols - matching your backend symbols
    symbols: [
        { name: 'crown', fileName: 'crown.png', value: 5000 },
        { name: 'trophy', fileName: 'trophy.png', value: 2500 },
        { name: 'diamond', fileName: 'diamond.png', value: 1000 },
        { name: 'bar', fileName: 'bar.png', value: 750 },
        { name: 'seven', fileName: 'seven.png', value: 500 },
        { name: 'dice', fileName: 'dice.png', value: 250 },
        { name: 'star', fileName: 'star.png', value: 100 },
        { name: 'orange', fileName: 'orange.png', value: 80 },
        { name: 'cherry', fileName: 'cherry.png', value: 50 },
        { name: 'strawberry', fileName: 'strawberry.png', value: 50 },
        { name: 'banana', fileName: 'banana.png', value: 25 },
        { name: 'grape', fileName: 'grape.png', value: 5 },
        { name: 'bell', fileName: 'bell.png', value: 4 },
        { name: 'apple', fileName: 'apple.png', value: 3 },
        { name: 'tomato', fileName: 'tomato.png', value: 2 },
        { name: 'coin', fileName: 'coin.png', value: 1 },
    ],
    
    sprites: [
        { name: 'background', fileName: 'Background_2.png' },
    ],
    fonts: [],
    
    // 3x3 grid (9 cells)
    lines: 1,
    lineColor: 0xFFC300,
    lineBetMaxValue: 10,
    defaultCoins: 1000,
    selectedLines: 1,
    
    useWild: false,
    wild: null,
    useWildInFirstPosition: false,
    useLineBetMultiplier: false,
    useLineBetFreeSpinMultiplier: false,
    useScatter: false,
    scatter: null,
    
    winShowTime: 2000,
    winMessageTime: 1500,
    frameWidth: 120,
    frameHeight: 120,
    
    // Single payline that matches all 9 positions (3x3 grid)
    payLines: [
        { 
            line: [0, 1, 2, 3, 4, 5, 6, 7, 8], 
            pay: {
                'crown': 5000, 'trophy': 2500, 'diamond': 1000,
                'bar': 750, 'seven': 500, 'dice': 250,
                'star': 100, 'orange': 80, 'cherry': 50,
                'strawberry': 50, 'banana': 25, 'grape': 5,
                'bell': 4, 'apple': 3, 'tomato': 2, 'coin': 1
            }, 
            freeSpins: 0 
        }
    ],
    
    // Create Royal Reels 3x3 grid
    createSlotGraphic: function(scene) {
        // Background
        const bg = scene.add.graphics();
        bg.fillStyle(0x1a1a1a, 0.95);
        bg.fillRoundedRect(-450, -300, 900, 600, 20);
        bg.setPosition(scene.centerX, scene.centerY);
        
        // Gold border
        const border = scene.add.graphics();
        border.lineStyle(3, 0xFFC300, 0.4);
        border.strokeRoundedRect(-390, -240, 780, 480, 15);
        border.setPosition(scene.centerX, scene.centerY);
        
        // Title
        const title = scene.add.bitmapText(scene.centerX, scene.centerY - 270, 'gameFont', 'ROYAL REELS', 50);
        if (title) title.setOrigin(0.5);
    },
    
    // Create 3x3 grid of reels (9 positions)
    createReels: function(scene) {
        const reels = [];
        const positions = [
            [-260, -160], [0, -160], [260, -160],
            [-260, 0], [0, 0], [260, 0],
            [-260, 160], [0, 160], [260, 160]
        ];
        
        positions.forEach((pos, index) => {
            const reel = new Reel(scene, index);
            reel.setPosition(scene.centerX + pos[0], scene.centerY + pos[1]);
            reels.push(reel);
        });
        
        return reels;
    },
    
    createControls: function(scene, controls) {
        controls.enableControls(true);
    },
    
    createLineButtons: function(scene) {
        return null;
    },
    
    reels_simulate: null,
    maxAutoSpins: 100,
    winSpinLevelProgress: 1,
    loseSpinLevelProgress: 0.5,
    useLineBetProgressMultiplier: false,
};