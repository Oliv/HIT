var Character = new Class({
    Extends: Entity,

    directory: null,

    _currentWeapon: null,
    moveType: null,
    _isAlive: true,
    _isBusy: false,

    initialize: function(id, data) {
        this.parent(id, data);

        this.directory = 'chars';

        this._currentWeapon = new Weapon('gun', {}, this);

        return this;
    },

    /**
     * Show Character
     *
     **/
    show: function() {
        if (this.animations.character === undefined) {
            var animation = HIT.animation,
                client = HIT.client;

            var a = new AnimationAnimated(animation, {
                image: HIT.data.avatars[this.get('avatar')],
                start: { x: this.get('x') || 0, y: this.get('y') || 0 },
                cases: { x: 4, y: 4 },
                step: 100,
                line: 2,
                autorun: this.get('autorun') || false,
                onLoad: function() {
                    this.x = this.x - this.getCenter().x;
                    this.y = this.y - this.getCenter().y;

                    if (this.referer.isPlayer()) {
                        $('map').setStyle('background-position', -this.x+'px '+-this.y+'px');
                        $('container').setStyle('top', (this.y / HIT.game.map.areaHeight * 100) + '%');
                        $('container').setStyle('left', (this.x / HIT.game.map.areaWidth * 100) + '%');
                    }


                    this.show();
                },
                onClicked: this.get('onClicked') || null,
                onEnter: this.get('onEnter') || null,
                onLeave: this.get('onLeave') || null
            }, this);

            this.animations.character = animation.add(a);
        }

        return this;
    },

    /**
     * Remove Character and all animations
     *
     **/
    remove: function() {
        HIT.animation.remove(this);
        this.animations = {};
    },

    /**
     * Déplace un perso vers une direction
     *
     **/
    move: function(data) {
        var client = HIT.client,
            a = this.animations.character;

        // Sens du personnage
        if (data.moveType === 'left') {
            a.options.line = a.MOVE_LEFT;
        } else if (data.moveType === 'right') {
            a.options.line = a.MOVE_RIGHT;
        } else if (data.moveType === 'up') {
            a.options.line = a.MOVE_TOP;
        } else {
            a.options.line = a.MOVE_BOTTOM;
        }
        a.buffer.moveType = data.moveType;
        a.buffer.time = {
            start: +new Date
        };
        a.buffer.px = 0;

        a.options.onBeforeDraw = function() {
            var start = this.buffer.time.start,
                now = +new Date,
                delta = now - start,
                speed = this.referer.get('speed'),
                serverFrameTime = 1000 / 60,
                serverPx = speed * delta / serverFrameTime,
                clientPx = this.buffer.px,
                deltaPx = serverPx - clientPx;


            if (this.buffer.moveType === 'left') {
                this.x -= deltaPx;
            } else if (this.buffer.moveType === 'right') {
                this.x += deltaPx;
            } else if (this.buffer.moveType === 'up') {
                this.y -= deltaPx;
            } else if (this.buffer.moveType === 'down') {
                this.y += deltaPx;
            }

            if (this.x < 0) {
                this.x = 0;
            }
            if (this.y < 0) {
                this.y = 0;
            }
            if (this.x > HIT.game.map.mapWidth) {
                this.x = HIT.game.map.mapWidth;
            }
            if (this.y > HIT.game.map.mapHeight) {
                this.y = HIT.game.map.mapHeight;
            }

			// Taille de la hauteur du perso
			// Calcul du ratio en fonction de l'angle
			var p = 0; // % de la position du perso par rapport a l'écran
			if ( this.y < 0)
				p = 0;
			else if ( this.y > HIT.game.map.areaHeight )
				p = 100;
			else
				p = this.y * 100 / HIT.game.map.areaHeight;

			// on divise pour que 50% = 1, 100% = 0.2, 0% = -0.2
			p = (p-50)/2.5/100;

			// repositionne le BG
                    if (this.referer.isPlayer()) {
            $('map').setStyle('background-position', (-this.x)+'px '+(-this.y)+'px');
                $('container').setStyle('top', (100 - this.y / HIT.game.map.areaHeight * 100) + '%');
                $('container').setStyle('left', (100 - this.x / HIT.game.map.areaWidth * 100) + '%');
                    }

			// calcul le nouveau ratio en fonction de l'angle de rotation du bg
			//this.ratio = 1 + p * HIT.game.map.angle/HIT.game.map.angleMax;
//console.log($('game').getStyles());
//$('game').setStyle('left',+-this.x+HIT.game.map.mapWidth);
//$('game').setStyle('top',+-this.y+HIT.game.map.mapHeight);
//console.log(this.x, HIT.data.avatars[HIT.game.player.avatar].width/4/2);
			//$('game').setStyle('transform', 'translateX('+-this.x-HIT.data.avatars[HIT.game.player.avatar].width+'px) translateY('+-this.y+'px) translateZ(0)');

            this.buffer.px = serverPx;
        }

        a.start();
    },

    /**
     * Stop déplacement
     *
     **/
    stop: function(data) {
        var client = HIT.client,
            a = this.animations.character;

        a.stop();

        this.update(data);

        a.options.onBeforeDraw = function() {};
        a.x = this.get('x') - a.getCenter().x;
        a.y = this.get('y') - a.getCenter().y;
    },

    fire: function(data) {
        this._isBusy = true;
        this._currentWeapon.update(data);
        this._currentWeapon.show();
    },

    hit: function() {
        this._currentWeapon.remove();
        this._isBusy = false;
    },

    dead: function() {
        HIT.websocket.send({ action: 'stop' });
        this.remove();
        this._isAlive = false;
    },

    revive: function() {
        this._isAlive = true;
        this._isBusy = false;

        this.show();
    },

    out: function() {
        this._currentWeapon.remove();
        this._isBusy = false;
    }
});