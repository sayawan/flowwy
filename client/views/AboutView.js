var View          = famous.core.View;
var Surface       = famous.core.Surface;
var Transform     = famous.core.Transform;
var StateModifier = famous.modifiers.StateModifier;

var FlexScrollView = flex.FlexScrollView;
var CollectionLayout = flex.layouts.CollectionLayout;

famodev.helpers;
var ReactiveTemplate = famodev.ReactiveTemplate;

/*
 * @name AboutView
 * @constructor
 * @description
 */

AboutView = function() {
    View.apply(this, arguments);

    _createScrollView.call(this);

    var self = this;
    Tracker.autorun(function(c) {
        if (FlowRouter.subsReady("ItemsSub")) {
            self._eventOutput.trigger('load end');
            c.stop();
            console.log("show page");
        } else {
            self._eventOutput.trigger('load start');
            console.log("show loading screen");
        }
    });

    this._eventInput.on('ready', function() {
        console.info("AboutView.js is ready");

        // var subs = Meteor.subscribe('items');
        this.handle = Items.find().observeChanges({
            added: function (id, fields) {
                _createSurf.call(self, id, fields);
            }
        });
    }.bind(this));

    this._eventInput.on('leave', function() {
        console.info("leaving AboutView.js");
        this.handle.stop();
    }.bind(this));

    // _createBack.call(this);
}

AboutView.prototype = Object.create(View.prototype);
AboutView.prototype.constructor = AboutView;

AboutView.DEFAULT_OPTIONS = {
};

function _createBack() {
    var surface = new Surface({
        size: [500, 500],
        content: "Hello from About View",
        properties: {
            'background-color': 'yellow'
        }
    });

    surface.on('click', function() {
        FlowRouter.go('/home');
    });

    var modifier = new StateModifier({
        origin: [0.5, 0.5],
        align: [0.5, 0.5]
    });

    this.add(modifier).add(surface);
}

function _createScrollView() {
    this.surfaces = []
    this.scrollView = new FlexScrollView({
      layout: CollectionLayout,
        useContainer: true,
        container: { // options passed to the ContainerSurface
            properties: {
                overflow: 'hidden'
            }
        },
        alwaysLayout: true,
        flow: true,             // enable flow-mode (can only be enabled from the constructor)
        flowOptions: {
            spring: {               // spring-options used when transitioning between states
                dampingRatio: 0.8,  // spring damping ratio
                period: 1000        // duration of the animation
            },
            insertSpec: {           // render-spec used when inserting renderables
                opacity: 0          // start opacity is 0, causing a fade-in effect,
                //size: [0, 0],     // uncommented to create a grow-effect
                //transform: Transform.translate(-300, 0, 0) // uncomment for slide-in effect
            }
            //removeSpec: {...},    // render-spec used when removing renderables
        },
        mouseMove: true,
        // direction: 0,
        // autoPipeEvents: true,
      layoutOptions: {
        cells: [4, 2.5],
        // itemSize: [300, 300],    // item has width and height of 100 pixels
        margins: [10, 5, 10, 5], // outer margins
        spacing: [10, 10]        // spacing between items
      },
        dataSource: this.surfaces,
        pullToRefreshFooter: _refreshSurface()
    });

    this.scrollView.state = new StateModifier({
        origin: [0.5, 0.5],
        align: [0.5, 0.5]
    });

    this.scrollView.on('refresh', function(event) {
        var currenRoute = FlowRouter._current.route;
        currenRoute.handle.loadNextPage();

        // famous.utilities.Timer.setTimeout(function() {
        // }.bind(this), 1000);
        var self = this;
        Tracker.autorun(function () {
            if (currenRoute.handle.ready()) {
                console.log("[subscriptions ready]");
                self.scrollView.hidePullToRefresh(true);
            }
        });
    }.bind(this));

    this.scrollView.push(_insertSurface());

    this.add(this.scrollView.state).add(this.scrollView);
}

function _refreshSurface() {
    var surf = new Surface({
        size: [undefined, 40],
        content: 'pull to refresh footer',
        classes: [],
        properties: {
            color: 'white',
            textAlign: 'center',
            backgroundColor: '#FA5C4F'
        }
    });

    return surf;
}

function _insertSurface() {
    var surf = new Surface({
        content: 'insert new item',
        classes: [],
        properties: {
            color: 'white',
            textAlign: 'center',
            backgroundColor: '#FFFF66'
        }
    });

    surf.on('click', function() {
        Items.insert({ text: 'newly inserted item' });
    }) 

    return surf;
}

// 
// IT IS BETTER TO CREATE NEW VIEW (ItemView.js)
// I JUST GO WITH RENDERNODE
// 
function _createSurf(id, data) {
    var node = new famous.core.RenderNode();

    var surf = new ReactiveTemplate({
        size: [undefined, undefined],
        template: Template.surface,
        data: data,
        classes: [],
        properties: {
            color: 'black',
            textAlign: 'center',
            backgroundColor: 'white'
        }
    });

    surf.on('click', function(event) {
        FlowRouter.go('/item/'+id);
    });

    var remove = new Surface({
        size: [true, 30],
        content: 'REMOVE',
        classes: [],
        properties: {
            color: 'white',
            textAlign: 'center',
            cursor: 'default',
            backgroundColor: '#FA5C4F',
            zIndex: 1
        }
    });

    remove.state = new StateModifier({
        align: [0.5, 1],
        origin: [0.5, 1],
        transform: Transform.translate(0, 0, 1)
    });

    var self = this;
    remove.on('click', function(event) {
        Items.remove(id, function(error, result) {
            self.scrollView.remove(surf);
        });
    });

    // surf.pipe(this.scrollView);
    // console.log(surf);
    // console.log(this.surfaces.length);
    node.add(surf.state).add(surf);
    node.add(remove.state).add(remove);

    // famous.utilities.Timer.setTimeout(function() {}, 100);
    
    // RANDOM INSERT
    var num = (Math.floor(Math.random() * FlowRouter._current.route.handle.loaded()) + 1) || -1;
    this.scrollView.insert(num, node);

    // NORMAL 
    // this.scrollView.push(node);
}