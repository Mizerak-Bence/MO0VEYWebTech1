$(document).ready(function () {
	$("#calcBtn").on("click", function () {
		var aStr = $("#a").val().trim();
		var bStr = $("#b").val().trim();
		var op = $("input[name='op']:checked").val();

		// alap ellenőrzés: mindkét mező kitöltve
		if (aStr === "" || bStr === "") {
			alert("Mindkét számot meg kell adni!");
			return;
		}

		// egész szám ellenőrzés
		if (!/^[-]?\d+$/.test(aStr) || !/^[-]?\d+$/.test(bStr)) {
			alert("Csak egész számokat adjon meg!");
			return;
		}

		var a = parseInt(aStr, 10);
		var b = parseInt(bStr, 10);

		// művelet választás ellenőrzése
		if (!op) {
			alert("Válasszon egy műveletet!");
			return;
		}

		var res;
		switch (op) {
			case "mul":
				res = a * b;
				break;
			case "div":
				if (b === 0) {
					alert("Nullával nem lehet osztani!");
					return;
				}
				res = a / b;
				break;
			case "add":
				res = a + b;
				break;
			case "sub":
				res = a - b;
				break;
		}

		$("#result").text(res);
	});
});

