/*
---
description: Animation connector : static image

license: MIT-style

authors: Olivier Gasc (gasc.olivier@gmail.com)

requires:
- AnimationManager
- Options

provides: [AnimationStatic]
...
*/

define(function(require) {
    return new Class({
        Implements: Options,

        manager: null,
        referer: null,
        ratio: null,
        buffer: {},
        width : 0,
        height : 0,
        x: 0,
        y: 0,
        layer: null,
        shown: false,
        loaded: false,

        options: {
            image: null,
            start: { x: 0, y: 0 },
            cases: { x: 1, y: 1 },
            offset: { x: 0, y: 0 },
            layer: 0,

            onLoad: function() {},
            onBeforeDraw: function() {},
            onHide: function() {},
            onShow: function() {},
            onClicked: null,
            onEnter: null
        },

        initialize: function(manager, options, referer) {
            if (!manager) return this // TODO motherfuckin bug

            this.setOptions(options)

            if (referer !== undefined) this.referer = referer

            this.manager = manager
            this.x = this.options.start.x
            this.y = this.options.start.y

            this.layer = manager.LAYER_DEFAULT + this.options.layer

            if (this.options.image) this.onLoad(this.options.image)

            return this
        },

        onLoad: function(img) {
            this.width = +this.options.image.width
            this.height = +this.options.image.height

            this.loaded = true

            this.options.onLoad.attempt([], this)
        },

        draw: function() {
            this.options.onBeforeDraw.attempt([], this)

            if (this.manager.debug) {
                this.manager.ctx.fillStyle ="rgba(200, 0, 0, .4)";
                this.manager.ctx.fillRect(
                    (this.options.offset.x + this.x) * (this.ratio || this.manager.ratio),
                    (this.options.offset.y + this.y) * (this.ratio || this.manager.ratio),
                    this.getFrameSize(true).x,
                    this.getFrameSize(true).y
                )
            }

            this.manager.ctx.drawImage(
                this.options.image,
                0,
                0,
                this.width / this.options.cases.x,
                this.height / this.options.cases.y,
                (this.options.offset.x + this.x) * (this.ratio || this.manager.ratio),
                (this.options.offset.y + this.y) * (this.ratio || this.manager.ratio),
                this.getFrameSize(true).x,
                this.getFrameSize(true).y)
        },

        hide: function() {
            if (this.loaded && this.shown) {
                this.shown = false
                this.options.onHide.attempt([], this)
            }

            return this
        },

        show: function() {
            if (this.loaded && !this.shown) {
                this.shown = true
                this.options.onShow.attempt([], this)
            }

            return this
        },

        getRefererType: function() {
            return typeOf(this.referer) === 'object' ? instanceOf(this.referer) : this.referer
        },

        getFrameSize: function(useRatio) {
            return {
                x: this.width / this.options.cases.x * (useRatio ? (this.ratio || this.manager.ratio) : 1),
                y: this.height / this.options.cases.y * (useRatio ? (this.ratio || this.manager.ratio) : 1)
            }
        },

        getCenter: function(useRatio) {
            return {
                x: this.getFrameSize(useRatio).x / 2,
                y: this.getFrameSize(useRatio).y / 2
            }
        }
    });
});