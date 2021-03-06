define(function(require) {
    var Entity = require('entity/entity');

    return new Class({
    	Extends: Entity,
        owner: null,
        _key: [],
        _isBusy: false,

    	initialize: function(id, data, owner) {
            this.directory = 'weapons';
            this.owner = owner;
            this._key = [];
            this._isBusy = false;

    		this.parent(id, data);
        },

        /**
         * Show weapon
         *
         **/
        show: function() {
            console.error('Inhéritance of Weapon::show needed');

            return this;
        },

        /**
         * Remove weapon and all animations
         *
         **/
        remove: function() {
            HIT.animation.remove(this);

            for (var i in this.animations) {
                delete this.animations[i];
            }
        }
    });
});