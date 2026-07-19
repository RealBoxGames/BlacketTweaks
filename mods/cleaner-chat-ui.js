(function CleanerChatUIFeature() {
    const FEATURE_KEY = "cleanerChatUI";
    if (!BlacketTweaks.registerFeature(FEATURE_KEY, "Cleaner Chat UI", "Rounds and cleans up the chat input bar, buttons, and emoji picker.", "Chat", "fa-comment-alt")) return;

    function injectStyles() {
        if (document.getElementById("bp-cleaner-chat-style")) return;
        const style = document.createElement("style");
        style.id = "bp-cleaner-chat-style";
        style.textContent = `
            .styles__chatInputContainer___gkR4A-camelCase {
                border-radius: 1vw !important;
                overflow: hidden !important;
                margin: 0 0.5vw 0.5vw 0.5vw !important;
                width: calc(100% - 1vw) !important;
                box-sizing: border-box !important;
                border: 0.156vw solid rgba(0,0,0,0.35) !important;
                align-items: center !important;
                padding: 0.15vw !important;
            }
            .styles__chatInputBox___fvMA4-camelCase,
            .styles__chatEditBox___29QAm-camelCase {
                border-radius: 0.9vw !important;
                padding: 0 0.5vw !important;
            }
            .styles__chatEmojiButton___8RFa2-camelCase,
            .styles__chatUploadButton___g39Ac-camelCase {
                border-radius: 0.8vw !important;
                margin: 0 0.15vw !important;
                transition: 0.15s;
            }
            .styles__chatEmojiButton___8RFa2-camelCase:hover,
            .styles__chatUploadButton___g39Ac-camelCase:hover {
                transform: scale(0.92);
            }
            .styles__chatEmojiPickerContainer___KR4aN-camelCase {
                border-radius: 1vw !important;
                overflow: hidden !important;
                right: 0.5vw !important;
                bottom: 3.4vw !important;
            }
            .styles__chatEmojiPickerHeader___FK4Ac-camelCase {
                border-radius: 1vw 1vw 0 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    injectStyles();
    BlacketTweaks.log("Cleaner Chat UI feature loaded.");
})();
