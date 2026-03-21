module.exports = function (app,twig) {
    // 1. Rutas fijas (Estáticas) - Van PRIMERO
    app.get("/songs", function (req, res) {
        let songs = [{
            "title": "Blank space",
            "price": "1.2"
        }, {
            "title": "See you again",
            "price": "1.3"
        }, {
            "title": "Uptown Funk",
            "price": "1.1"
        }];

        let response = {
            seller: 'Tienda de canciones',
            songs: songs
        };

        res.render("shop.twig", response);
    });

    app.get('/songs/add', function (req, res) {
        res.render("add.twig");
    });

    app.post('/songs/add', function(req, res) {
        // Al ser GET, usamos req.query para leer los parámetros de la URL
        let response = "Cancion agregada: " + (req.body.title || "Sin título") + "<br>"
            + " genero: " + (req.body.kind || "Sin género") + "<br>"
            + " precio: " + (req.body.price || "0");
        res.send(response);
    });

    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(response));
    });

    // 2. Rutas con parámetros (Dinámicas) - Van AL FINAL
    app.get('/songs/:id', function(req, res) {
        let response = 'id: ' + req.params.id;
        res.send(response);
    });

    app.get('/songs/:kind/:id', function(req, res) {
        let response = 'id: ' + req.params.id + '<br>'
            + 'Tipo de música: ' + req.params.kind;
        res.send(response);
    });
    app.get('/promo*', function (req, res) {

        res.send('Respuesta al patrón promo*');
    });
    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    });
};