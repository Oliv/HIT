define(function(require) {
    return {
        'Static' : require('./animation/static'),
        'Canvas' : require('./animation/canvas'),
        'Animated' : require('./animation/animated'),
        'Manager' : require('./animation/manager')
    };
});