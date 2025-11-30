$(document).ready(function(){
    // Animáció indítása: zöld doboz mozogjon jobbra-balra (pl. left margin változtatása)
    $("#animacioInditas").on("click", function(e){
        e.preventDefault();
        $("#doboz").animate({ marginLeft: "150px" }, 1000)
                   .animate({ marginLeft: "0px" }, 1000);
    });

    // Bekezdések elrejtése: a 3 leíró bekezdés elrejtése/újra megjelenítése
    $("#bekezdesElrejt").on("click", function(e){
        e.preventDefault();
        $("#leiras1, #leiras2, #leiras3").slideToggle(600);
    });

    // Összecsuk / Kinyit: a zöld doboz fel-le csukása
    $("#osszecsuk").on("click", function(e){
        e.preventDefault();
        $("#doboz").slideToggle(600);
    });
});
