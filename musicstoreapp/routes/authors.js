module.exports = function (app) {
    let authors = [
        { name: 'Autor 1', group: 'Grupo A', rol: 'cantante' },
        { name: 'Autor 2', group: 'Grupo B', rol: 'trompetista' },
        { name: 'Autor 3', group: 'Grupo C', rol: 'violinista' },
        { name: 'Autor 4', group: 'Grupo D', rol: 'saxofonista' },
        { name: 'Autor 5', group: 'Grupo E', rol: 'pianista' }
    ];

    let roles = [
        'cantante',
        'trompetista',
        'violinista',
        'saxofonista',
        'pianista'
    ];

    app.get('/authors/add', function (req, res) {
        res.render('authors/add.twig', { roles: roles });
    });

    app.post('/authors/add', function (req, res) {
        let name = req.body.name;
        let group = req.body.group;
        let rol = req.body.rol;

        let response = '';

        if (name === undefined || name === null) {
            response += 'name no enviado en la petición.<br>';
        } else {
            response += 'Nombre: ' + name + '<br>';
        }

        if (group === undefined || group === null) {
            response += 'group no enviado en la petición.<br>';
        } else {
            response += 'Grupo: ' + group + '<br>';
        }

        if (rol === undefined || rol === null) {
            response += 'rol no enviado en la petición.<br>';
        } else {
            response += 'Rol: ' + rol + '<br>';
        }

        if (name !== undefined && name !== null &&
            group !== undefined && group !== null &&
            rol !== undefined && rol !== null) {
            authors.push({
                name: name,
                group: group,
                rol: rol
            });
        }

        res.send(response);
    });

    app.get('/authors', function (req, res) {
        res.render('authors/authors.twig', { authors: authors });
    });

    app.get('/author*', function (req, res) {
        res.redirect('/authors');
    });
};

