/* ==========================================
   SUNNY PEOPLE
   MERCH — GIRA LA T-SHIRT
   Click, tap e tastiera (Enter / Spazio).
========================================== */

(function () {

    var cards = document.querySelectorAll(".flip-card");

    if (!cards.length) {
        return;
    }

    function toggle(card) {

        var flipped = card.classList.toggle("is-flipped");

        card.setAttribute("aria-pressed", flipped ? "true" : "false");

    }

    Array.prototype.forEach.call(cards, function (card) {

        card.addEventListener("click", function () {
            toggle(card);
        });

        card.addEventListener("keydown", function (event) {

            if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {

                event.preventDefault();

                toggle(card);

            }

        });

    });

})();
