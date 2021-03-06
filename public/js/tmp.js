//@todo: mowe all static data to config json file
/**
 * Keycode constants
 */
var KEY = {
    SHIFT: 16, CTRL: 17, ESC: 27, RIGHT: 39, UP: 38, LEFT: 37, DOWN: 40, SPACE: 32,
    A: 65, D: 68, E: 69, G: 71, L: 76,Q: 81, P: 80, R: 82, S: 83, T: 84, W: 87, Z: 90, OPENBRACKET: 219, CLOSEBRACKET: 221
};
/**
 * Size screen
 */
var MIN_SCREEN_SIZE = {x:640, y:480};

/**
 * Id dom element
 */
var DOM_OBJ_ID = "canvas";

/**
 * FPS constant
 */
var FRAME_RATE = 60;
/**
 * Ideal FPS constant
 */
var FPSMS = 1000 / FRAME_RATE;

/**
 * Force of gravity on Earth
 */
var GLOBAL_GRAVITY = 0.0;

var ROTATION_SHIP_SPEED = 2;
var ROTATION_SHIP_SPEED_LIMIT = 4;

var CENTER_SYSTEM_X = 100000000000;
var CENTER_SYSTEM_Y = 50000000000;

/**
 * meters in pixel by default
 */
var SCALE = 30;

var MIN_SCALE_SIZE = 0.00000001;

var MAX_SCALE_SIZE = 30;

/**
 * draw debug info
 */
var DEBUG = true;

var VELOCITY_ITERATIONS = 10;

var POSITION_ITERATIONS = 10;

var SCROLL_SPEED = 20; //in %

/**
 * Debug data
 */
var stats

var I = 0;

/**
 * Init som useful stuff for easier access (don't need 'em all)
 */
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2AABB = Box2D.Collision.b2AABB;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;

/**
 * Mouse activity variables
 */
var mouse_x;
var mouse_y;
var mousePVec;
var is_mouse_down;
var selectedBody;
var mouseJoint;

/**
 * Keyboard activity variable
 */
var pressed = {};

var scale = SCALE;

var world = {};

var debugDraw = {};

var ship = {};

var dom_obj = {};

var canvasPosition

/**
 * canvas object
 */
var context = {}

//for loop draw
var needToDraw = true
var shapes = {}
/**
 * on load page
 */
document.addEventListener('DOMContentLoaded',function(){

    // connection to the server via socked
    var socket = io.connect('',{'reconnect': false});
    socket

        .on('message', function (message) {
            console.log('message:'+message);
            //socket.emit('my other event', { my: 'data' });
        })
        .on('server_data', function(data){
            init.draw.solar_system_objects(world, data);
        })
        .on('connect', function(){
            console.log('socket connect');

            if(typeof Stats != 'undefined'){
                stats = new Stats();
                stats.setMode(0);
                stats.domElement.style.position = 'absolute';
                stats.domElement.style.right = '0px';
                stats.domElement.style.top = '0px';

                document.body.appendChild( stats.domElement );

            }
            init.start(DOM_OBJ_ID);


        })
        .on('disconnect', function(){
            console.log('socket disconnect');
            setTimeout(reconnect,500)
        });
    /**
     *
     */
    function reconnect(){
        socket.once('error', function(){
            setTimeout(reconnect, 500);
        });
        socket.socket.connect();

    }
});

/**
 * On update
 */
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, FPSMS);
        };
})();

/**
 * On resize
 */
/*
 window.addEventListener('resize', function(event){
 var dom_obj = document.getElementById(DOM_OBJ_ID);
 init.set_fullscreen(dom_obj);
 }, false);
 */
window.onresize = function(event) {
    //var dom_obj = document.getElementById(DOM_OBJ_ID);
    init.set_fullscreen(dom_obj);
}

/**
 * Initialization of applicaion
 */
//function init() {
var init = {
    start: function(id) {
        //@todo: refactor code!
        //mouse
        dom_obj = document.getElementById(DOM_OBJ_ID);
        context = dom_obj.getContext("2d");

        box2d.create.world();
        this.set_fullscreen(dom_obj);

        ship = this.draw.ship(world, 4,4,0.5);

        this.draw.rand_object(world);
        //this.draw.nav_grid(world);

        this.callbacks();
        //setup debug draw
        if (DEBUG){
            this.draw.debug_view(dom_obj, world);
        }

        //window.setInterval(update, FPSMS);
        canvasPosition = getElementPosition(dom_obj);

        (function hell() {
            if(typeof Stats != 'undefined'){
                stats.begin();
            }
            loop.step();
            loop.update();
            loop.draw();
            if(typeof Stats != 'undefined'){
                stats.end();
            }
            requestAnimFrame(hell);
        })();
    },
    draw: {
        /**
         *
         */
        text_field: function(text, szie, x, y){
            context.font = szie+'px "4pixel"';
            context.fillStyle="#fff";
            context.fillText(text, x, y);
        },
        /**
         *
         * @param x
         * @param y
         * @param r
         * @returns {*}
         */
        ship: function(world, x, y, r){
            var fixDef = new b2FixtureDef;
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;
            fixDef.density = 0.1;
            fixDef.shape = add.circle( r );
            //fixDef.angularDamping = 0.5;

            var bodyDef = new b2BodyDef;
            bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.x = x;
            bodyDef.position.y = y;
            var dynamicBody = world.CreateBody(bodyDef).CreateFixture(fixDef);
            dynamicBody.SetUserData('space_ship');
            return dynamicBody;
        },
        /**
         *
         * @param dom_obj
         * @param world
         */
        debug_view: function(dom_obj, world){
            debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(context);
            debugDraw.SetDrawScale(scale);
            debugDraw.SetFillAlpha(0.5);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            world.SetDebugDraw(debugDraw);
        },
        /**
         *
         * @param world
         */
        rand_object: function(world){
            var fixDef = new b2FixtureDef;
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;

            //create some objects
            var bodyDef = new b2BodyDef;
            bodyDef.type = b2Body.b2_dynamicBody;
            for (var i = 0; i < 1; ++i) {
                fixDef.shape = new b2PolygonShape;
                fixDef.shape.SetAsBox(
                    Math.random() + 0.1 //half width
                    , Math.random() + 0.1 //half height
                );
                bodyDef.position.x = 5;
                bodyDef.position.y = 5; //Math.pow(10, 10)
                world.CreateBody(bodyDef).CreateFixture(fixDef);
            }
        },
        /**
         *
         * @param size in pixel
         */
        cells: function (size) {
            size = size || 100;
            var canv = context.canvas;
            var w = context.canvas.width, h = context.canvas.height;
            var count = Math.ceil(Math.max(w, h) / size);
            context.save();
            context.beginPath();
            do {
                var line = count * size;
                context.moveTo(line, 0);
                context.lineTo(line, h);
                context.moveTo(0, line);
                context.lineTo(w, line);
            } while (count--);
            context.closePath();
            context.lineWidth = 0.3;
            context.strokeStyle = '#090';
            context.stroke();
            context.restore();
        },
        /**
         *
         * @param world
         */
        nav_grid: function(world){
            /*
             bodyShapePoligon.SetAsEdge(b2Vec2.Make(0 / Box2DHelpers.meters, 0 / Box2DHelpers.meters), b2Vec2.Make(800 / Box2DHelpers.meters, 0 / Box2DHelpers.meters));
             */
            /*
             var bodyDef = new b2BodyDef;
             bodyDef.type = b2Body.b2_staticBody;
             var fixDef = new b2FixtureDef;
             //fixDef.active = false;
             //fixDef.shape = new b2PolygonShape();
             //fixDef.shape.SetAsEdge( new b2Vec2(10,10) , new b2Vec2(10,10) );
             fixDef.shape = new b2CircleShape(2);
             bodyDef.position.Set(-1, -1);
             world.CreateBody(bodyDef).CreateFixture(fixDef);
             */

            //remove previous lines
            /*for (var b = world.GetBodyList(); b; b = b.m_next) {
             if(b.GetUserData() != null && b.GetUserData().name == "Line"){
             world.DestroyBody(b);
             //body.setUserData(null);
             //body = null;
             }
             }*/
            for (var b = world.GetBodyList(); b; b = b.m_next) {
                if(b.GetUserData() != null && b.GetUserData().name == "Line"){
                    //init.draw.update_line(b);
                    //lineCount++;
                    //if(dragMode && lineCount > 1) objScheduledForRemoval[++index] = b;
                } else if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
                    shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
                }
            }

            //add new lines
            var visible_world_x = context.canvas.width / scale;
            var visible_world_y = context.canvas.height / scale;
            multiplicity_x = 10;
            tries = 0
            while( (10 < parseInt(visible_world_x / multiplicity_x)) && tries < 20 ){
                multiplicity_x = multiplicity_x * 10;
                tries++;
            }
            for(i = 0; i < visible_world_x;i+=multiplicity_x){
                init.draw.line(new b2Vec2(i, 0),new b2Vec2(i, visible_world_y));
            }
            for(i = 0; i < visible_world_y;i+=multiplicity_x){
                init.draw.line(new b2Vec2(0, i),new b2Vec2(visible_world_x, i));
            }
        },
        /**
         *
         * @param start
         * @param end
         */
        line: function(start,end) {

            var fixDef = new b2FixtureDef;
            fixDef.shape = new b2PolygonShape;
            //fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = .5;
            fixDef.density = 0;
            fixDef.shape.SetAsArray([
                start,
                end],2
            );
            fixDef.filter.categoryBits = 2;
            fixDef.filter.maskBits = 2;

            var bodyDef = new b2BodyDef;
            bodyDef.type = b2Body.b2_staticBody;
            bodyDef.position.Set(0,0);
            rbData = new Object();
            rbData.name = "Line";
            rbData.start = start;
            rbData.end = end;
            bodyDef.userData = rbData;
            world.CreateBody(bodyDef).CreateFixture(fixDef);
        },
        /**
         *
         * @param b
         */
        update_line: function(b){

            start = b.GetUserData().start;
            end = b.GetUserData().end;
            context.save();
            context.beginPath();
            context.moveTo(start.x * scale,start.y * scale);
            context.lineTo(end.x * scale,end.y * scale);
            context.stroke();
            context.restore();
        },
        /**
         *
         * @param world
         * @param data
         */
        solar_system_objects: function(world, data){
            var bodyDef = new b2BodyDef;
            var fixDef = new b2FixtureDef;
            //create star
            if (data.star != undefined) {
                bodyDef.type = b2Body.b2_staticBody;
                fixDef.shape = new b2CircleShape(data.star.radius);

                bodyDef.position.Set(CENTER_SYSTEM_X, CENTER_SYSTEM_Y);
                world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            //create planets
            if (data.planets != undefined) {
                for (planetoit_id in data.planets) {
                    //create planets
                    if (data.planets[planetoit_id].perihelion != undefined) {
                        bodyDef.type = b2Body.b2_staticBody;
                        fixDef.shape = new b2CircleShape(data.planets[planetoit_id].radius);
                        bodyDef.position.Set(CENTER_SYSTEM_X  + data.planets[planetoit_id].orbit, CENTER_SYSTEM_Y);
                        world.CreateBody(bodyDef).CreateFixture(fixDef);
                    }
                }
            }
        }
    },
    /**
     * Resize the dom element
     */
    set_fullscreen: function(dom_obj){
        if (MIN_SCREEN_SIZE.x <= dom_obj.offsetWidth || MIN_SCREEN_SIZE.y <= dom_obj.offsetHeight) {
            var w = window,
                d = document,
                e = d.documentElement,
                g = d.getElementsByTagName('body')[0],
                x = w.innerWidth || e.clientWidth || g.clientWidth,
                y = w.innerHeight || e.clientHeight || g.clientHeight;

            if(dom_obj.offsetWidth != x){
                dom_obj.width = x-10/*+"px"*/;
            }
            if(dom_obj.offsetHeight != y){
                dom_obj.height = y-10/*+"px"*/;
            }
        }
    },
    callbacks: function() {
        /**
         * Mouse pressed
         */
        document.addEventListener("mousedown", function (e) {
            is_mouse_down = true;
            handlers.mouse_move(e);
            document.addEventListener("mousemove", handlers.mouse_move, true);
        }, true);

        /**
         * Mouse released
         */
        document.addEventListener("mouseup", function () {
            document.removeEventListener("mousemove", handlers.mouse_move, true);
            is_mouse_down = false;
            mouse_x = undefined;
            mouse_y = undefined;
        }, true);

        document.addEventListener('mousemove', function(e) {
            handlers.mouse_move(e);
        }, false);

        /**
         * Keyboard pressed
         */
        document.addEventListener('keydown', function(e){ pressed[e.keyCode] = true;});
        /**
         * Keyboard released
         */
        document.addEventListener('keyup', function(e){ delete pressed[e.keyCode]; });

        /**
         * Mouse scroll wheel move
         */
        if (document.addEventListener) {
            // IE9, Chrome, Safari, Opera
            document.addEventListener("mousewheel", handlers.mouse_wheel, false);
            // Firefox
            document.addEventListener("DOMMouseScroll", handlers.mouse_wheel, false);
        }
        // IE 6/7/8
        //else document.attachEvent("onmousewheel", MouseWheelHandler);
    }
};

/**
 * Box2dweb update function for redraw content
 */
var loop = {
    step: function() {

        //options: frame-rate, velocity iterations, position iterations
        world.Step(1 / FRAME_RATE, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
        world.ClearForces();
        /*
         var world_ship_pos = ship.GetBody().GetPosition();
         //cur position top left corner
         var canvas_ship_x = world_ship_pos.x * scale;

         var trans_x = (context.canvas.width - canvas_ship_x) / scale;
         var trans_y = 0;
         //context.clearRect( -100, -100, context.canvas.width, context.canvas.height);
         //move to center
         //context.clearRect(-1*CENTER_SYSTEM_X*scale + 100, -1*CENTER_SYSTEM_Y*scale + 100, context.canvas.width, context.canvas.height);
         var how_many = 2;
         if(I < how_many){
         I++
         //trans_x = 1;
         //context.translate(trans_x, trans_y);
         context.translate(10*scale, 10*scale);
         console.log('move');
         //context.translate(-1*CENTER_SYSTEM_X*scale + 100, -1*CENTER_SYSTEM_Y*scale + 100);
         //context.translate(canvasOffset.x, canvasOffset.y);
         //context.scale(scale,scale);
         //context.rotate(ship.GetAngle());
         }else if(I == how_many){
         I++
         //context.translate(-1 * (10 * how_many), -1 * (10 * how_many));
         }
         */
        /*
         for(var b = world.m_bodyList; b != null; b = b.m_next){
         if(b.GetUserData() == 'spaceship'){
         context.save();
         context.translate(b.GetPosition().x*worldScale,b.GetPosition().y*worldScale);
         context.rotate(b.GetAngle());
         context.drawImage(b.GetUserData(),-b.GetUserData().width/2,-b.GetUserData().height/2);
         context.restore();
         }
         }
         */
        /*
         if(!DEBUG){

         debugDraw.SetDrawScale(scale);
         world.DrawDebugData();

         }*/
        //context.clearRect( -100, -100, context.canvas.width, context.canvas.height);
    },
    update: function () {
        //friction for rotating ship
        friction_rotating_ship();

        //keyboard
        for(i in pressed) {
            handlers.key_pressed(i);
        }

        for (var b = world.GetBodyList(); b; b = b.m_next) {
            if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
                shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
            }
        }
        needToDraw = true;


        //set
        /*
         if (is_mouse_down && (!mouseJoint)) {
         var body = getBodyAtMouse();
         if (body) {
         var md = new b2MouseJointDef();
         md.bodyA = world.GetGroundBody();
         md.bodyB = body;
         md.target.Set(mouse_x, mouse_y);
         md.collideConnected = true;
         md.maxForce = 200.0 * body.GetMass();
         mouseJoint = world.CreateJoint(md);
         body.SetAwake(true);
         }
         }

         if (mouseJoint) {
         if (is_mouse_down) {
         mouseJoint.SetTarget(new b2Vec2(mouse_x, mouse_y));
         } else {
         world.DestroyJoint(mouseJoint);
         mouseJoint = null;
         }
         }*/
    },
    draw: function() {

        if (DEBUG) {
            debugDraw.SetDrawScale(scale);
            world.DrawDebugData();
        }

        if (!needToDraw) return;
        if (!DEBUG) ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i in shapes) {
            console.log(shapes[i]);
            shapes[i].draw(ctx);
        }

        needToDraw = false;

        var position = ship.GetBody().GetPosition();
        //draw information data
        init.draw.text_field("ZOM : " + (100/scale).toFixed(1), 16, (dom_obj.width/2+70), 20);

        init.draw.text_field("POS X : " + Math.round(position.x,2), 16, (dom_obj.width/2-50), 20);
        init.draw.text_field("POS Y : " + Math.round(position.y,2), 16, (dom_obj.width/2-50), 40);
        //init.draw.nav_grid(world);
        /*
         ctx.save();
         ctx.translate(-1*xpos+(640/2),-1*ypos+(480/2));
         ctx.rotate(0.2);
         ctx.drawImage(carSprite, -carspritewidth/2, -carspriteheight/2);
         ctx.restore();
         */
        /*
         for (var i in shapes) {
         shapes[i].draw();
         }
         */
    }
};

var box2d = {
    addToWorld: function(shape) {
        var bodyDef = this.create.bodyDef(shape);
        var body = world.CreateBody(bodyDef);
        if (shape.radius) {
            fixDef.shape = new b2CircleShape(shape.radius);
        } else {
            fixDef.shape = new b2PolygonShape;
            fixDef.shape.SetAsBox(shape.width / 2, shape.height / 2);
        }
        body.CreateFixture(fixDef);
    },
    create: {
        world: function() {
            world = new b2World(
                new b2Vec2(0, 0.0)    //gravity
                , true               //allow sleep
            );
            //set the gravity
            world.SetGravity(new b2Vec2(0, GLOBAL_GRAVITY));
        },
        defaultFixture: function() {
            var fixDef = new b2FixtureDef;
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;
        },
        bodyDef: function(shape) {
            var bodyDef = new b2BodyDef;

            if (shape.isStatic == true) {
                bodyDef.type = b2Body.b2_staticBody;
            } else {
                bodyDef.type = b2Body.b2_dynamicBody;
            }
            bodyDef.position.x = shape.x;
            bodyDef.position.y = shape.y;
            bodyDef.userData = shape.id;
            bodyDef.angle = shape.angle;

            return bodyDef;
        }
    },
    get: {
        bodySpec: function(b) {
            return {
                x: b.GetPosition().x,
                y: b.GetPosition().y,
                angle: b.GetAngle(),
                center: {
                    x: b.GetWorldCenter().x,
                    y: b.GetWorldCenter().y
                }
            };
        }
    }
};

var handlers = {
    /**
     *
     * @param key_code
     */
    key_pressed: function(key_code) {
        switch(parseInt(key_code)){
            case KEY.UP:
            case KEY.W: move_forward(); break; // w
            case KEY.LEFT:
            case KEY.A: turn_left(); break; // a
            case KEY.DOWN:
            case KEY.S: move_back(); break; // s
            case KEY.RIGHT:
            case KEY.D: turn_right(); break; // d
            case KEY.Q: strafe_left(); break; // q
            case KEY.E: strafe_right(); break; // e
        }
    },

    /**
     *
     * @param e
     */
    mouse_move: function(e) {
        mouse_x = (e.clientX - canvasPosition.x) / scale;
        mouse_y = (e.clientY - canvasPosition.y) / scale;
    },

    /**
     *
     * @param e
     */
    mouse_wheel: function(e) {
        var delta = e.detail < 0 || e.wheelDelta > 0 ? 1 : -1;
        if (delta < 0) {
            // scroll down
            if(scale > MIN_SCALE_SIZE){
                scale -= scale / 100 * SCROLL_SPEED;
            }
        } else {
            // scroll up
            if(scale < MAX_SCALE_SIZE){
                scale += scale / 100 * SCROLL_SPEED;
                scale += scale / 100 * SCROLL_SPEED;
            }
        }
    }
};
/**
 *
 */
function move_forward(){

    move(ship, 0);
}

/**
 *
 */
function turn_left(){
    ship_body = ship.GetBody();
    current_angular_velocity = ship_body.GetAngularVelocity();
    new_angular_velocity = current_angular_velocity - ROTATION_SHIP_SPEED;

    if (ROTATION_SHIP_SPEED_LIMIT > Math.abs(new_angular_velocity)){
        ship_body.SetAngularVelocity(new_angular_velocity);
    }
}

/**
 *
 */
function move_back(){
    move(ship, 180);
}

/**
 *
 */
function turn_right(){
    ship_body = ship.GetBody();
    current_angular_velocity = ship_body.GetAngularVelocity();
    new_angular_velocity = current_angular_velocity + ROTATION_SHIP_SPEED;

    if (ROTATION_SHIP_SPEED_LIMIT > Math.abs(new_angular_velocity)){
        ship_body.SetAngularVelocity(new_angular_velocity);
    }
}

/**
 *
 */
function strafe_left(){
    move(ship, -90);
}

/**
 *
 */
function strafe_right(){
    move(ship, 90);
}

/**
 *
 * @param obj
 * @param degrees
 */
function move(obj, degrees) {
    console.log(obj);
    console.log('move');
    var body = obj.GetBody();

    var method = (false) ? 'ApplyForce' : 'ApplyImpulse';
    var r = body.GetAngle();
    //try to get speed of the object
    var force = new b2Vec2(Math.cos( r + (degrees * Math.PI / 180) ), Math.sin( r + (degrees * Math.PI / 180)));
    body[method](force, body.GetPosition());
}

/**
 *
 * @returns {null}
 */
function getBodyAtMouse() {
    mousePVec = new b2Vec2(mouse_x, mouse_y);
    var aabb = new b2AABB();
    aabb.lowerBound.Set(mouse_x - 0.001, mouse_y - 0.001);
    aabb.upperBound.Set(mouse_x + 0.001, mouse_y + 0.001);

    // Query the world for overlapping shapes.
    selectedBody = null;
    world.QueryAABB(getBodyCB, aabb);
    return selectedBody;
}

/**
 *
 * @param fixture
 * @returns {boolean}
 */
function getBodyCB(fixture) {
    if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
        if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
            selectedBody = fixture.GetBody();
            return false;
        }
    }
    return true;
}

/**
 *
 */
function friction_rotating_ship(){
    //@todo: add the engine settings instead change this parameter by hand!
    ship_body = ship.GetBody();
    current_angilar_velocity = ship_body.GetAngularVelocity();
    if(current_angilar_velocity != 0){
        if(current_angilar_velocity > 0){
            new_angilar_velocity = ship_body.GetAngularVelocity() - (ROTATION_SHIP_SPEED/40);
            if(new_angilar_velocity > 0){
                ship_body.SetAngularVelocity(new_angilar_velocity);
            }else{
                ship_body.SetAngularVelocity(0);
            }
        } else {
            new_angilar_velocity = ship_body.GetAngularVelocity() + (ROTATION_SHIP_SPEED/40);
            if(new_angilar_velocity < 0){
                ship_body.SetAngularVelocity(new_angilar_velocity);
            }else{
                ship_body.SetAngularVelocity(0);
            }
        }
    }
}
//helpers

/**
 *
 * @param element
 * @returns {{x: number, y: number}}
 */
function getElementPosition(element) {
    var elem = element, tagname = "", x = 0, y = 0;

    while ((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
        y += elem.offsetTop;
        x += elem.offsetLeft;
        tagname = elem.tagName.toUpperCase();

        if (tagname == "BODY")
            elem = 0;

        if (typeof(elem) == "object") {
            if (typeof(elem.offsetParent) == "object")
                elem = elem.offsetParent;
        }
    }
    return {x: x, y: y};
}

var add = {
    random: function(options) {
        options = options || {};
        if (Math.random() < 0.5){
            this.circle(options);
        } else {
            this.box(options);
        }
    },
    circle: function(options) {
        options.radius = 0.5 + Math.random()*1;
        var shape = new Circle(options);
        shapes[shape.id] = shape;
        box2d.addToWorld(shape);
    },
    box: function(options) {
        options.width = options.width || 0.5 + Math.random()*2;
        options.height = options.height || 0.5 + Math.random()*2;
        var shape = new Box(options);
        shapes[shape.id] = shape;
        box2d.addToWorld(shape);
    }
};


/* Shapes down here */

var Shape = function(v) {
    this.id = Math.round(Math.random() * 1000000);
    this.x = v.x || Math.random()*23 + 1;
    this.y = v.y || 0;
    this.angle = 0;
    this.color = helpers.randomColor();
    this.center = { x: null, y: null };
    this.isStatic = v.isStatic || false;

    this.update = function(options) {
        this.angle = options.angle;
        this.center = options.center;
        this.x = options.x;
        this.y = options.y;
    };
};

var Circle = function(options) {
    Shape.call(this, options);
    this.radius = options.radius || 1;

    this.draw = function() {
        ctx.save();
        ctx.translate(this.x * SCALE, this.y * SCALE);
        ctx.rotate(this.angle);
        ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x * SCALE, this.y * SCALE, this.radius * SCALE, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };
};
Circle.prototype = Shape;

var Box = function(options) {
    Shape.call(this, options);
    this.width = options.width || Math.random()*2+0.5;
    this.height = options.height || Math.random()*2+0.5;

    this.draw = function() {
        ctx.save();
        ctx.translate(this.x * SCALE, this.y * SCALE);
        ctx.rotate(this.angle);
        ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
        ctx.fillStyle = this.color;
        ctx.fillRect(
            (this.x-(this.width / 2)) * SCALE,
            (this.y-(this.height / 2)) * SCALE,
            this.width * SCALE,
            this.height * SCALE
        );
        ctx.restore();
    };
};
Box.prototype = Shape;