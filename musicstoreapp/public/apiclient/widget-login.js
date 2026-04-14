window.history.pushState("", "", "/apiclient/client.html?w=login");
$("#boton-login").click(function () {
    $.ajax({
        url: URLbase + "/users/login",
        type: "POST",
        data: {
            email: $("#email").val(),
            password: $("#password").val()
        },
        dataType: "json",
        success: function (response) {
            console.log(response.token);
            token = response.token;
            Cookies.set('token', token);
            $("#main-container").load("widget-songs.html");
        },
        error: function () {
            Cookies.remove('token');
            $("#widget-login")
                .prepend("<div class='alert alert-danger'>Usuario no encontrado</div>");
        }
    });
});

