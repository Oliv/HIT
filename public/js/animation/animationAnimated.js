/*
---
description: Animation connector : sprite

license: MIT-style

authors: Olivier Gasc (gasc.olivier@gmail.com)

requires:
- AnimationManager
- AnimationStatic

provides: [AnimationAnimated]
...
*/

AnimationAnimated = new Class({
    Extends: AnimationStatic,

    MOVE_BOTTOM: 0,
    MOVE_LEFT: 1,
    MOVE_RIGHT: 2,
    MOVE_TOP: 3,

    timeLeft: null,
    pxLeft: null,

    currentFrame: 0,

    column: 0,
    periodical: null,

    options: {
        image: null,
        start: { x: 0, y: 0 },
        cases: { x: 1, y: 1 },
        offset: { x: 0, y: 0 },
        layer: 0,
        step: 100,
        line: 0,
        order: 1,
        autorun: false,

        onLoad: function() {},
        onBeforeDraw: function() {},
        onAfterDraw: function() {},
        onHide: function() {},
        onShow: function() {},
        onClicked: null,
        onEnter: null,
        onLeave: null
    },

    initialize: function(manager, options, referer) {
        this.setOptions(options)

        if (referer !== undefined) this.referer = referer

        this.manager = manager
        this.x = this.options.start.x
        this.y = this.options.start.y
        this.layer = manager.LAYER_DEFAULT + this.options.layer

        if (this.options.image) {
            this.onLoad(this.options.image)

            if (this.options.autorun && this.options.step)
                this.start()
        }

        return this
    },

    draw: function() {
        this.options.onBeforeDraw.attempt([this.timeLeft], this)

        if (this.manager.debug) {
            this.manager.ctx.fillStyle ="rgba(200, 0, 0, .4)";
            this.manager.ctx.fillRect(
                (this.options.offset.x + this.x) * this.manager.ratio,
                (this.options.offset.y + this.y) * this.manager.ratio,
                this.getFrameSize(true).x,
                this.getFrameSize(true).y
            )
        }

        this.manager.ctx.drawImage(
            this.options.image,
            this.column * this.width / this.options.cases.x,
            this.options.line * this.height / this.options.cases.y,
            this.width / this.options.cases.x,
            this.height / this.options.cases.y,
            (this.options.offset.x + this.x) * this.manager.ratio,
            (this.options.offset.y + this.y) * this.manager.ratio,
            this.getFrameSize(true).x,
            this.getFrameSize(true).y)

        this.options.onAfterDraw.attempt([], this)
    },

    stop: function() {
        if (this.periodical && !this.options.autorun) {
            clearInterval(this.periodical)
            this.periodical = null
        }
    },

    start: function() {
        if (!this.periodical) {
            this.periodical = setInterval(function() {
                this.column = this.column < this.options.cases.x - 1 ? this.column + 1 : 0
                this.currentFrame = this.currentFrame < this.options.cases.x ? this.currentFrame++ : 0
            }.bind(this), this.options.step)
        }
    }
});
