define(function(require) {
    var Weapon = require('entity/weapon'),
        AnimationCanvas = require('animation/canvas');

    return new Class({
    	Extends: Weapon,

    	initialize: function(id, data, owner) {
            this.parent(id, data, owner);

            this._key = ['é', '2'];
        },

        /**
         * Show weapon
         *
         **/
        show: function() {
            if (this.animations.landmine === undefined) {
                var buffer = HIT.buffer,
                    animation = HIT.animation,
                    client = HIT.client,
                    owner = this.owner;

                buffer.path(client.path + 'img/' + this.directory + '/');
                buffer.set(this.directory, 'landmine.png', function(image) {
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

                            this.buffer.framesDuration = Math.round(this.referer.get('activationTime') / 60);
                            this.buffer.frames = 0;

                            this.show();
                        },
                        onBeforeDraw: function() {
                            this.manager.ctx.save();

                            if (this.buffer.frames < this.buffer.framesDuration) {
                                this.manager.ctx.globalAlpha = -0.005 * this.buffer.frames + 0.8;
                            } else {
                                this.manager.ctx.globalAlpha = 0.3;
                            }
                        },
                        onAfterDraw: function() {
                            this.manager.ctx.restore();
                            this.buffer.frames++;
                        }
                    }, this);

                    this.animations.landmine = animation.add(a);
                }.bind(this));
            }

            return this;
        }
    });
});