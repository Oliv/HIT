var connect = require('connect'),
    http = require('http'),
    fs = require('fs'),
    prime = require('prime'),
    websocket = require('websocket');

// serveur http
var app = connect()
    .use(connect.static('public'))
    .use(function(req, res, next) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf8');

        fs.readFile(__dirname + '/public/404.html', 'utf8', function (err, data) {
            if (err) {
                var body = '404 Not found';
                res.setHeader('Content-Length', body.length);
                res.end(body);
            } else {
                res.setHeader('Content-Length', data.length);
                res.end(data);
            }

        });
    });

var httpServer = http.createServer(app).listen(443);
console.info('Server running on port 443');

var Websocket = new prime({
    clients: [],
    servers: [],
    httpServer: null,

    constructor: function(http) {
        this.httpServer = new websocket.server({
            httpServer: http
        }).on('request', function(request) {
            var socket = request.accept(null, request.origin);

            socket.on('message', function(message) {/*console.log('message', message)*/
                if (message.type === 'utf8') {
                    // recuperation du message
                    var data = message.utf8Data;
                    try {
                        message = JSON.parse(data);
                    } catch(e) {
                        message = false;
                    }

                    // traitement du message
                    if (!message) {
                        console.error("message vide");
                    } else if (message.action === 'connexion') {
                        // connexion
                        var id = 0;
                        for (var i in this.clients) {
                            id = i > id ? i : id;
                        }

                        socket.id = +id + 1;
                        delete message.data.websocket;

                        var idServer = message.data.server;
                        if (this.servers[idServer] === undefined) {
                            var nbPlayers = 4;

                            this.servers[idServer] = new Server(idServer, 'Serveur ' + id, nbPlayers);

                            console.info('Creating server with id', idServer);
                        }

                        var server = this.servers[message.data.server],
                            client = new Client(server, socket, message.data);

                        this.addClient(client);
                        server.addClient(client);
                        client.send();

                        console.info(client.id, 'connecté au serveur', client.data.server);
                    } else if (this.clients[socket.id] && this.clients[socket.id][message.action]) {
                        // traite message
                        console.info(message.action, 'appelé par le client', socket.id);

                        this.clients[socket.id][message.action].call(this.clients[socket.id], message.data);
                    } else {
                        console.error(message, 'non traité');
                    }
                }
            }.bind(this));

            socket.on('close', function(reasonCode, description) {
                var client = this.clients[socket.id];

                if (client) {
                    // Deco
                    client.server.removeClient(client);
                    this.removeClient(client);

                    console.info(client.id, 'déconnecté du serveur', client.data.server);

                    // Empty server ?
                    if (client.server.currentPlayers === 0) {
                        // Remove server
                        var id = client.data.server;

                        if (this.servers[id] !== undefined) {
                            this.servers.splice(id, 1);

                            console.info('Removing empty server with id', id);
                        }
                    }
                }
            }.bind(this));
        }.bind(this));

        console.info('Websocket server running on port 443');
    },

    notify: function(id, message) {
        if (this.clients[id]) {
            this.clients[id].notify(message);
        }
    },

    broadcast: function(message, id) {
        id = id || false;

        if (id) {
            this.clients.forEach(function(client) {
                client.notify(message);
            });
        } else {
            this.clients.forEach(function(client) {
                if (client.id !== id) {
                    client.notify(message);
                }
            });
        }
    },

    addClient: function(client) {
        this.clients[client.id] = client;

        return this;
    },

    removeClient: function(client) {
        if (this.clients[client.id]) {
            delete this.clients[client.id];
        }

        return this;
    }
});




var Server = new prime({
    clients: [],
    id: null,
    name: null,
    players: null,
    currentPlayers: 0,
    mapSize: {
        x: 1200,
        y: 600
    },

    constructor: function(id, name, players) {
        this.id = id;
        this.name = name;
        this.players = players;
        this.clients = [];
        this.currentPlayers = 0;

        this.timeDead = 5;
    },

    notify: function(id, message) {
        if (this.clients[id]) {
            this.clients[id].notify(message);
        }
    },

    broadcast: function(message, id) {
        id = id || false;

        if (id) {
            this.clients.forEach(function(client) {
                if (client.id !== id) {
                    client.notify(message);
                }
            });
        } else {
            this.clients.forEach(function(client) {
                client.notify(message);
            });
        }
    },

    addClient: function(client) {
        if (this.currentPlayers < this.players) {
            this.clients[client.id] = client;
            this.currentPlayers++;

            client.notify({ action: 'authenticated', id: client.id, data: {
                server: this.id,
                message: 'Connecté au serveur ' + this.id
            } });

            this.broadcast({ action: 'connected', id: client.id, data: {
                type: 'player',
                name: client.data.name,
                avatar: client.data.avatar,
            } });

            this.clients.forEach(function(c) {
                if (c.id !== client.id) {
                    client.notify({ action: 'connected', id: c.id, data: c.data });
                }
            });

            this.sendStats();
        } else {
            client.notify({ action: 'authenticated', id: client.id, data: {
                server: null,
                message: 'Serveur plein'
            } });
        }

        return this;
    },

    removeClient: function(client) {
        if (this.clients[client.id]) {
            delete this.clients[client.id];

            this.currentPlayers--;

            this.broadcast({ action: 'disconnected', id: client.id, data: {
                server: this.id,
                message: 'Déconnecté au serveur ' + this.id
            } });
        }

        return this;
    },

    sendStats: function() {
        var stats = [];

        this.clients.forEach(function(client) {
            stats[client.id] = client.stats;
        }.bind(this));

        this.broadcast({ action: 'stats', data: stats });

        return this;
    },

    getHit: function(weapon) {
        var res = false,
            timer = require('nanotimer'),
            t = new timer();

        if (weapon.data.x, weapon.data.y, weapon.data.show) {
            this.clients.forEach(function(client) {
                if (client.isAlive() && weapon.getCenter().x > client.data.x - client.data.size.x/2 && weapon.getCenter().x < client.data.x + client.data.size.x/2
                        && weapon.getCenter().y > client.data.y - client.data.size.y/2 && weapon.getCenter().y < client.data.y + client.data.size.y/2) {
                    client.stop().dead();
                    weapon.client.stats.kills++;
                    res = true;

                    this.broadcast({ action: 'hit', id: weapon.client.id, data: {
                        target: client.id,
                        type: weapon.data.type,
                        message: client.id + ' tué par ' + weapon.client.id
                    } });

                    this.sendStats();

                    t.setTimeout(function(server, client) {
                        client.alive();

                        server.broadcast({ action: 'revive', id: client.id, data: {} });
                    }, [this, client], this.timeDead + 's');

                    return res;
                }
            }.bind(this));
        }

        return res;
    },

    getOut: function(weapon) {
        var out = false;

        if (weapon.data.x, weapon.data.y, weapon.data.show) {
            if (weapon.data.x < 0 || weapon.data.y < 0 || weapon.data.x > this.mapSize.x || weapon.data.y > this.mapSize.y) {
                out = true;

                this.broadcast({ action: 'out', id: weapon.client.id, data: {
                    target: null,
                    message: weapon.client.id + 'a perdu une munition'
                } });
            }
        }

        return out;
    }
});

var Entity = new prime({
    _moveInterval: null,
    data: {},
    MOVE_LEFT: 'left',
    MOVE_RIGHT: 'right',
    MOVE_UP: 'up',
    MOVE_DOWN: 'down',

    constructor: function(client) {
        this.data = {
            x: 0,
            y: 0,
            show: false,
            type: null,
            moveType: 'left',
            size: {
                x: 0,
                y: 0
            }
        };
    },

    getCenter: function() {
        return {
            x: this.data.x + this.data.size.x/2,
            y: this.data.y + this.data.size.y/2
        }
    }
});

var Weapon = new prime({
    inherits: Entity,
    client: null,

    constructor: function(client) {
        Weapon.parent.constructor.call(this);

        this.client = client;
        this._moveInterval = null;

        this.data.type = 'weapon';
        this.data.x = this.client.data.x;
        this.data.y = this.client.data.y;
    },

    stop: function() {
        if (this._moveInterval) {
            this._moveInterval.clearInterval();
            this._moveInterval = null;

            this.data.show = false;
        }
    }
});



var Gun = new prime({
    inherits: Weapon,

    constructor: function(client) {
        Gun.parent.constructor.call(this, client);

        this.data.type = 'gun';
        this.data.speed = 10;
        this.data.ammo = -1;
        this.data.size = {
            x: 17,
            y: 6
        };
    },

    activate: function() {
        var client = this.client,
            server = client.server,
            timer = require('nanotimer'),
            moveType = client.data.moveType,
            speed = this.data.speed;

        this.data.show = true;

        if (moveType === this.MOVE_LEFT) {
            this.data.x = client.data.x - client.data.size.x / 2 - this.data.size.x / 2;
        } else if (moveType === this.MOVE_RIGHT) {
            this.data.x = client.data.x + client.data.size.x / 2 + this.data.size.x / 2;
        } else if (moveType === this.MOVE_UP) {
            this.data.y = client.data.y - client.data.size.y / 2 - this.data.size.y / 2;
        } else if (moveType === this.MOVE_DOWN) {
            this.data.y = client.data.y + client.data.size.y / 2 + this.data.size.y / 2;
        }

        this._moveInterval = new timer();
        this._moveInterval.setInterval(function(weapon, server) {
            if (moveType === weapon.MOVE_LEFT) {
                weapon.data.x -= speed;
            } else if (moveType === weapon.MOVE_RIGHT) {
                weapon.data.x += speed;
            } else if (moveType === weapon.MOVE_UP) {
                weapon.data.y -= speed;
            } else if (moveType === weapon.MOVE_DOWN) {
                weapon.data.y += speed;
            }

            if (server.getHit(weapon) || server.getOut(weapon)) {
                weapon.stop();
            }
        }, [this, server], (1000 / 60) + 'm');

        this.data.moveType = moveType;
        server.broadcast({ action: 'fire', id: client.id, data: this.data });
    }
});


var Landmine = new prime({
    inherits: Weapon,

    constructor: function(client) {
        Landmine.parent.constructor.call(this, client);

        this.data.type = 'landmine';
        this.data.speed = 0;
        this.data.ammo = 5;
        this.data.activationTime = 1000;
        this.data.size = {
            x: 40,
            y: 40
        };
    },

    activate: function() {
        var client = this.client,
            server = client.server,
            timer = require('nanotimer'),
            t = new timer();

        this.data.x = client.getCenter().x;
        this.data.y = client.getCenter().y;

        this.data.show = true;

        server.broadcast({ action: 'fire', id: client.id, data: this.data });

        t.setTimeout(function(weapon, server) {
            weapon._moveInterval = new timer();
            weapon._moveInterval.setInterval(function(weapon, server) {
                if (server.getHit(weapon)) {
                    weapon.stop();
                }
            }, [weapon, server], (1000 / 60) + 'm');
        }, [this, server], this.data.activationTime + 'm');
    },

    stop: function() {
        if (this._moveInterval) {
            this.data.x = null;
            this.data.y = null;

            this._moveInterval.clearInterval();
            this._moveInterval = null;
        }
    }
});



var Client = new prime({
    inherits: Entity,

    id: null,
    server: {},
    socket: null,

    stats: {
        kills: 0,
        deaths: 0,
    },

    _weapons: [],
    _currentWeapon: null,
    _isAlive: true,

    constructor: function(server, socket, data) {
        Client.parent.constructor.call(this);

        this.server = server;
        this.socket = socket;
        this.id = socket.id;
        this.data = data;

        this.data.type = 'player';
        this.data.speed = 4;
        this.data.x = 600;
        this.data.y = 300;
        this.data.size = {
            x: 32,
            y: 48
        };
        this.data.moveType = this.MOVE_RIGHT;
        this.data.show = true;

        this.stats = {
            kills: 0,
            deaths: 0
        };

        this._weapons['gun'] = new Gun(this);
        this._weapons['landmine'] = new Landmine(this);
        this._currentWeapon = this._weapons['gun'];
    },

    send: function() {
        this.server.broadcast({ action: 'update', id: this.id, data: this.data });

        return this;
    },

    notify: function(message) {
        this.socket.sendUTF(JSON.stringify(message));

        return this;
    },

    move: function(message) {
        var timer = require('nanotimer');

        this.data.moveType = message;
        var s = +new Date;
        this._moveInterval = new timer();
        this._moveInterval.setInterval(function(entity) {
            var speed = entity.data.speed,
                moveType = entity.data.moveType;

            if (moveType === entity.MOVE_LEFT) {
                entity.data.x -= speed;
            } else if (moveType === entity.MOVE_RIGHT) {
                entity.data.x += speed;
            } else if (moveType === entity.MOVE_UP) {
                entity.data.y -= speed;
            } else if (moveType === entity.MOVE_DOWN) {
                entity.data.y += speed;
            }

            if (entity.data.x < entity.data.size.x + 82) {
                entity.data.x = entity.data.size.x + 82;
            }
            if (entity.data.y < entity.data.size.y + 24) {
                entity.data.y = entity.data.size.y + 24;
            }
            if (entity.data.x > entity.server.mapSize.x - entity.data.size.x/2) {
                entity.data.x = entity.server.mapSize.x - entity.data.size.x/2;
            }
            if (entity.data.y > entity.server.mapSize.y - entity.data.size.y/2) {
                entity.data.y = entity.server.mapSize.y - entity.data.size.y/2;
            }

        }, [this], (1000 / 60) + 'm');

        this.server.broadcast({ action: 'move', id: this.id, data: this.data });

        return this;
    },

    stop: function(message) {
        if (this._moveInterval) {
            this._moveInterval.clearInterval();
            this._moveInterval = null;

            this.data.show = false;

            this.server.broadcast({ action: 'stop', id: this.id, data: this.data });
        }

        return this;
    },

    fire: function() {
        var weapon = this._currentWeapon;

        weapon.data.x = this.data.x;
        weapon.data.y = this.data.y;
        weapon.data.show = true;

        weapon.activate();

        return this;
    },

    dead: function() {
        this.data.show = false;
        this._isAlive = false;

        this.stats.deaths++;

        return this;
    },

    alive: function() {
        this.data.show = true;
        this._isAlive = true;

        return this;
    },

    isAlive: function() {
        return this._isAlive;
    },

    changeWeapon: function(idWeapon) {
        this._currentWeapon = this._weapons[idWeapon];

        this.server.broadcast({ action: 'changeWeapon', id: this.id, data: idWeapon });

        return this;
    }
});

var websocketServer = new Websocket(httpServer);
