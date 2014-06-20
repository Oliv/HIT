define(function(require) {
    return new Class({
        _isPlayer: false,
        _data: {},

        observers: [],
        animations: {},

        id: null,

        initialize: function (id, data) {
            this.id = id;

            this._data = data;

            this._isPlayer = id === HIT.client.idPlayer;
        },

        addObserver: function (id, observer) {
            this.observers[id] = observer;

            return this;
        },

        removeObserver: function (id) {
            delete this.observers[id];

            return this;
        },

        notify: function (event) {
            for (var i in this.observers) {
                if (this.observers.hasOwnProperty(i)) {
                    this.observers[i].notify(this, event);
                }
            }

            return this;
        },

        get: function (prop) {
            if (this._data[prop] !== undefined) {
                return this._data[prop];
            }

            return null;
        },

        set: function (prop, val) {
            if (this._data[prop] !== undefined) this._data[prop] = val;
            return this;
        },

        update: function (data) {
            for (var i in data) {
                this._data[i] = data[i];
            }
            return this;
        },

        isPlayer: function () {
            return this._isPlayer;
        },

        isTeammate: function (entity) {
            return this.get('equipe') === entity.get('equipe');
        }
    });
});