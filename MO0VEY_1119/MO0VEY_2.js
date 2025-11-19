$(document).ready(function(){
    var jqText = $("#jqLink").text();

    $("#k1").on("click", function(e){
        e.preventDefault();
        $("#lista1 li:lt(2), #jqLink").toggle();
    });

    $("#k2").on("click", function(e){
        e.preventDefault();
        $("#lista1 li:lt(2), #jqLink").toggle();
        $(this).toggle();
    });

    $("#k3").on("click", function(e){
        e.preventDefault();
        $("#fejlec, #lista1 li:lt(2), #jqLink").toggle();
    });

    $("#k4").on("click", function(e){
        e.preventDefault();
        if ($("#lista1 li:first").is(":visible")) {
            $("#lista1 li:lt(2), #jqLink").hide();
            $("#jqLink").text("");
        } else {
            $("#lista1 li:lt(2), #jqLink").show();
            $("#jqLink").text(jqText);
        }
    });

    $("#k5").on("click", function(e){
        e.preventDefault();
        $("#lista1 li:lt(2), #jqLink").toggle();
        $("#tabla1 tr:even").toggle();
    });
});
