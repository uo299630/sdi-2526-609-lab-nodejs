window.history.pushState("", "", "/apiclient/client.html?w=songs");
var selectedSongId;
var songs;
var priceDesc = true;
function loadSongs() {
    $.ajax({
        url: URLbase + "/songs",
        type: "GET",
        data: {},
        dataType: "json",
        headers: { "token": token },
        success: function (response) {
            songs = response.songs;
            updateSongsTable(songs);
        },
        error: function () {
            $("#main-container").load("widget-login.html");
        }
    });
}
function updateSongsTable(songs) {
    $("#songsTableBody").empty();
    for (var i = 0; i < songs.length; i++) {
        $("#songsTableBody").append(
            "<tr id='" + songs[i]._id + "'>" +
            "<td>" + songs[i].title + "</td>" +
            "<td>" + songs[i].kind + "</td>" +
            "<td>" + songs[i].price + "</td>" +
            "<td>" +
            "<a onclick=\"songDetail('" + songs[i]._id + "')\">Detalles</a><br>" +
            "<a onclick=\"songDelete('" + songs[i]._id + "')\">Eliminar</a>" +
            "</td>" +
            "</tr>"
        );
    }
}
$('#filter-by-name').on('input', function () {
    if (!songs) {
        return;
    }
    var filteredSongs = [];
    var filterValue = $("#filter-by-name").val();
    filteredSongs = songs.filter(function (song) {
        return song.title.toLowerCase().includes(filterValue.toLowerCase());
    });
    updateSongsTable(filteredSongs);
});
function sortByPrice() {
    if (priceDesc) {
        songs.sort(function (a, b) {
            return parseFloat(a.price) - parseFloat(b.price);
        });
    } else {
        songs.sort(function (a, b) {
            return parseFloat(b.price) - parseFloat(a.price);
        });
    }
    updateSongsTable(songs);
    priceDesc = !priceDesc;
}
function sortByTitle() {
    songs.sort(function (a, b) {
        if (a.title > b.title) return 1;
        if (a.title < b.title) return -1;
        return 0;
    });
    updateSongsTable(songs);
}
function songDelete(_id) {
    $.ajax({
        url: URLbase + "/songs/" + _id,
        type: "DELETE",
        data: {},
        dataType: "json",
        headers: { "token": token },
        success: function () {
            console.log("Canción eliminada: " + _id);
            $("#" + _id).remove();
        },
        error: function (error) {
            if (error.responseJSON && error.responseJSON.error && (error.status === 400 || error.status === 403 || error.status === 404)) {
                $("#widget-songs")
                    .prepend("<div class='alert alert-danger'>" + error.responseJSON.error + "</div>");
            } else {
                $("#main-container").load("widget-login.html");
            }
        }
    });
}
function songDetail(_id) {
    selectedSongId = _id;
    $("#main-container").load("widget-detail.html");
}
function widgetAddSong() {
    $("#main-container").load("widget-add.html");
}
loadSongs();

