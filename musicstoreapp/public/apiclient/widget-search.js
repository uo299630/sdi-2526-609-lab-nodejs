window.history.pushState("", "", "/apiclient/client.html?w=external");
function updateExternalSongs(songs) {
    $("#externalSongsBody").empty();
    for (var i = 0; i < songs.length; i++) {
        var previewLink = songs[i].previewUrl ? "<a href='" + songs[i].previewUrl + "' target='_blank'>Escuchar</a>" : "";
        $("#externalSongsBody").append(
            "<tr>" +
            "<td>" + songs[i].title + "</td>" +
            "<td>" + songs[i].artist + "</td>" +
            "<td>" + songs[i].album + "</td>" +
            "<td>" + previewLink + "</td>" +
            "</tr>"
        );
    }
}
$("#btn-search").click(function () {
    var term = $("#search-term").val();
    $.ajax({
        url: URLbase + "/search",
        type: "GET",
        data: { term: term },
        dataType: "json",
        success: function (response) {
            updateExternalSongs(response.songs);
        },
        error: function () {
            $("#widget-search")
                .prepend("<div class='alert alert-danger'>Se ha producido un error al buscar canciones externas.</div>");
        }
    });
});

