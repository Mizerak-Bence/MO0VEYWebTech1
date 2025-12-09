<!DOCTYPE html>
<html lang="hu">
<head>
	<meta charset="UTF-8">
	<title>MO0VEY űrlap feldolgozása 1</title>
	<style>
		body {
			font-family: Arial, Helvetica, sans-serif;
		}

		table {
			border-collapse: collapse;
			margin-top: 20px;
		}

		th, td {
			border: 1px solid #000;
			padding: 5px 10px;
		}

		.error {
			color: red;
			font-weight: bold;
		}
	</style>
</head>
<body>
	<h1>Űrlap adatai ellenőrzéssel (MO0VEY_feldolgozo1.php)</h1>
	<?php
		$nev = isset($_POST["nev"]) ? trim($_POST["nev"]) : "";
		$pin = isset($_POST["pin"]) ? trim($_POST["pin"]) : "";
		$gyumolcs = isset($_POST["gyumolcs"]) ? $_POST["gyumolcs"] : "";
		$eletkor = isset($_POST["eletkor"]) ? $_POST["eletkor"] : "";
		$labmeret = isset($_POST["labmeret"]) ? $_POST["labmeret"] : "";
		$onbizalom = isset($_POST["onbizalom"]) ? $_POST["onbizalom"] : "";

		$hibak = [];

		if ($nev === "") {
			$hibak[] = "A név megadása kötelező.";
		} elseif (!preg_match("/^[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű\s]{3,}$/u", $nev)) {
			$hibak[] = "A név csak betűket és szóközt tartalmazhat, legalább 3 karakter hosszan.";
		}

		if ($pin === "") {
			$hibak[] = "A PIN kód megadása kötelező.";
		} elseif (!preg_match("/^[0-9]{4}$/", $pin)) {
			$hibak[] = "A PIN kód 4 számjegyből álljon.";
		}

		if (count($hibak) > 0) {
			echo "<div class='error'>";
			foreach ($hibak as $hiba) {
				echo htmlspecialchars($hiba) . "<br>";
			}
			echo "</div>";
		} else {
			echo "<p>Nincs hiba az ellenőrzött adatokban.</p>";
		}

		$fajl = fopen("MO0VEY_adatok.txt", "a");
		if ($fajl) {
			$adatSor = $nev . ";" . $pin . ";" . $gyumolcs . ";" . $eletkor . ";" . $labmeret . ";" . $onbizalom . "\n";
			fwrite($fajl, $adatSor);
			fclose($fajl);
		}
	?>

	<table>
		<tr><th>Mező</th><th>Érték</th></tr>
		<tr><td>Név</td><td><?php echo htmlspecialchars($nev); ?></td></tr>
		<tr><td>PIN kód</td><td><?php echo htmlspecialchars($pin); ?></td></tr>
		<tr><td>Kedvenc gyümölcs</td><td><?php echo htmlspecialchars($gyumolcs); ?></td></tr>
		<tr><td>Életkor</td><td><?php echo htmlspecialchars($eletkor); ?></td></tr>
		<tr><td>Lábméret</td><td><?php echo htmlspecialchars($labmeret); ?></td></tr>
		<tr><td>Önbizalom</td><td><?php echo htmlspecialchars($onbizalom); ?></td></tr>
	</table>

	<p><a href="MO0VEY_urlap.html">Vissza az űrlapra</a></p>
</body>
</html>

