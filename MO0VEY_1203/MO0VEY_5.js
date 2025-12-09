$(document).ready(function () {
	// Szöveg hozzáadása a zöld dobozhoz
	$("#addTextBtn").on("click", function () {
		// csak egyszer adjuk hozzá, ha még nincs benne
		if ($("#box .prog-text").length === 0) {
			$("#box").append("<p class='prog-text'>Programtervező informatikus</p>");
		}
	});

	// PTI gomb hozzáfűzése a doboz alá
	$("#addPtiBtn").on("click", function () {
		if ($("#ptiBtn").length === 0) {
			$("#box").after("<br><button id='ptiBtn'>ME GEIK - PTI</button>");
		}
	});

	// Új gomb felvétele a Forrás után
	$("#addNewBtn").on("click", function () {
		if ($("#newGeikBtn").length === 0) {
			$("#source-link").append("<br><button id='newGeikBtn'>ME GEIK-PTI</button>");
		}
	});

	// Fejléc felvétele (jQuery feladat)
	$("#addHeaderBtn").on("click", function () {
		if ($("#mainHeader").length === 0) {
			$("#staticHeader").attr("id", "mainHeader");
		}
	});

	// Alcím felvétele (HTML - Add elements)
	$("#addSubHeaderBtn").on("click", function () {
		if ($("#subHeader").length === 0) {
			$("#staticSub").attr("id", "subHeader");
		}
	});

	// Űrlap fejléc felvétele (ŰRLAP-NEPTUNKOD) és egyszerű űrlap
	$("#addFormHeaderBtn").on("click", function () {
		if ($("#formHeader").length === 0) {
			var formHtml = "";
			formHtml += "<h2 id='formHeader'>ŰRLAP-NEPTUNKOD</h2>";
			formHtml += "<form><p>Név: <input type='text' /></p>";
			formHtml += "<p>E-mail: <input type='text' /></p>";
			formHtml += "<p>Jelszó: <input type='password' /></p>";
			formHtml += "<p><button type='button'>Jelentkezés</button></p></form>";
			$("#form-area").html(formHtml);
		}
	});
});

