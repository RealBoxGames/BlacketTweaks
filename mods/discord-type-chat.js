(function DiscordTypeChatFeature() {
    const FEATURE_KEY = "discordTypeChat";
    if (!BlacketTweaks.registerFeature(FEATURE_KEY, "Discord Type Chat", "Adds a Discord-style jump-to-bottom button that appears when you scroll up in chat, with an unread count.", "Chat", "fa-arrow-down")) return;

    const CONFIG = {
        containerSelector: "#chatContainer",
        threshold: 80
    };

    function injectStyles() {
        if (document.getElementById("bp-smart-scroll-style")) return;
        const style = document.createElement("style");
        style.id = "bp-smart-scroll-style";
        style.textContent = `
            #bpJumpBtn {
                position: absolute;
                bottom: 4.2vw;
                left: 50%;
                transform: translateX(-50%) translateY(0.8vw);
                background: #2f2f2f;
                color: #fff;
                font-family: Quicksand, sans-serif;
                font-weight: 700;
                font-size: 0.85vw;
                padding: 0.35vw 0.9vw 0.5vw;
                border-radius: 1vw;
                box-shadow: inset 0 -0.2vw rgba(0,0,0,0.25), 0 0 0.3vw rgba(0,0,0,0.4);
                cursor: pointer;
                user-select: none;
                z-index: 20;
                opacity: 0;
                pointer-events: none;
                transition: opacity .18s, transform .18s;
                display: flex;
                align-items: center;
                gap: 0.4vw;
            }
            #bpJumpBtn.bpShow { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
            #bpJumpBtn:hover { background: #3f3f3f; }
            #bpJumpCount { background: #ff4e4e; border-radius: 1vw; padding: 0 0.4vw; font-size: 0.7vw; }
        `;
        document.head.appendChild(style);
    }

    function setup(cont) {
        if (cont.dataset.bpSmartScrollSetup) return;
        cont.dataset.bpSmartScrollSetup = "true";

        injectStyles();

        const THRESHOLD = CONFIG.threshold;
        let pinned = true, missed = 0, userScrolling = false, holdTop = 0;

        const host = cont.parentElement || document.body;
        if (getComputedStyle(host).position === "static") host.style.position = "relative";

        const btn = document.createElement("div");
        btn.id = "bpJumpBtn";
        btn.innerHTML = `<i class="fas fa-arrow-down"></i><span>Jump to bottom</span><span id="bpJumpCount" style="display:none">0</span>`;
        host.appendChild(btn);

        const atBottom = () => cont.scrollHeight - cont.scrollTop - cont.clientHeight < THRESHOLD;

        const render = () => {
            btn.classList.toggle("bpShow", !pinned);
            const c = btn.querySelector("#bpJumpCount");
            if (missed > 0) { c.style.display = ""; c.textContent = missed > 99 ? "99+" : missed; }
            else c.style.display = "none";
        };

        const goBottom = (smooth) => {
            pinned = true; missed = 0;
            cont.scrollTo({ top: cont.scrollHeight, behavior: smooth ? "smooth" : "auto" });
            render();
        };

        btn.addEventListener("click", () => goBottom(true));

        ["wheel", "touchmove", "keydown"].forEach((evt) =>
            cont.addEventListener(evt, () => {
                userScrolling = true;
                setTimeout(() => { userScrolling = false; }, 150);
            }, { passive: true })
        );

        cont.addEventListener("scroll", () => {
            if (userScrolling) {
                const wasPinned = pinned;
                pinned = atBottom();
                if (pinned && !wasPinned) missed = 0;
                if (!pinned) holdTop = cont.scrollTop;
                render();
            } else if (!pinned && Math.abs(cont.scrollTop - holdTop) > 4) {
                cont.scrollTop = holdTop;
            }
        });

        new MutationObserver((muts) => {
            let added = 0;
            muts.forEach((m) => { added += m.addedNodes.length; });
            if (!added) return;
            if (pinned) cont.scrollTop = cont.scrollHeight;
            else { missed += added; render(); }
        }).observe(cont, { childList: true });

        render();
    }

    BlacketTweaks.util.onExists(CONFIG.containerSelector, setup);
    BlacketTweaks.log("Discord Type Chat feature loaded.");
})();
