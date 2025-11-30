$(document).ready(function(){
    $("#szamol").on("click", function(e){
        e.preventDefault();

        var a = parseInt($("#aErtek").val(), 10);
        var b = parseInt($("#bErtek").val(), 10);

        if (isNaN(a) || isNaN(b)) {
            $("#eredmeny").text("hibás bevitel");
            return;
        }

        var muvelet = $("input[name='muvelet']:checked").val();
        var eredmenySzoveg = "";

        if (muvelet === "szorzas") {
            eredmenySzoveg = a * b;
        } else if (muvelet === "osztas") {
            if (b === 0) {
                eredmenySzoveg = "nullával nem osztható";
            } else {
                eredmenySzoveg = a / b;
            }
        } else if (muvelet === "osszeadas") {
            eredmenySzoveg = a + b;
        } else if (muvelet === "kivonas") {
            eredmenySzoveg = a - b;
        } else {
            eredmenySzoveg = "nincs kiválasztott művelet";
        }

        $("#eredmeny").text(eredmenySzoveg);
    });
});
