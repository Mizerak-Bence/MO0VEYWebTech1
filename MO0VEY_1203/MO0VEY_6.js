$(document).ready(function () {
	// Doboz eltávolítása
	$("#removeBoxBtn").on("click", function () {
		$("#box").remove();
	});

	// A DIV elemek kiürítése (csak a tartalom tűnjön el)
	$("#clearDivBtn").on("click", function () {
		$("#box").empty();
	});
});

