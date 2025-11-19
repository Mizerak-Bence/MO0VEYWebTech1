$(document).ready(function(){
    $("#k1").on("click", function(e){
        e.preventDefault();
        $("#lista1 li:lt(2), #jqLink").hide();
    });

    $("#k2").on("click", function(e){
        e.preventDefault();
        $("#lista1 li:lt(2), #jqLink").hide();
        $(this).hide();
    });

    $("#k3").on("click", function(e){
        e.preventDefault();
        $("#fejlec, #lista1 li:lt(2), #jqLink").hide();
    });

    $("#k4").on("click", function(e){
        e.preventDefault();
        $("#lista1 li:lt(2), #jqLink").hide();
        $("#jqLink").text("");
    });

    $("#k5").on("click", function(e){
        e.preventDefault();
        $("#lista1 li:lt(2), #jqLink").hide();
        $("#tabla1 tr:even").hide();
    });
});
