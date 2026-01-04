document.addEventListener("DOMContentLoaded", function () {
    function normalizeText(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function safeParseJson(value) {
        try {
            var parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function highlightMatch(text, query) {
        var safeText = escapeHtml(String(text || ""));
        if (!query) return safeText;
        var safeQuery = escapeRegExp(String(query));
        var re = new RegExp("(" + safeQuery + ")", "gi");
        return safeText.replace(re, "<mark>$1</mark>");
    }

    function mapLegacySortKey(key) {
        if (!key) return null;
        if (key === "nev") return "name";
        if (key === "betegseg") return "disease";
        if (key === "meret") return "size";
        if (key === "kiszerelesek") return "packages";
        if (key === "adagolas") return "dosage";
        if (key === "mellekhatas") return "sideEffects";
        if (key === "venykoteles") return "prescriptionOnly";
        return key;
    }

    function normalizeMedicine(raw) {
        var packages = [];
        if (raw && Array.isArray(raw.kiszerelesek)) {
            packages = raw.kiszerelesek
                .map(function (p) {
                    return {
                        count: typeof p.darab === "number" ? p.darab : Number(p.darab) || 0,
                        priceFt: typeof p.ar === "number" ? p.ar : Number(p.ar) || 0
                    };
                })
                .filter(function (p) {
                    return p.count > 0 || p.priceFt > 0;
                });
        }

        var diseaseIds = [];
        if (raw && Array.isArray(raw.diseaseIds)) {
            diseaseIds = raw.diseaseIds.filter(function (x) {
                return typeof x === "string" && x;
            });
        }

        return {
            name: raw && typeof raw.nev === "string" ? raw.nev : "",
            disease: raw && typeof raw.betegseg === "string" ? raw.betegseg : "",
            diseaseIds: diseaseIds,
            size: raw && typeof raw.meret === "string" ? raw.meret : "",
            packages: packages,
            dosage: raw && typeof raw.adagolas === "string" ? raw.adagolas : "",
            dosageExplanation: raw && typeof raw.adagolasMagyarazat === "string" ? raw.adagolasMagyarazat : "",
            sideEffects: raw && typeof raw.mellekhatas === "string" ? raw.mellekhatas : "",
            recommendation: raw && typeof raw.ajanlas === "string" ? raw.ajanlas : (raw && typeof raw.leiras === "string" ? raw.leiras : ""),
            prescriptionOnly: Boolean(raw && raw.venykoteles)
        };
    }

    function getRecommendationText(medicine) {
        var custom = String((medicine && medicine.recommendation) || "").trim();
        if (custom) return custom;

        var forText = medicine && medicine.disease ? "Javasolt terület: " + medicine.disease + ". " : "";
        var rxText = medicine && medicine.prescriptionOnly
            ? "Vényköteles készítmény: alkalmazása orvosi javaslat alapján történik. "
            : "Általános, tájékoztató jellegű információ. ";

        return (
            forText +
            rxText +
            "Olvassa el a betegtájékoztatót, és kérdés esetén egyeztessen gyógyszerésszel/orvossal. " +
            "Ha a panaszok romlanak vagy szokatlan tünet jelentkezik, forduljon szakemberhez."
        );
    }

    function readUrlState() {
        try {
            var url = new URL(window.location.href);
            var params = url.searchParams;
            return {
                name: params.get("name"),
                disease: params.get("disease"),
                sort: params.get("sort"),
                dir: params.get("dir")
            };
        } catch (e) {
            return { name: null, disease: null, sort: null, dir: null };
        }
    }

    function updateUrlState(nameFilter, diseaseFilter) {
        try {
            var url = new URL(window.location.href);
            var params = url.searchParams;

            if (nameFilter) params.set("name", nameFilter);
            else params.delete("name");

            if (diseaseFilter) params.set("disease", diseaseFilter);
            else params.delete("disease");

            if (sortState.column) params.set("sort", sortState.column);
            else params.delete("sort");

            if (sortState.column && sortState.direction === -1) params.set("dir", "-1");
            else params.delete("dir");

            window.history.replaceState(null, "", url.toString());
        } catch (e) {
        }
    }

    var rawFilters = localStorage.getItem("medicineFilters") || localStorage.getItem("gyogyszerFilters") || "{}";
    var rawSort = localStorage.getItem("medicineSort") || localStorage.getItem("gyogyszerSort") || "{}";
    var persistedFilters = safeParseJson(rawFilters);
    var persistedSort = safeParseJson(rawSort);

    var urlState = readUrlState();
    if (typeof urlState.name === "string") persistedFilters.name = urlState.name;
    if (typeof urlState.disease === "string") persistedFilters.disease = urlState.disease;
    if (typeof urlState.sort === "string") persistedSort.column = urlState.sort;
    if (typeof urlState.dir === "string") persistedSort.direction = urlState.dir === "-1" ? -1 : 1;

    if (persistedFilters.nev && !persistedFilters.name) persistedFilters.name = persistedFilters.nev;
    if (persistedFilters.betegseg && !persistedFilters.disease) persistedFilters.disease = persistedFilters.betegseg;
    if (persistedSort.oszlop && !persistedSort.column) persistedSort.column = persistedSort.oszlop;
    if (persistedSort.irany && typeof persistedSort.direction !== "number") persistedSort.direction = persistedSort.irany;

    var allMedicines = [];
    var tableBody = document.querySelector("#medicineTable tbody");
    var nameInput = document.getElementById("filterName");
    var diseaseSelect = document.getElementById("filterDisease");
    var diseaseSummary = document.getElementById("diseaseSummary");
    var medicineStats = document.getElementById("medicineStats");
    var sortState = { column: null, direction: 1 };

    var diseases = [];
    var diseasesById = {};
    var diseasesByNormName = {};
    var diseaseSelectMode = "text";

    if (nameInput && typeof persistedFilters.name === "string") nameInput.value = persistedFilters.name;
    if (diseaseSelect && typeof persistedFilters.disease === "string") diseaseSelect.value = persistedFilters.disease;

    if (persistedSort.column) {
        sortState.column = mapLegacySortKey(persistedSort.column);
        sortState.direction = persistedSort.direction === -1 ? -1 : 1;
    }

    function clearTable() {
        while (tableBody && tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }
    }

    function appendDetailsCell(container, label, value) {
        var strong = document.createElement("strong");
        strong.textContent = label;
        container.appendChild(strong);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(document.createTextNode(value || "-"));
    }

    function addMedicineRow(medicine, nameFilter, diseaseFilter) {
        var mainRow = document.createElement("tr");

        var toggleCell = document.createElement("td");
        var toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.textContent = "+";
        toggleButton.setAttribute("aria-label", "Részletek megjelenítése/elrejtése");
        toggleButton.className = "expand-btn";
        toggleCell.appendChild(toggleButton);
        mainRow.appendChild(toggleCell);

        var nameCell = document.createElement("td");
        nameCell.innerHTML = nameFilter ? highlightMatch(medicine.name, nameFilter) : escapeHtml(medicine.name);
        nameCell.setAttribute("data-label", "Név");
        mainRow.appendChild(nameCell);

        var diseaseCell = document.createElement("td");
        diseaseCell.innerHTML = diseaseFilter ? highlightMatch(medicine.disease, diseaseFilter) : escapeHtml(medicine.disease);
        diseaseCell.setAttribute("data-label", "Betegség");
        mainRow.appendChild(diseaseCell);

        var sizeCell = document.createElement("td");
        sizeCell.textContent = medicine.size;
        sizeCell.setAttribute("data-label", "Méret / hatóanyag");
        mainRow.appendChild(sizeCell);

        var packagesCell = document.createElement("td");
        medicine.packages.forEach(function (p) {
            var line = document.createElement("div");
            line.textContent = p.count + " db - " + p.priceFt + " Ft";
            packagesCell.appendChild(line);
        });
        packagesCell.setAttribute("data-label", "Kiszerelések / ár (Ft)");
        mainRow.appendChild(packagesCell);

        var dosageCell = document.createElement("td");
        dosageCell.textContent = medicine.dosage + (medicine.dosageExplanation ? " (" + medicine.dosageExplanation + ")" : "");
        dosageCell.setAttribute("data-label", "Adagolás");
        mainRow.appendChild(dosageCell);

        var sideEffectsCell = document.createElement("td");
        sideEffectsCell.textContent = medicine.sideEffects;
        sideEffectsCell.setAttribute("data-label", "Mellékhatások");
        mainRow.appendChild(sideEffectsCell);

        var prescriptionCell = document.createElement("td");
        prescriptionCell.textContent = medicine.prescriptionOnly ? "Igen" : "Nem";
        prescriptionCell.setAttribute("data-label", "Vényköteles");
        mainRow.appendChild(prescriptionCell);

        if (tableBody) {
            tableBody.appendChild(mainRow);
        }

        var detailsRow = document.createElement("tr");
        detailsRow.className = "details-row";
        detailsRow.style.display = "none";

        var detailsCell = document.createElement("td");
        detailsCell.colSpan = 8;
        appendDetailsCell(detailsCell, "Ajánlás / megjegyzés:", getRecommendationText(medicine));
        detailsCell.appendChild(document.createElement("br"));
        appendDetailsCell(detailsCell, "Adagolás magyarázat:", medicine.dosageExplanation);
        detailsCell.appendChild(document.createElement("br"));
        appendDetailsCell(detailsCell, "Mellékhatás(ok):", medicine.sideEffects);

        detailsRow.appendChild(detailsCell);
        if (tableBody) {
            tableBody.appendChild(detailsRow);
        }

        toggleButton.addEventListener("click", function () {
            if (detailsRow.style.display === "none") {
                detailsRow.style.display = "table-row";
                toggleButton.textContent = "-";
            } else {
                detailsRow.style.display = "none";
                toggleButton.textContent = "+";
            }
        });
    }

    function persistSortState() {
        var payload = JSON.stringify({ column: sortState.column, direction: sortState.direction });
        localStorage.setItem("medicineSort", payload);
    }

    function persistFilterState(nameFilter, diseaseFilter) {
        localStorage.setItem("medicineFilters", JSON.stringify({ name: nameFilter, disease: diseaseFilter }));
    }

    function compareValues(aVal, bVal) {
        if (aVal < bVal) return -1 * sortState.direction;
        if (aVal > bVal) return 1 * sortState.direction;
        return 0;
    }

    function sortMedicines(column) {
        if (sortState.column === column) {
            sortState.direction *= -1;
        } else {
            sortState.column = column;
            sortState.direction = 1;
        }

        persistSortState();

        allMedicines.sort(function (a, b) {
            if (column === "packages") {
                var aPrice = a.packages[0] ? a.packages[0].priceFt : 0;
                var bPrice = b.packages[0] ? b.packages[0].priceFt : 0;
                return compareValues(aPrice, bPrice);
            }
            if (column === "prescriptionOnly") {
                return compareValues(a.prescriptionOnly ? 1 : 0, b.prescriptionOnly ? 1 : 0);
            }
            var aText = (a[column] || "").toString().toLowerCase();
            var bText = (b[column] || "").toString().toLowerCase();
            return compareValues(aText, bText);
        });

        applyFilters();
    }

    function populateDiseaseOptionsFromDiseases() {
        if (!diseaseSelect) return;

        diseaseSelectMode = "id";
        diseaseSelect.textContent = "";
        diseaseSelect.appendChild((function () {
            var option = document.createElement("option");
            option.value = "";
            option.textContent = "Mindegy";
            return option;
        })());

        diseases
            .slice()
            .sort(function (a, b) {
                return String(a.name || "").localeCompare(String(b.name || ""), "hu");
            })
            .forEach(function (d) {
                var option = document.createElement("option");
                option.value = d.id;
                option.textContent = d.name;
                diseaseSelect.appendChild(option);
            });
    }

    function populateDiseaseOptionsFromMedicines() {
        if (!diseaseSelect) return;

        diseaseSelectMode = "text";
        diseaseSelect.textContent = "";
        diseaseSelect.appendChild((function () {
            var option = document.createElement("option");
            option.value = "";
            option.textContent = "Mindegy";
            return option;
        })());

        var uniqueDiseases = [];
        allMedicines.forEach(function (m) {
            if (m.disease && uniqueDiseases.indexOf(m.disease) === -1) {
                uniqueDiseases.push(m.disease);
            }
        });

        uniqueDiseases.sort(function (a, b) {
            return a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0;
        });

        uniqueDiseases.forEach(function (d) {
            var option = document.createElement("option");
            option.value = d;
            option.textContent = d;
            diseaseSelect.appendChild(option);
        });
    }

    function setDiseaseSummary(diseaseId) {
        if (!diseaseSummary) return;
        if (!diseaseId || diseaseSelectMode !== "id") {
            diseaseSummary.style.display = "none";
            diseaseSummary.textContent = "";
            return;
        }

        var d = diseasesById[diseaseId];
        if (!d) {
            diseaseSummary.style.display = "none";
            diseaseSummary.textContent = "";
            return;
        }

        diseaseSummary.textContent = "";
        var title = document.createElement("h3");
        title.textContent = d.name;
        diseaseSummary.appendChild(title);

        var p1 = document.createElement("p");
        p1.innerHTML = "<strong>Tünetek:</strong> " + escapeHtml((d.symptoms || []).join(", ") || "-");
        diseaseSummary.appendChild(p1);

        if (Array.isArray(d.redFlags) && d.redFlags.length) {
            var p2 = document.createElement("p");
            p2.className = "diseaseSummaryRed";
            p2.innerHTML = "<strong>Figyelmeztető jelek:</strong> " + escapeHtml(d.redFlags.join(", "));
            diseaseSummary.appendChild(p2);
        }

        if (d.whenToSeeDoctor) {
            var p3 = document.createElement("p");
            p3.innerHTML = "<strong>Mikor érdemes orvoshoz fordulni?</strong> " + escapeHtml(d.whenToSeeDoctor);
            diseaseSummary.appendChild(p3);
        }

        diseaseSummary.style.display = "block";
    }

    function minPriceFromPackages(packages) {
        var min = Infinity;
        if (!packages || !packages.length) return 0;
        packages.forEach(function (p) {
            var v = p && typeof p.priceFt === "number" ? p.priceFt : Number(p && p.priceFt) || 0;
            if (v > 0 && v < min) min = v;
        });
        return min === Infinity ? 0 : min;
    }

    function renderStats(filtered) {
        if (!medicineStats) return;
        var total = allMedicines.length;
        var shown = filtered.length;
        var rx = 0;
        var prices = [];
        filtered.forEach(function (m) {
            if (m.prescriptionOnly) rx += 1;
            var p = minPriceFromPackages(m.packages);
            if (p > 0) prices.push(p);
        });

        var min = 0;
        var max = 0;
        var avg = 0;
        if (prices.length) {
            min = prices.reduce(function (a, b) { return Math.min(a, b); }, prices[0]);
            max = prices.reduce(function (a, b) { return Math.max(a, b); }, prices[0]);
            avg = Math.round(prices.reduce(function (a, b) { return a + b; }, 0) / prices.length);
        }

        medicineStats.innerHTML =
            "<h3>Statisztika</h3>" +
            "<p><strong>Találat:</strong> " + shown + " / " + total + "</p>" +
            "<p><strong>Vényköteles (találat):</strong> " + rx + "</p>" +
            "<p><strong>Ár (becslés, találat):</strong> min " + (min ? min + " Ft" : "-") + ", átlag " + (avg ? avg + " Ft" : "-") + ", max " + (max ? max + " Ft" : "-") + "</p>";
    }

    function applyFilters() {
        var nameFilter = nameInput ? nameInput.value.trim() : "";
        var diseaseFilter = diseaseSelect ? diseaseSelect.value : "";

        var diseaseNameForHighlight = "";
        if (diseaseFilter) {
            if (diseaseSelectMode === "id") {
                var d = diseasesById[diseaseFilter];
                diseaseNameForHighlight = d ? d.name : "";
            } else {
                diseaseNameForHighlight = diseaseFilter;
            }
        }

        persistFilterState(nameFilter, diseaseFilter);
        updateUrlState(nameFilter, diseaseFilter);
        clearTable();

        var nameFilterLower = nameFilter.toLowerCase();

        var filtered = [];

        allMedicines.forEach(function (m) {
            var nameMatches = true;
            var diseaseMatches = true;

            if (nameFilterLower) {
                nameMatches = Boolean(m.name) && m.name.toLowerCase().indexOf(nameFilterLower) !== -1;
            }

            if (diseaseFilter) {
                if (diseaseSelectMode === "id") {
                    diseaseMatches = Array.isArray(m.diseaseIds) && m.diseaseIds.indexOf(diseaseFilter) !== -1;
                } else {
                    diseaseMatches = m.disease === diseaseFilter;
                }
            }

            if (nameMatches && diseaseMatches) {
                filtered.push(m);
                addMedicineRow(m, nameFilter, diseaseNameForHighlight);
            }
        });

        setDiseaseSummary(diseaseSelectMode === "id" ? diseaseFilter : "");
        renderStats(filtered);
    }

    var table = document.getElementById("medicineTable");
    if (table) {
        Array.prototype.forEach.call(table.querySelectorAll("thead th[data-sort]"), function (th) {
            th.addEventListener("click", function () {
                var column = th.getAttribute("data-sort");
                sortMedicines(column);
            });
        });
    }

    function loadJson(url) {
        return fetch(url)
            .then(function (r) {
                if (!r.ok) return null;
                return r.json();
            })
            .catch(function () {
                return null;
            });
    }

    Promise.all([loadJson("gyogyszertar.json"), loadJson("betegsegek.json")])
        .then(function (loaded) {
            var medicineData = loaded[0];
            var diseaseData = loaded[1];
            if (!medicineData || !medicineData.gyogyszerek) return;

            allMedicines = medicineData.gyogyszerek.map(normalizeMedicine);

            allMedicines.sort(function (a, b) {
                var aName = (a.name || "").toLowerCase();
                var bName = (b.name || "").toLowerCase();
                if (aName < bName) return -1;
                if (aName > bName) return 1;
                return 0;
            });

            if (Array.isArray(diseaseData)) {
                diseases = diseaseData
                    .filter(function (d) {
                        return d && typeof d.id === "string" && typeof d.name === "string";
                    })
                    .map(function (d) {
                        return {
                            id: d.id,
                            name: d.name,
                            symptoms: Array.isArray(d.symptoms) ? d.symptoms : [],
                            redFlags: Array.isArray(d.redFlags) ? d.redFlags : [],
                            whenToSeeDoctor: typeof d.whenToSeeDoctor === "string" ? d.whenToSeeDoctor : ""
                        };
                    });

                diseasesById = {};
                diseasesByNormName = {};
                diseases.forEach(function (d) {
                    diseasesById[d.id] = d;
                    diseasesByNormName[normalizeText(d.name)] = d;
                });

                populateDiseaseOptionsFromDiseases();

                if (diseaseSelect && typeof persistedFilters.disease === "string") {
                    var wanted = persistedFilters.disease;
                    if (wanted && !diseasesById[wanted]) {
                        var byName = diseasesByNormName[normalizeText(wanted)];
                        if (byName) wanted = byName.id;
                        else wanted = "";
                    }
                    diseaseSelect.value = wanted;
                }
            } else {
                populateDiseaseOptionsFromMedicines();
                if (diseaseSelect && typeof persistedFilters.disease === "string") diseaseSelect.value = persistedFilters.disease;
            }

            if (sortState.column) {
                allMedicines.sort(function (a, b) {
                    var col = sortState.column;
                    if (col === "packages") {
                        var aPrice = a.packages[0] ? a.packages[0].priceFt : 0;
                        var bPrice = b.packages[0] ? b.packages[0].priceFt : 0;
                        return compareValues(aPrice, bPrice);
                    }
                    if (col === "prescriptionOnly") {
                        return compareValues(a.prescriptionOnly ? 1 : 0, b.prescriptionOnly ? 1 : 0);
                    }
                    var aText = (a[col] || "").toString().toLowerCase();
                    var bText = (b[col] || "").toString().toLowerCase();
                    return compareValues(aText, bText);
                });
            }

            applyFilters();

            if (nameInput) nameInput.addEventListener("input", applyFilters);
            if (diseaseSelect) diseaseSelect.addEventListener("change", applyFilters);
        })
        .catch(function () {
        });
});
