var Gun = new Class({
	Extends: Weapon,

	initialize: function(id, data, owner) {
		this.parent(id, data, owner);

        this._key = ['&', '1'];
    },

    /**
     * Show weapon
     *
     **/
    show: function() {
        if (this.animations.bullet === undefined) {
            var buffer = HIT.buffer,
                animation = HIT.animation,
                client = HIT.client,
                owner = this.owner;

            buffer.path(client.path + 'img/' + this.directory + '/');
            buffer.set(this.directory, 'bullet.png', function(image) {
                var canvas = new Element('canvas', {
                    width: this.get('size').x,
                    height: this.get('size').y
                });
                var ctx = canvas.getContext('2d');

                ctx.drawImage(image,
                    0,
                    0,
                    this.get('size').x,
                    this.get('size').y
                );

                var a = new AnimationCanvas(animation, {
                    canvas: canvas,
                    start: {
                        x: this.get('x'),
                        y: this.get('y')
                    },
                    onLoad: function() {
                        this.x = this.x - this.getCenter().x;
                        this.y = this.y - this.getCenter().y;

                        this.show();
                    },
                    onBeforeDraw: function() {
                        var map = HIT.game.map;

                        var rad = 0;
                        if (this.referer.get('moveType') === 'left') {
                            rad = 0;
                        } else if (this.referer.get('moveType') === 'right') {
                            rad = Math.PI;
                        } else if (this.referer.get('moveType') === 'up') {
                            rad = Math.PI/2;
                        } else if (this.referer.get('moveType') === 'down') {
                            rad = 3*Math.PI/2;
                        }
                        this.manager.ctx.save();
                        this.manager.ctx.translate(this.x + this.getCenter().x, this.y + this.getCenter().y);
                        this.manager.ctx.rotate(rad);
                        this.manager.ctx.translate(-this.x - this.getCenter().x, -this.y - this.getCenter().y);

                        var px = this.referer.get('speed') / (1000 / 60) * this.manager.time.delta;

                        if (this.referer.get('moveType') === 'left') {
                            this.x -= px;
                        } else if (this.referer.get('moveType') === 'right') {
                            this.x += px;
                        } else if (this.referer.get('moveType') === 'up') {
                            this.y -= px;
                        } else if (this.referer.get('moveType') === 'down') {
                            this.y += px;
                        }
                    },
                    onAfterDraw: function() {
                        this.manager.ctx.restore();
                    }
                }, this);

                this.animations.bullet = animation.add(a);
            }.bind(this));
        }

        return this;
    }
});