document.addEventListener("DOMContentLoaded", function () {
    var osszesGyogyszer = [];
    var tablaTorzs = document.querySelector("#gyogyszerTabla tbody");
    var nevInput = document.getElementById("filterName");
    var betegsegSelect = document.getElementById("filterDisease");

    function tablaTorles() {
        while (tablaTorzs && tablaTorzs.firstChild) {
            tablaTorzs.removeChild(tablaTorzs.firstChild);
        }
    }

    function sorHozzaadas(gy) {
        var tr = document.createElement("tr");

        var nevTd = document.createElement("td");
        nevTd.textContent = gy.nev;
        tr.appendChild(nevTd);

        var betegsegTd = document.createElement("td");
        betegsegTd.textContent = gy.betegseg;
        tr.appendChild(betegsegTd);

        var meretTd = document.createElement("td");
        meretTd.textContent = gy.meret;
        tr.appendChild(meretTd);

        var kiszTd = document.createElement("td");
        if (Array.isArray(gy.kiszerelesek)) {
            gy.kiszerelesek.forEach(function (k) {
                var sor = document.createElement("div");
                sor.textContent = k.darab + " db - " + k.ar + " Ft";
                kiszTd.appendChild(sor);
            });
        }
        tr.appendChild(kiszTd);

        var adagTd = document.createElement("td");
        adagTd.textContent = gy.adagolas + " (" + gy.adagolasMagyarazat + ")";
        tr.appendChild(adagTd);

        var mellekTd = document.createElement("td");
        mellekTd.textContent = gy.mellekhatas;
        tr.appendChild(mellekTd);

        var venyTd = document.createElement("td");
        venyTd.textContent = gy.venykoteles ? "Igen" : "Nem";
        tr.appendChild(venyTd);

        if (tablaTorzs) {
            tablaTorzs.appendChild(tr);
        }
    }

    function betegsegListaFeltoltes() {
        if (!betegsegSelect) {
            return;
        }

        var egyediBetegsegek = [];

        osszesGyogyszer.forEach(function (gy) {
            if (gy.betegseg && egyediBetegsegek.indexOf(gy.betegseg) === -1) {
                egyediBetegsegek.push(gy.betegseg);
            }
        });

        egyediBetegsegek.sort();

        egyediBetegsegek.forEach(function (b) {
            var option = document.createElement("option");
            option.value = b;
            option.textContent = b;
            betegsegSelect.appendChild(option);
        });
    }

    function szuresAlkalmazasa() {
        var nevSzuro = nevInput ? nevInput.value.trim().toLowerCase() : "";
        var betegsegSzuro = betegsegSelect ? betegsegSelect.value : "";

        tablaTorles();

        osszesGyogyszer.forEach(function (gy) {
            var nevTalalat = true;
            var betegsegTalalat = true;

            if (nevSzuro !== "") {
                if (!gy.nev || gy.nev.toLowerCase().indexOf(nevSzuro) === -1) {
                    nevTalalat = false;
                }
            }

            if (betegsegSzuro !== "") {
                if (gy.betegseg !== betegsegSzuro) {
                    betegsegTalalat = false;
                }
            }

            if (nevTalalat && betegsegTalalat) {
                sorHozzaadas(gy);
            }
        });
    }

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

            osszesGyogyszer = adat.gyogyszerek.slice();

            osszesGyogyszer.sort(function (a, b) {
                var nevA = (a.nev || "").toLowerCase();
                var nevB = (b.nev || "").toLowerCase();
                if (nevA < nevB) return -1;
                if (nevA > nevB) return 1;
                return 0;
            });

            betegsegListaFeltoltes();

            osszesGyogyszer.forEach(function (gy) {
                sorHozzaadas(gy);
            });

            if (nevInput) {
                nevInput.addEventListener("input", szuresAlkalmazasa);
            }

            if (betegsegSelect) {
                betegsegSelect.addEventListener("change", szuresAlkalmazasa);
            }
        })
        .catch(function (hiba) {
            console.error(hiba);
        });
});
