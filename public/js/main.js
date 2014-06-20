require(['require', 'data/avatars', 'game'], function(require, avatars, Game) {
    window.addEvent('domready', function() {
        HIT.game = new Game();
    });
});