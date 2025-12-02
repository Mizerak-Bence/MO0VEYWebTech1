document.addEventListener("DOMContentLoaded", function () {
    var datalist = document.getElementById("gyogyszer-opciok");
    var form = document.querySelector(".rendeles-ruidor form");
    var nevInput = document.getElementById("nev");
    var emailInput = document.getElementById("email");
    var datumInput = document.getElementById("rendeles-datum");
    var gyogyszerInput = document.getElementById("gyogyszer-lista");

    if (datalist) {
        fetch("gyogyszertar.json")
        .then(function (valasz) {
            if (!valasz.ok) {
                throw new Error("Hiba a JSON betöltésekor");
            }
            return valasz.json();
        })
        .then(function (adat) {
            if (!adat.gyogyszerek) {
                return;
            }

            var nevek = adat.gyogyszerek
                .map(function (gy) { return gy.nev; })
                .filter(function (nev) { return typeof nev === "string" && nev.trim() !== ""; });

            var egyediNevek = [];
            nevek.forEach(function (nev) {
                if (egyediNevek.indexOf(nev) === -1) {
                    egyediNevek.push(nev);
                }
            });

            egyediNevek.sort(function (a, b) {
                var aLower = a.toLowerCase();
                var bLower = b.toLowerCase();
                if (aLower < bLower) return -1;
                if (aLower > bLower) return 1;
                return 0;
            });

            egyediNevek.forEach(function (nev) {
                var option = document.createElement("option");
                option.value = nev;
                datalist.appendChild(option);
            });
        })
        .catch(function (hiba) {
            console.error(hiba);
        });

    }

    function hibakTorles() {
        var hibasElemek = document.querySelectorAll(".hiba");
        hibasElemek.forEach(function (elem) {
            elem.classList.remove("hiba");
        });

        var hibauzenetek = document.querySelectorAll(".hiba-uzenet");
        hibauzenetek.forEach(function (u) {
            if (u.parentNode) {
                u.parentNode.removeChild(u);
            }
        });
    }

    function hibauzenetHozzaadas(inputElem, uzenet) {
        if (!inputElem) return;

        inputElem.classList.add("hiba");

        var p = document.createElement("div");
        p.className = "hiba-uzenet";
        p.textContent = uzenet;

        if (inputElem.parentNode) {
            inputElem.parentNode.appendChild(p);
        }
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            hibakTorles();

            var vanHiba = false;

            if (nevInput && nevInput.value.trim() === "") {
                hibauzenetHozzaadas(nevInput, "A név megadása kötelező.");
                vanHiba = true;
            }

            if (emailInput) {
                var emailErtek = emailInput.value.trim();
                var emailMinta = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailErtek === "" || !emailMinta.test(emailErtek)) {
                    hibauzenetHozzaadas(emailInput, "Adj meg egy érvényes e-mail címet.");
                    vanHiba = true;
                }
            }

            if (datumInput && datumInput.value === "") {
                hibauzenetHozzaadas(datumInput, "Kérjük, válaszd ki a kiszállítás dátumát.");
                vanHiba = true;
            }

            if (gyogyszerInput && gyogyszerInput.value.trim() === "") {
                hibauzenetHozzaadas(gyogyszerInput, "Válassz egy készítményt a listából.");
                vanHiba = true;
            }

            var kiszerelesValasztott = false;
            var kiszerelesRadio = document.querySelectorAll("input[name='kiszereles']");
            kiszerelesRadio.forEach(function (r) {
                if (r.checked) {
                    kiszerelesValasztott = true;
                }
            });
            if (!kiszerelesValasztott && kiszerelesRadio.length > 0) {
                hibauzenetHozzaadas(kiszerelesRadio[0].closest("fieldset"), "Válaszd ki a kiszerelést.");
                vanHiba = true;
            }

            if (!vanHiba) {
                alert("Köszönjük! Az űrlap sikeresen ellenőrizve lett. (A rendelés NEM kerül elküldésre.)");
                form.reset();
            }
        });
    }
});
