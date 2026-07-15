// --------------- MESSAGES -------------------

// message with yes, no, close buttons
function createGameMessagePUHandlerYNC(popup) {
    // add background and panel
    let backGround = popup.scene.add.sprite(0, 0, 'gray_background').setOrigin(0.5).setScale(300);
    backGround.setInteractive(); // block bottom controls
    popup.add(backGround);
    let panel = popup.scene.add.sprite(0, 0, 'message_panel').setOrigin(0.5);
    popup.add(panel);

    // add caption
    popup.captionText = popup.scene.add.bitmapText(0, -100, 'gameFont', 'Caption', 38, 1).setOrigin(0.5);
    popup.captionText.tint = 0xFFFFFF;
    popup.add(popup.captionText);

    // add message
    popup.messageText = popup.scene.add.bitmapText(0, -30, 'gameFont', 'Message', 28, 1).setOrigin(0.5);
    popup.messageText.tint = 0xFFFFFF;
    popup.add(popup.messageText);

    // add buttons
    popup.addButton('okButton', 'middle_button', 'middle_button_hover', false, -120, 230);
    popup.addButton('noButton', 'middle_button', 'middle_button_hover', false, 120, 230);
    popup.addButton('exitButton', 'exit_button', 'exit_button_hover', false, 255, -125);
    popup['okButton'].clickEvent.add(() => { popup.scene.soundController.playClip('button_click', false); }, popup);
    popup['noButton'].clickEvent.add(() => { popup.scene.soundController.playClip('button_click', false); }, popup);
    popup['exitButton'].clickEvent.add(() => { popup.scene.soundController.playClip('button_click', false); }, popup);

    // add button text
    popup.okText = popup.scene.add.bitmapText(-120, 227, 'gameFont', 'OK', 38, 1).setOrigin(0.5);
    popup.okText.tint = 0xFFFFFF;
    popup.add(popup.okText);

    popup.noText = popup.scene.add.bitmapText(120, 227, 'gameFont', 'NO', 38, 1).setOrigin(0.5);
    popup.noText.tint = 0xFFFFFF;
    popup.add(popup.noText);
}

// message with close button
function createGameMessagePUHandler(popup) {
    // add background and panel
    // console.log(positive);
    let backGround = popup.scene.add.sprite(0, 0, 'gray_background').setOrigin(0.5).setScale(300);
    backGround.setInteractive(); // block bottom controls
    popup.add(backGround);
    let panel = popup.scene.add.sprite(0, -130, 'message_panel').setOrigin(0.5);
    popup.add(panel);

    // add caption
    popup.captionText = popup.scene.add.text(0, -100, 'Caption', {
        fontFamily: 'Arial',
        fontSize: '38px',
        fontStyle: 'bold',
        fontWeight: '700',
        color: '#FFFFFF',
        align: 'center'
    }).setOrigin(0.5);


    popup.add(popup.captionText);

    // add message
    popup.messageText = popup.scene.add.bitmapText(0, -30, 'gameFont', 'Message', 28, 1).setOrigin(0.5);
    popup.messageText.tint = 0xFFFFFF;
    popup.add(popup.messageText);

    // add buttons
    popup.addButton('exitButton', 'exit_button', 'exit_button_hover', false, 255, -255);
    popup['exitButton'].clickEvent.add(() => { popup.scene.soundController.playClip('button_click', false); }, popup);
} function createGameNegativeMessagePUHandler(popup) {
    // add background and panel
    // console.log(positive);
    let backGround = popup.scene.add.sprite(0, 0, 'gray_background').setOrigin(0.5).setScale(300);
    backGround.setInteractive(); // block bottom controls
    popup.add(backGround);
    let panel = popup.scene.add.sprite(0, -130, 'negative_message_panel').setOrigin(0.5);
    popup.add(panel);

    // add caption
    popup.captionText = popup.scene.add.bitmapText(0, -100, 'gameFont', 'Caption', 38, 1).setOrigin(0.5);
    popup.captionText.tint = 0xFFFFFF;
    popup.add(popup.captionText);

    // add message
    popup.messageText = popup.scene.add.bitmapText(0, -30, 'gameFont', 'Message', 28, 1).setOrigin(0.5);
    popup.messageText.tint = 0xFFFFFF;
    popup.add(popup.messageText);

    // add buttons
    popup.addButton('exitButton', 'exit_button', 'exit_button_hover', false, 255, -255);
    popup['exitButton'].clickEvent.add(() => { popup.scene.soundController.playClip('button_click', false); }, popup);
}