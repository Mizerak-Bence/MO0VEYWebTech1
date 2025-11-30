$(document).ready(function(){
    $("#link1").on("click", function(e){
        e.preventDefault();
        $("#p1").hide();
    });

    $("#link2").on("dblclick", function(e){
        e.preventDefault();
        $("#p2").hide();
    });

    $("#vissza").on("click", function(e){
        e.preventDefault();
        $("#p1, #p2").show();
    });

    $("#jelszoToggle").on("click", function(e){
        e.preventDefault();
        var mezo = $("#jelszo");
        if (mezo.attr("type") === "password") {
            mezo.attr("type", "text");
            $(this).text("Elrejt");
        } else {
            mezo.attr("type", "password");
            $(this).text("Mutat");
        }
    });
});
