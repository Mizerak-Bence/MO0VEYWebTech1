$(document).ready(function () {
    var $box = $("#box");
    var animSpeed = 800; // ms

    // a) Animáció indítása
    $("#startAnim").on("click", function () {
        $box
            .stop(true, true)
            .css({
                left: "300px",
                width: "300px",
                fontSize: "12pt",
                height: "80px",
                top: "0px",
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
                alert("VÉGE");
            });
    });

    // b) Bekezdések elrejtése
    $("#hideP").on("click", function () {
        $("p").slideUp(600, function () {
            $box.animate({ top: "20px" }, 600, function () {
                alert("Bekezdések elrejtése");
            });
        });
    });

    // c) Összecsuk / Kinyit és jobbra mozgás
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
});
