/*
---
description: Animation manager

license: MIT-style

authors: Olivier Gasc (gasc.olivier@gmail.com)

requires:
- Events
- Element
- Element.Dimensions
- Array
- Function

provides: [AnimationManager]
...
*/

// shim layer with setTimeout fallback
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60)
            }
})()

define(function(require) {
    var AnimationStatic = require('animation/static');

    return new Class({
        LAYER_DEFAULT : 100,        // Reference layer equals to 0 (because we can't iterate through negative indexes)

        time: { delta: 0, old: 0 }, // Time elapsed stored between 2 frames
        running: false,             // State of the rendering
        canvas: null,               // The canvas id to render in
        ctx: null,                  // Stored context
        layers: [],                 // Layers containing objects
        debug: false,               // Debug mode (display hitboxes)
        ratio: 1,                   // Ratio to apply to the canvas proportions
        currentlyOver: null,        // State triggered when mouse is over an object

        /**
         * Constructor
         *
         */
        initialize: function(canvas) {
            // Assign class vars
            this.canvas = document.id(canvas)
            this.ctx = document.getElementById(canvas).getContext('2d')

            // Launch the rendering loop
            this.play()

            // Attach events
            this.canvas.addEvents({
                click: function(e) {
                    var p = this.canvas.getPosition(),
                        scroll = window.getScroll()
                        x = scroll.x + e.client.x / this.ratio - p.x,
                        y = scroll.y + e.client.y / this.ratio - p.y,
                        a = []

                    // Find object clicked with onClicked function defined, top to bottom layer, break loops if found
                    find:
                    for (var i = this.layers.length - 1; i >= 0; i--) {
                        if (this.layers[i] !== undefined) {
                            a = this.layers[i]
                            for (var j = a.length - 1; j >= 0; j--) {
                                if (a[j] !== undefined && a[j].options.onClicked) {
                                    if (x >= a[j].x + a[j].options.offset.x
                                            && x <= a[j].x + a[j].options.offset.x + a[j].getFrameSize().x
                                            && y >= a[j].y + a[j].options.offset.y
                                            && y <= a[j].y + a[j].options.offset.y + a[j].getFrameSize().y) {
                                        a[j].options.onClicked.attempt([a[j], { x: x, y: y }], this)
                                        break find
                                    }
                                }
                            }
                        }
                    }
                }.bind(this),
                mousemove: function(e) {
                    var p = this.canvas.getPosition(),
                        scroll = window.getScroll()
                        x = scroll.x + e.client.x / this.ratio - p.x,
                        y = scroll.y + e.client.y / this.ratio - p.y,
                        a = [],
                        lastOver = this.currentlyOver

                    this.currentlyOver = null

                    // Find object overed with onEnter/onLeave function defined, top to bottom layer, break loops if found
                    find: {
                        for (var i = this.layers.length - 1; i >= 0; i--) {
                            if (this.layers[i] !== undefined) {
                                a = this.layers[i]
                                for (var j = a.length - 1; j >= 0; j--) {
                                    if (a[j] !== undefined && a[j].options.onEnter) {
                                        if (x >= a[j].x + a[j].options.offset.x
                                                && x <= a[j].x + a[j].options.offset.x + a[j].getFrameSize().x
                                                && y >= a[j].y + a[j].options.offset.y
                                                && y <= a[j].y + a[j].options.offset.y + a[j].getFrameSize().y) {

                                            this.currentlyOver = a[j]

                                            if (this.currentlyOver !== lastOver) {
                                                a[j].options.onEnter.attempt([a[j], { x: x, y: y }], this)
                                            }
                                            break find
                                        }
                                    }
                                }
                            }
                        }

                        if (!this.currentlyOver && lastOver && lastOver.options.onLeave) {
                            lastOver.options.onLeave.attempt([lastOver], this)
                        }
                    }
                }.bind(this)
            })

            return this
        },

        /**
         * Lauch rendering
         *
         */
        play: function() {
            this.running = true
            this.time.old = +new Date
            this.run()

            return this
        },

        /**
         * Stop rendering
         *
         */
        stop: function() {
            this.running = false

            return this
        },

        /**
         * Rendering loop
         *
         */
        run: function() {
            // Running ?
            if (this.running) {
                // Forever active loop
                requestAnimFrame(this.run.bind(this))

                // Clear canvas
                this.clear()

                // Render new frame
                this.render()

                // Time deltas
                var time = +new Date
                this.time.delta = time - this.time.old
                this.time.old = time
            }

            return this
        },

        /**
         * Render a frame
         *
         */
        render: function(time) {
            this.layers.each(function(layer, i) {
                // Sort objects in layers by y coord and size (bottom to top)
                layer.sort(function (a, b) {
                    if (a.y + (a.height / a.options.cases.y) > b.y + (b.height / b.options.cases.y))
                        return 1
                    if (a.y + (a.height / a.options.cases.y) < b.y + (b.height / b.options.cases.y))
                        return -1
                    return 0
                })

                // Call draw for each object, if he is loaded and shown
                layer.each(function(animationObjet) {
                    if (animationObjet.loaded && animationObjet.shown && animationObjet.draw !== undefined)
                        animationObjet.draw.attempt([], animationObjet)
                })
            })

            return this
        },

        /**
         * Clear the canvas
         *
         */
        clear: function() {
            this.ctx.clearRect(0, 0, this.canvas.getSize().x, this.canvas.getSize().y)

            return this
        },

        /**
         * Empty a layer/all layers
         *
         */
        empty: function(layer) {
            if (layer) {
                if (this.layers[this.LAYER_DEFAULT + layer] !== undefined)
                    this.layers.splice(this.LAYER_DEFAULT + layer)
            } else {
                this.layers = []
            }

            return this
        },

        /**
         * Add an animation, return the animation
         *
         */
        add: function(o) {
            if (this.layers[o.layer] === undefined) this.layers[o.layer] = []

            this.layers[o.layer].push(o)

            return o
        },

        /**
         * Remove an animation, or all object .animations if the var is found -> OTRAObject
         *
         */
        remove: function(o) {
            if (o.animations !== undefined) {
                // If the collection exists, iterates through it
                for (var i in o.animations) {
                    this.remove(o.animations[i]);
                }
            } else {
                // Disable display
                o.hide()

                if (this.layers[o.layer] !== undefined) {
                    // Remove object from its layer
                    for (var i = this.layers[o.layer].length - 1; i >= 0; i--) {
                        if (this.layers[o.layer][i] && this.layers[o.layer][i].referer.id === o.referer.id) {
                            this.layers[o.layer].splice(i, 1)
                            break
                        }
                    }

                    // Clear the layer if empty
                    if (this.layers[o.layer].length === 0) this.layers.splice(o.layer, 1)
                }
            }

            return this
        }
    });
});