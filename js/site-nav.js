/* ==========================================
   SUNNY PEOPLE
   MENU MOBILE CONDIVISO
========================================== */

(function () {

    var header = document.querySelector("header");
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("site-nav");

    if (!header || !toggle || !nav) {
        return;
    }

    function setOpen(open) {

        header.classList.toggle("menu-open", open);

        toggle.setAttribute("aria-expanded", open ? "true" : "false");

        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    }

    toggle.addEventListener("click", function () {

        setOpen(!header.classList.contains("menu-open"));

    });

    /* chiudi quando si sceglie una voce */
    nav.addEventListener("click", function (event) {

        if (event.target.closest("a")) {
            setOpen(false);
        }

    });

    /* chiudi con Esc */
    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && header.classList.contains("menu-open")) {

            setOpen(false);

            toggle.focus();

        }

    });

    /* chiudi toccando fuori dal menu */
    document.addEventListener("click", function (event) {

        if (header.classList.contains("menu-open") && !header.contains(event.target)) {
            setOpen(false);
        }

    });

    /* torna chiuso quando si passa a desktop */
    var desktop = window.matchMedia("(min-width:901px)");

    if (desktop.addEventListener) {

        desktop.addEventListener("change", function (event) {

            if (event.matches) {
                setOpen(false);
            }

        });

    }

})();
