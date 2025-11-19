$(document).ready(function(){
    $("#rejtes").on("click", function(e){
        e.preventDefault();
        $("#leiras1, #leiras2").slideToggle();
    });
});
