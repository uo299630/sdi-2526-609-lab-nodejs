function widgetAddSong() {
    $.ajax({
        url: URLbase + "/songs",
        type: "POST",
        data: {
            title: $("#title-add").val(),
            kind: $("#kind-add").val(),
            price: $("#price-add").val()
        },
        dataType: "json",
        headers: { "token": token },
        success: function (response) {
            console.log(response);
            $("#main-container").load("widget-songs.html");
        },
        error: function (error) {
            if (error.responseJSON && error.responseJSON.error && error.status === 400) {
                $("#widget-agregar")
                    .prepend("<div class='alert alert-danger'>" + error.responseJSON.error + "</div>");
            } else {
                $("#main-container").load("widget-login.html");
            }
        }
    });
}

