define(function() {
    var Observer = require('observer/observer');

    return new Class({
        Extends: Observer,

        notify: function (entity, event) {
            switch (event) {
                case 'EVENT_ENTITY_DEAD':
                    this.dead(entity);
                    break;
                case 'EVENT_ENTITY_KILL':
                    this.kill(entity);
                    break;
                case 'EVENT_ENTITY_HIT':
                    this.hit(entity);
                    break;
            }

            this.update(entity);
        },

        dead: function (entity) {
            // You dead ! +1 to killer
            if (entity.isPlayer()) {
                console.info('You dead ! +1 to killer');
            } else {
                console.info('This guy\'s dead !', entity);
            }

            // You killed !
            if (entity._lastKiller.isPlayer())
                console.info('You killed !', entity);
        },

        hit: function (entity) {
            // Your weapon hit !
            if (entity.isPlayer())
                console.info('Your weapon hit !');
        }
    });
});