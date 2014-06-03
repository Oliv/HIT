var Client = new Class({
    Implements: [Options],

    options: {
        websocket: null,
        server: 1,
        name: 'Joueur',
        avatar: 'elf'
    },

    idPlayer: null,

    path: '/',

    entities: [],
    background: null,
    map: null,

    _keyPress: false,

    ctx: [],

    events: [],

    initialize: function(options) {
        // Intègre les options
        this.setOptions(options);

        // path
        var pathArray = window.location.pathname.split('/');
        for (var i = 1; i < pathArray.length - 1; i++) {
            this.path += pathArray[i] + '/';
        }

        // Rendering
		/*
		// OLD
        var canvas = new Element('canvas', {
            width: document.id('game').getSize().x,
            height: document.id('game').getSize().y,
            id: 'container'
        }).inject(document.id('game'));
        */

        var canvas = new Element('canvas', {
            width: HIT.game.map.mapWidth,
            height: HIT.game.map.mapHeight,
            id: 'container'
        }).inject($('game'));

        var animation = new AnimationManager('container');
        var buffer = new Buffer();
        HIT.animation = animation;
        HIT.buffer = buffer;

        buffer.path(this.path + 'img/bg/');
        buffer.set('bg', [
                'terre.jpg'
            ], function() {
                HIT.websocket = new MooWebSocket(this.options.websocket, {
                    logging: false,
                    json: true,
                    events: {
                        onOpen: function() {
                            // Chargement du perso et des configs de base
                            HIT.websocket.send({ action: 'connexion', data: this.options});
                        }.bind(this),
                        onMessage: function(e) { this.dispatchMessage(JSON.parse(e.data)); }.bind(this)
                    }
                });
            }.bind(this)
        );
    },

    dispatchMessage: function(data) {
        console.info('Received from server : ', data);

        // Actions
        if (data.action != undefined && typeof HIT.client[data.action] === 'function') {
            HIT.client[data.action].attempt(data, HIT.client);
        }
    },

    update: function(request) {
        if (this.entities[request.id]) {
            this.entities[request.id].update(request.data);

            if (request.data.show && request.data.show == 1) {
                this.entities[request.id].show();
            }
        }
    },

    move: function(request) {
        if (this.entities[request.id]) {
            this.entities[request.id].move(request.data);
        }
    },

    stop: function(request) {
        if (this.entities[request.id]) {
            this.entities[request.id].stop(request.data);
        }
    },

    fire: function(request) {
        if (this.entities[request.id]) {
            this.entities[request.id].fire(request.data);
        }
    },

    hit: function(request) {
        if (this.entities[request.id]) {
            this.entities[request.id].hit(request.data);

            if (request.data.target && this.entities[request.data.target]) {
                this.entities[request.data.target].dead();
            }
        }
    },

    revive: function(request) {
        if (this.entities[request.id]) {
            this.entities[request.id].revive();
        }
    },

    out: function(request) {
        if (this.entities[request.id]) {
            this.entities[request.id].out(request.data);
        }
    },

    authenticated: function(request) {
        this.idPlayer = request.id;
    },

    disconnected: function(request) {
        if (this.entities[request.id]) {
            HIT.animation.remove(this.entities[request.id]);
            delete this.entities[request.id];
        }
    },

    connected: function(request) {
        switch (request.data.type) {
            case 'player':
                this.entities[request.id] = new Character(request.id, request.data);
                if (request.data.show && request.data.show == 1) {
                    this.entities[request.id].show();
                }
                break;
            default: break;
        }

        if (this.entities[request.id].isPlayer()) {
            // events
            window.addEvent('keydown', function(e) {
                if (this.entities[this.idPlayer]._isAlive) {
                    if (e.key === 'left' || e.key === 'right' || e.key === 'up' || e.key === 'down') {
                        e.preventDefault();

                        if (this._keyPress && this._keyPress !== e.key) {
                            HIT.websocket.send({ action: 'stop' });
                            this._keyPress = false;
                        }

                        if (!this._keyPress) {
                            HIT.websocket.send({ action: 'move', data: e.key });
                            this._keyPress = e.key;
                        }
                    } else if (e.key === 'space') {
                        e.preventDefault();

                        if (!this.entities[this.idPlayer]._isBusy) {
                            HIT.websocket.send({ action: 'fire' });
                        }
                    }
                }
            }.bind(this)).addEvent('keyup', function(e) {
                if (this.entities[this.idPlayer]._isAlive) {
                    if (this._keyPress && this._keyPress === e.key) {
                        HIT.websocket.send({ action: 'stop' });
                        this._keyPress = false;
                    }
                }
            }.bind(this));
        }
    }
});