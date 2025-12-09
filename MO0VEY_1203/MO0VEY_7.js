$(document).ready(function () {
	var $box = $("#animBox");
	var animSpeed = 800;

	$box.draggable();

	$("#startAnim").on("click", function () {
		$box
			.stop(true, true)
			.css({
				left: "300px",
				top: "0px",
				width: "300px",
				height: "80px",
				fontSize: "12pt",
				opacity: 1
			})
			.animate({
				left: "600px",
				width: "400px",
				fontSize: "30pt"
			}, animSpeed)
			.animate({
				top: "120px",
				width: "260px",
				height: "90px"
			}, animSpeed)
			.animate({
				left: "0px",
				opacity: 0.4
			}, animSpeed)
			.animate({
				left: "300px",
				top: "0px",
				width: "300px",
				height: "80px",
				fontSize: "12pt",
				opacity: 1
			}, animSpeed, function () {
				$box.effect("bounce", { times: 3 }, 500);
			});
	});

	$("#hideP").on("click", function () {
		$("#calc").prevAll("p").slideUp(600);
	});

	var collapsed = false;
	$("#toggleBox").on("click", function () {
		$box.stop(true, true);
		if (!collapsed) {
			$box
				.animate({ height: "20px", width: "150px" }, 500)
				.animate({ left: "500px" }, 700);
			collapsed = true;
		} else {
			$box
				.animate({ left: "300px" }, 700)
				.animate({ height: "80px", width: "300px" }, 500);
			collapsed = false;
		}
	});

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


