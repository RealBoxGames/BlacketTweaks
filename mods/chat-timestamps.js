(function ChatTimestampsFeature() {
    const FEATURE_KEY = "chatTimestamps";
    if (!BlacketTweaks.registerFeature(FEATURE_KEY, "Chat Timestamps", "Shows a relative timestamp on hover for each chat message.", "Chat", "fa-clock")) return;

    const CONFIG = {
        containerSelector: "#chatContainer",
        messageClass: "styles__chatMessage___2Z1ZU-camelCase"
    };

    function injectStyles() {
        if (document.getElementById("bp-chat-stamps-style")) return;
        const style = document.createElement("style");
        style.id = "bp-chat-stamps-style";
        style.textContent = `
            .${CONFIG.messageClass} { position: relative; }
            .bpStamp {
                position: absolute;
                right: 0.6vw;
                top: 50%;
                transform: translateY(-50%);
                font-family: Quicksand, sans-serif;
                font-size: 0.62vw;
                font-weight: 600;
                color: rgba(255,255,255,0.5);
                background: rgba(0,0,0,0.35);
                padding: 0.05vw 0.35vw;
                border-radius: 0.6vw;
                white-space: nowrap;
                pointer-events: none;
                user-select: none;
                opacity: 0;
                transition: opacity .12s;
                -webkit-text-fill-color: rgba(255,255,255,0.5);
            }
            .${CONFIG.messageClass}:hover > .bpStamp { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    const times = new Map();

    function fmt(d) {
        const s = (Date.now() - d) / 1000;
        const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        if (s < 60) return "just now";
        if (s < 3600) return Math.floor(s / 60) + "m · " + t;
        if (s < 86400) return Math.floor(s / 3600) + "h · " + t;
        return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + t;
    }

    function tag(el, date) {
        if (el.querySelector(":scope > .bpStamp")) return;
        const s = document.createElement("text");
        s.className = "bpStamp";
        s.textContent = date ? fmt(date) : "older";
        el.appendChild(s);
        if (date) times.set(s, date);
    }

    function setup(cont) {
        if (cont.dataset.bpStampsSetup) return;
        cont.dataset.bpStampsSetup = "true";

        injectStyles();

        cont.querySelectorAll(`.${CONFIG.messageClass}`).forEach((el) => tag(el, null));

        new MutationObserver((muts) =>
            muts.forEach((mu) => mu.addedNodes.forEach((n) => {
                if (n.nodeType !== 1) return;
                const now = new Date();
                if (n.matches && n.matches(`.${CONFIG.messageClass}`)) tag(n, now);
                n.querySelectorAll && n.querySelectorAll(`.${CONFIG.messageClass}`).forEach((e) => tag(e, now));
            }))
        ).observe(cont, { childList: true, subtree: true });

        setInterval(() => {
            times.forEach((d, s) => { s.isConnected ? (s.textContent = fmt(d)) : times.delete(s); });
        }, 30000);
    }

    BlacketTweaks.util.onExists(CONFIG.containerSelector, setup);
    BlacketTweaks.log("Chat Timestamps feature loaded.");
})();
