<!DOCTYPE html>
<html lang="hu">
<head>
	<meta charset="UTF-8">
	<title>MO0VEY űrlap feldolgozása</title>
	<style>
		body {
			font-family: Arial, Helvetica, sans-serif;
		}
	</style>
</head>
<body>
<?php
if (isset($_POST) && !empty($_POST)) {
	echo "<h2>HTML űrlap</h2>";

	$nev = $_POST["nev"];
	$pin = $_POST["pin"];
	$gyumolcs = $_POST["gyumolcs"];
	$eletkor = $_POST["eletkor"];
	$labmeret = $_POST["labmeret"];
	$onbizalom = $_POST["onbizalom"];

	echo "<p><strong>Név:</strong> " . htmlspecialchars($nev) . "</p>";
	echo "<p><strong>PIN kód:</strong> " . htmlspecialchars($pin) . "</p>";
	echo "<p><strong>Kedvenc gyümölcs:</strong> " . htmlspecialchars($gyumolcs) . "</p>";
	echo "<p><strong>Életkor:</strong> " . htmlspecialchars($eletkor) . "</p>";
	echo "<p><strong>Lábméret:</strong> " . htmlspecialchars($labmeret) . "</p>";
	echo "<p><strong>Önbizalom:</strong> " . htmlspecialchars($onbizalom) . "</p>";
} else {
	echo "<h2><strong>Űrlap nem lett beküldve!</strong></h2>";
}
?>
<a href="MO0VEY_urlap.html"><strong>Vissza az űrlapra.</strong></a>
</body>
</html>

