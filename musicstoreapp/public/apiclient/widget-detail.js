$.ajax({
    url: URLbase + "/songs/" + selectedSongId,
    type: "GET",
    data: {},
    dataType: "json",
    headers: {
        "token": token
    },
    success: function (response) {
        $("#title").val(response.song.title);
        $("#kind").val(response.song.kind);
        $("#price").val(response.song.price);
    },
    error: function () {
        $("#main-container").load("widget-login.html");
    }
});

