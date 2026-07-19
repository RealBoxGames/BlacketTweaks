"use strict";

const BlacketTweaks = window.BlacketTweaks = window.BlacketTweaks || {
    version: "1.0.0",
    features: {},
    log: (...args) => console.log("%c[BlacketTweaks]", "color:#8a5cff;font-weight:bold;", ...args),
    warn: (...args) => console.warn("%c[BlacketTweaks]", "color:#ff9800;font-weight:bold;", ...args)
};

function waitFor(check, { interval = 100, timeout = 15000 } = {}) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
            let result;
            try { result = check(); } catch (e) { result = undefined; }
            if (result) return resolve(result);
            if (Date.now() - start > timeout) return reject(new Error("waitFor timed out"));
            setTimeout(tick, interval);
        };
        tick();
    });
}

function onExists(selector, fn, root = document.body) {
    const seen = new WeakSet();
    const tryRun = (el) => {
        if (seen.has(el)) return;
        seen.add(el);
        try { fn(el); } catch (e) { BlacketTweaks.warn(`onExists handler failed for "${selector}"`, e); }
    };
    document.querySelectorAll(selector).forEach(tryRun);
    const observer = new MutationObserver(() => {
        document.querySelectorAll(selector).forEach(tryRun);
    });
    observer.observe(root, { childList: true, subtree: true });
    return observer;
}

let locationChangeListeners = null;
function onLocationChange(callback) {
    if (!locationChangeListeners) {
        locationChangeListeners = [];
        let lastHref = location.href;
        const check = () => {
            if (location.href === lastHref) return;
            lastHref = location.href;
            locationChangeListeners.forEach((cb) => {
                try { cb(); } catch (e) { BlacketTweaks.warn("onLocationChange listener failed", e); }
            });
        };
        ["pushState", "replaceState"].forEach((method) => {
            const original = history[method];
            history[method] = function (...args) {
                const result = original.apply(this, args);
                check();
                return result;
            };
        });
        window.addEventListener("popstate", check);

        setInterval(check, 500);
    }
    locationChangeListeners.push(callback);
}

let viewedUser = null;
let viewedUserListeners = [];
function onViewedUserChange(callback) {
    viewedUserListeners.push(callback);
    if (viewedUser) callback(viewedUser);
}
function wrapSetUser(fn) {
    return function (user) {
        viewedUser = user;
        const result = fn.apply(this, arguments);
        viewedUserListeners.forEach((cb) => {
            try { cb(user); } catch (e) { BlacketTweaks.warn("onViewedUserChange listener failed", e); }
        });
        return result;
    };
}

function installSetUserHook() {
    if (!window.blacket) return false;
    let internal = window.blacket.setUser;
    if (typeof internal === "function") internal = wrapSetUser(internal);
    Object.defineProperty(window.blacket, "setUser", {
        configurable: true,
        get() { return internal; },
        set(fn) { internal = wrapSetUser(fn); }
    });
    return true;
}

if (!installSetUserHook()) {
    waitFor(() => window.blacket).then(() => installSetUserHook()).catch(() => {
        BlacketTweaks.warn("window.blacket never appeared — profile-aware features will fall back to URL/DOM guessing.");
    });
}

function openModal(bodyHtml) {
    const modal = document.createElement("div");
    modal.className = "arts__modal___VpEAD-camelCase";
    modal.innerHTML = `<form class="styles__container___1BPm9-camelCase">${bodyHtml}<input type="submit" style="opacity: 0; display: none;" /></form>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    modal.querySelector("form").addEventListener("submit", (e) => e.preventDefault());
    return modal;
}

function siteButtonHtml(id, text, color = "var(--accent)") {
    return `
        <div id="${id}" class="styles__button___1_E-G-camelCase styles__button___3zpwV-camelCase" role="button" tabindex="0">
            <div class="styles__shadow___3GMdH-camelCase"></div>
            <div class="styles__edge___3eWfq-camelCase" style="background-color: ${color};"></div>
            <div class="styles__front___vcvuy-camelCase styles__buttonInside___39vdp-camelCase" style="background-color: ${color};">${text}</div>
        </div>
    `;
}

BlacketTweaks.util = {
    waitFor,
    onExists,
    onLocationChange,
    onViewedUserChange,
    getViewedUser: () => viewedUser,
    openModal,
    siteButtonHtml
};

const SETTINGS_STORAGE_KEY = "blackettweaks_settings";
let settingsCache = null;
function loadSettings() {
    if (settingsCache) return settingsCache;
    try {
        settingsCache = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)) || {};
    } catch (e) {
        settingsCache = {};
    }
    return settingsCache;
}

BlacketTweaks.settings = {

    isEnabled(key) {
        const s = loadSettings();
        return s[key] === true;
    },
    setEnabled(key, enabled) {
        const s = loadSettings();
        s[key] = enabled;
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
    },

    getConfig(featureKey, configKey, defaultValue) {
        const s = loadSettings();
        const cfg = (s.config && s.config[featureKey]) || {};
        return cfg[configKey] !== undefined ? cfg[configKey] : defaultValue;
    },
    setConfig(featureKey, configKey, value) {
        const s = loadSettings();
        if (!s.config) s.config = {};
        if (!s.config[featureKey]) s.config[featureKey] = {};
        s.config[featureKey][configKey] = value;
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s));
    }
};

BlacketTweaks.registerFeature = (key, label, description, category = "General", icon = "fa-puzzle-piece", onConfigure = null) => {
    BlacketTweaks.features[key] = { key, label, description, category, icon, onConfigure };
    return BlacketTweaks.settings.isEnabled(key);
};

BlacketTweaks.util.injectRainbowStyle = function () {
    if (document.getElementById("bp-rainbow-style")) return;
    const style = document.createElement("style");
    style.id = "bp-rainbow-style";
    style.textContent = `
        @keyframes bpRainbowShift { 0% { background-position: 0% 50%; } 100% { background-position: 400% 50%; } }
        .bp-rainbow {
            background: linear-gradient(90deg, #ff3b3b, #ff9800, #ffe234, #4cd964, #0bc2cf, #5c7cff, #b25cff, #ff3b3b) !important;
            background-size: 400% 400% !important;
            animation: bpRainbowShift 6s linear infinite !important;
        }
    `;
    document.head.appendChild(style);
};
BlacketTweaks.util.injectRainbowStyle();
