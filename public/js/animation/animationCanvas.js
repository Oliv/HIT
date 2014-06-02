/*
---
description: Animation connector : canvas

license: MIT-style

authors: Olivier Gasc (gasc.olivier@gmail.com)

requires:
- AnimationManager
- AnimationStatic

provides: [AnimationCanvas]
...
*/

AnimationCanvas = new Class({
    Extends: AnimationStatic,

    options: {
        canvas: null,
        start: { x: 0, y: 0 },
        cases: { x: 1, y: 1 },
        offset: { x: 0, y: 0 },
        layer: 0,

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

        if (this.options.canvas) this.onLoad(this.options.canvas)

        return this
    },

    onLoad: function(img) {
        this.width = +this.options.canvas.get('width')
        this.height = +this.options.canvas.get('height')
        this.loaded = true

        this.options.onLoad.attempt([], this)
    },

    draw: function() {
        this.options.onBeforeDraw.attempt([], this)

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
            this.options.canvas,
            0,
            0,
            this.width / this.options.cases.x,
            this.height / this.options.cases.y,
            (this.options.offset.x + this.x) * this.manager.ratio,
            (this.options.offset.y + this.y) * this.manager.ratio,
            this.getFrameSize(true).x,
            this.getFrameSize(true).y)

        this.options.onAfterDraw.attempt([], this)
    }
});
