$(document).ready(function () {
	$("#load-btn").on("click", function () {
		$.getJSON("MO0VEY_orarend1.json", function (data) {
			var html = "";

			html += "<h2>MISKOLCI EGYETEM</h2>";
			html += "<p><span class='title'>Cím:</span> 3515 Miskolc Egyetemváros</p>";

			html += "<p><span class='title'>Telefonszám:</span></p>";
			html += "<p>Vezetékes: 0646 555-125<br>Mobil: 0670 555-4567</p>";

			html += "<h3>MI, PTI Órarend " + data.felev + "</h3>";
			html += "<p><span class='title'>Tárgy:</span> " + data.kurzus + "</p>";

			if (data.orarend && data.orarend.length > 0) {
				html += "<div class='orarend-list'>";

				$.each(data.orarend, function (index, ora) {
					html += "<div class='ora-item'>";
					html += "<p><span class='title'>Időpont:</span><br>" +
						"Nap: " + ora.nap + "<br>" +
						"Tól: " + ora.kezdes + "<br>" +
						"Ig: " + ora.befejezes + "</p>";

					html += "<p><span class='title'>Helyszín:</span> " + ora.terem.szoba + "</p>";
					html += "<p><span class='title'>Típus:</span> " + ora.tipus + "</p>";
					html += "</div>";
				});

				html += "</div>";
			}

			html += "<p><span class='title'>Oktató:</span> " + data.oktató + "</p>";
			html += "<p><span class='title'>Szak:</span> MI, PTI</p>";

			$("#container").html(html);
		});
	});
});

