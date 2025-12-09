$(document).ready(function () {
	$("#removeBoxBtn").on("click", function () {
		$("#box").hide("explode", { pieces: 16 }, 600, function () {
			$(this).remove();
		});
	});

	$("#clearDivBtn").on("click", function () {
		$("#box").children().fadeOut(400, function () {
			$("#box").empty();
		});
	});

	$("#box").draggable();

	$("#errorDialog").dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			"OK": function () {
				$(this).dialog("close");
			}
		}
	});

	$("#calcBtn").on("click", function () {
		var aStr = $("#a").val().trim();
		var bStr = $("#b").val().trim();
		var op = $("input[name='op']:checked").val();

		function showError(msg) {
			$("#errorText").text(msg);
			$("#errorDialog").dialog("open");
		}

		if (aStr === "" || bStr === "") {
			showError("Mindkét számot meg kell adni!");
			return;
		}

		if (!/^[-]?\d+$/.test(aStr) || !/^[-]?\d+$/.test(bStr)) {
			showError("Csak egész számokat adjon meg!");
			return;
		}

		var a = parseInt(aStr, 10);
		var b = parseInt(bStr, 10);

		if (!op) {
			showError("Válasszon egy műveletet!");
			return;
		}

		var res;
		switch (op) {
			case "mul":
				res = a * b;
				break;
			case "div":
				if (b === 0) {
					showError("Nullával nem lehet osztani!");
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

		$("#calcResult").text(res);
	});
});


