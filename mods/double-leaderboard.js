(function DoubleLeaderboardFeature() {
    if (!BlacketTweaks.registerFeature("doubleLeaderboard", "Double Leaderboard", "Shows the Tokens and EXP leaderboards side by side — no need to switch.", "Leaderboard", "fa-trophy")) return;

    const CONFIG = {
        headerRightSelector: ".styles__containerHeaderRight___3xghM-camelCase",
        topStatsClass: "styles__topStats___3qffP-camelCase",
        cardSelector: ".styles__statsContainer___QnrRB-camelCase"
    };

    function injectStyles() {
        if (document.getElementById("bp-double-lb-style")) return;
        const style = document.createElement("style");
        style.id = "bp-double-lb-style";
        style.textContent = `
            .bp-lbBoard {
                box-sizing: border-box;
                float: left;
                width: 50%;
            }
            .bp-lbBoard:first-of-type { padding-right: 0.5vw; }
            .bp-lbBoard:last-of-type { padding-left: 0.5vw; }
            .bp-lbBoard::before {
                display: block;
                text-align: center;
                font-family: Quicksand, sans-serif;
                font-weight: 700;
                color: #fff;
                opacity: 0.75;
                font-size: 0.95vw;
                margin-bottom: 0.3vw;
            }
            .bp-lbBoardTokens::before { content: "Tokens"; }
            .bp-lbBoardExp::before { content: "EXP"; }
            .bp-lbClear { clear: both; }
        `;
        document.head.appendChild(style);
    }

    function setup(headerRight) {
        const card = headerRight.closest(CONFIG.cardSelector);
        if (!card || card.dataset.bpDoubleLbSetup) return;

        const boardWrappers = Array.from(card.children).filter((el) =>
            el.tagName === "DIV" &&
            !el.classList.contains("styles__containerHeader___3xghM-camelCase") &&
            !el.classList.contains("styles__containerHeaderRight___3xghM-camelCase") &&
            el.querySelector(`.${CONFIG.topStatsClass}`)
        );
        if (boardWrappers.length < 2) return;
        card.dataset.bpDoubleLbSetup = "true";

        injectStyles();

        headerRight.style.display = "none";

        boardWrappers[0].classList.add("bp-lbBoard", "bp-lbBoardTokens");
        boardWrappers[0].style.display = "block";
        boardWrappers[1].classList.add("bp-lbBoard", "bp-lbBoardExp");
        boardWrappers[1].style.display = "block";

        const clear = document.createElement("div");
        clear.className = "bp-lbClear";
        card.appendChild(clear);
    }

    BlacketTweaks.util.onExists(CONFIG.headerRightSelector, setup);
    BlacketTweaks.log("Double Leaderboard feature loaded.");
})();
