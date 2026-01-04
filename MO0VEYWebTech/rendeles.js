document.addEventListener("DOMContentLoaded", function () {
    var medicineDataList = document.getElementById("medicineOptions");
    var form = document.querySelector(".order-layout form");
    var formStatus = document.getElementById("formStatus");
    var nameInput = document.getElementById("name");
    var emailInput = document.getElementById("email");
    var dateInput = document.getElementById("deliveryDate");
    var medicineInput = document.getElementById("medicine");

    function setStatus(message) {
        if (!formStatus) return;
        if (!message) {
            formStatus.textContent = "";
            formStatus.style.display = "none";
            return;
        }
        formStatus.textContent = message;
        formStatus.style.display = "block";
    }

    if (medicineDataList) {
        fetch("gyogyszertar.json")
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Hiba a JSON betöltésekor");
                }
                return response.json();
            })
            .then(function (data) {
                if (!data.gyogyszerek) {
                    return;
                }

                var names = data.gyogyszerek
                    .map(function (m) { return m.nev; })
                    .filter(function (n) { return typeof n === "string" && n.trim() !== ""; });

                var uniqueNames = [];
                names.forEach(function (n) {
                    if (uniqueNames.indexOf(n) === -1) {
                        uniqueNames.push(n);
                    }
                });

                uniqueNames.sort(function (a, b) {
                    var aLower = a.toLowerCase();
                    var bLower = b.toLowerCase();
                    if (aLower < bLower) return -1;
                    if (aLower > bLower) return 1;
                    return 0;
                });

                uniqueNames.forEach(function (n) {
                    var option = document.createElement("option");
                    option.value = n;
                    medicineDataList.appendChild(option);
                });
            })
            .catch(function (error) {
                console.error(error);
                setStatus("A gyógyszerlista nem tölthető be jelenleg. Kérjük, próbálja meg később.");
            });
    }

    function clearErrors() {
        var invalidElements = document.querySelectorAll(".error");
        invalidElements.forEach(function (el) {
            el.classList.remove("error");
        });

        var errorMessages = document.querySelectorAll(".error-message");
        errorMessages.forEach(function (el) {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    }

    function addErrorMessage(inputEl, message) {
        if (!inputEl) return;

        inputEl.classList.add("error");

        var el = document.createElement("div");
        el.className = "error-message";
        el.textContent = message;

        if (inputEl.parentNode) {
            inputEl.parentNode.appendChild(el);
        }
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            setStatus("");

            clearErrors();

            var hasError = false;

            if (nameInput && nameInput.value.trim() === "") {
                addErrorMessage(nameInput, "A név megadása kötelező.");
                hasError = true;
            }

            if (emailInput) {
                var emailValue = emailInput.value.trim();
                var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailValue === "" || !emailPattern.test(emailValue)) {
                    addErrorMessage(emailInput, "Adj meg egy érvényes e-mail címet.");
                    hasError = true;
                }
            }

            if (dateInput && dateInput.value === "") {
                addErrorMessage(dateInput, "Kérjük, válaszd ki a kiszállítás dátumát.");
                hasError = true;
            }

            if (medicineInput && medicineInput.value.trim() === "") {
                addErrorMessage(medicineInput, "Válassz egy készítményt a listából.");
                hasError = true;
            }

            var hasSelectedPackage = false;
            var packageRadios = document.querySelectorAll("input[name='packageSize']");
            packageRadios.forEach(function (r) {
                if (r.checked) {
                    hasSelectedPackage = true;
                }
            });
            if (!hasSelectedPackage && packageRadios.length > 0) {
                addErrorMessage(packageRadios[0].closest("fieldset"), "Válaszd ki a kiszerelést.");
                hasError = true;
            }

            if (!hasError) {
                setStatus("Köszönjük! Az űrlap sikeresen ellenőrizve lett. (A rendelés NEM kerül elküldésre.)");
                form.reset();
            }
        });
    }
});
