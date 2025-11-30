$(document).ready(function(){
    $("#elrejt").on("click", function(e){
        e.preventDefault();
        $("#leiras1, #leiras2, #leiras3").hide();
    });

    $("#megjelenit").on("click", function(e){
        e.preventDefault();
        $("#leiras1, #leiras2, #leiras3").show();
    });

    $("#kiBe").on("click", function(e){
        e.preventDefault();
        $("#leiras1, #leiras2, #leiras3").toggle();
        $("#elrejt, #megjelenit").toggle();
    });

    $("#atk05").on("click", function(e){
        e.preventDefault();
        $("#urlapDoboz").fadeTo(200, 0.5);
    });

    $("#atk08").on("click", function(e){
        e.preventDefault();
        $("#urlapDoboz").fadeTo(200, 0.8);
    });

    $("#atk1").on("click", function(e){
        e.preventDefault();
        $("#urlapDoboz").fadeTo(200, 1);
    });

    $("#elrejt2").on("click", function(e){
        e.preventDefault();
        $("#urlapDoboz").hide();
    });

    $("#megjelenit2").on("click", function(e){
        e.preventDefault();
        $("#urlapDoboz").show();
    });

    $("#kiBe2").on("click", function(e){
        e.preventDefault();
        $("#urlapDoboz").toggle();
        $("#elrejt2, #megjelenit2").toggle();
        $("#atk05, #atk08, #atk1").toggle();
    });
});
