(function CopyUserIdFeature() {
    if (!BlacketTweaks.registerFeature("copyUserId", "Copy User ID", "Adds a Copy User ID button on profile pages.", "Stats", "fa-copy")) return;

    const CONFIG = {
        viewStatsButtonSelector: "#viewStatsButton",
        headerNameSelector: ".styles__headerName___1GBcl-camelCase"
    };

    function getViewedUsername() {

        if (window.blacket && window.blacket.user && window.blacket.user.current) {
            return window.blacket.user.current;
        }
        const nameParam = new URLSearchParams(location.search).get("name");
        if (nameParam) return nameParam;
        const usernameEl = document.querySelector(CONFIG.headerNameSelector);
        const text = usernameEl ? usernameEl.textContent.trim() : "";
        if (text && text !== "username") return text;
        return (window.blacket && window.blacket.user) ? window.blacket.user.username : null;
    }

    function getViewedUserId() {
        return new Promise((resolve) => {

            if (!new URLSearchParams(location.search).get("name") && window.blacket && window.blacket.user && window.blacket.user.id != null) {
                return resolve(String(window.blacket.user.id));
            }

            const viewedUser = BlacketTweaks.util.getViewedUser();
            if (viewedUser && viewedUser.id != null) return resolve(String(viewedUser.id));

            const username = getViewedUsername();
            if (!username) return resolve(null);

            if (window.blacket && window.blacket.user && username === window.blacket.user.username) {
                return resolve(window.blacket.user.id != null ? String(window.blacket.user.id) : null);
            }

            if (!window.blacket || !window.blacket.requests) return resolve(null);
            window.blacket.requests.get(`/worker2/user/${encodeURIComponent(username)}`, (data) => {
                resolve(data && !data.error && data.user ? String(data.user.id) : null);
            });
        });
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand("copy"); } catch (e) {  }
        textarea.remove();
        return Promise.resolve();
    }

    function setup(viewStatsButton) {
        if (viewStatsButton.dataset.bpCopyIdSetup) return;
        viewStatsButton.dataset.bpCopyIdSetup = "true";

        const button = document.createElement("a");
        button.id = "bpCopyUserIdButton";
        button.className = "styles__button___1_E-G-camelCase styles__headerButton___36TRh-camelCase";
        button.setAttribute("role", "button");
        button.setAttribute("tabindex", "0");
        button.innerHTML = `
            <div class="styles__shadow___3GMdH-camelCase"></div>
            <div class="styles__edge___3eWfq-camelCase" style="background-color: #000;"></div>
            <div class="styles__front___vcvuy-camelCase" style="background-color: #000;">
                <div class="styles__headerButtonInside___26e_U-camelCase"><i class="styles__headerButtonIcon___1pOun-camelCase fas fa-copy" aria-hidden="true"></i>Copy User ID</div>
            </div>
        `;
        viewStatsButton.insertAdjacentElement("afterend", button);

        button.addEventListener("click", async () => {
            const id = await getViewedUserId();
            if (!id) {
                if (window.blacket && window.blacket.createToast) {
                    window.blacket.createToast({ title: "Error", message: "Couldn't find this profile's user ID.", icon: "/content/blooks/Error.webp", time: 4000 });
                }
                return;
            }
            copyToClipboard(id).then(() => {
                if (window.blacket && window.blacket.createToast) {
                    window.blacket.createToast({ title: "Copied", message: `User ID ${id} copied to clipboard.`, icon: "/content/blooks/Success.webp", time: 3000 });
                } else {
                    const icon = button.querySelector(".styles__headerButtonIcon___1pOun-camelCase");
                    if (icon) {
                        icon.classList.remove("fa-copy");
                        icon.classList.add("fa-check");
                        setTimeout(() => {
                            icon.classList.remove("fa-check");
                            icon.classList.add("fa-copy");
                        }, 1500);
                    }
                }
            });
        });
    }

    BlacketTweaks.util.onExists(CONFIG.viewStatsButtonSelector, setup);
    BlacketTweaks.log("Copy User ID feature loaded.");
})();
