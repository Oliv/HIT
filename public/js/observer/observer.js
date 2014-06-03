var Observer = new Class({
    Implements: Events,

    _data: {},

    initialize: function (entity) {
        this.addEvent('notify', this.notify.bind(this));

        this.update(entity);
    },

    update: function(entity) {
        this._data = Object.clone(entity._data);
    },

    notify: function () {}
});