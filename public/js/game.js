//(function() {
    
    // Init som useful stuff for easier access (don't need 'em all)
    var   b2Vec2 = Box2D.Common.Math.b2Vec2
        , b2AABB = Box2D.Collision.b2AABB
        , b2BodyDef = Box2D.Dynamics.b2BodyDef
        , b2Body = Box2D.Dynamics.b2Body
        , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
        , b2Fixture = Box2D.Dynamics.b2Fixture
        , b2World = Box2D.Dynamics.b2World
        , b2MassData = Box2D.Collision.Shapes.b2MassData
        , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
        , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
        , b2DebugDraw = Box2D.Dynamics.b2DebugDraw
        , b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
        , b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
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

    var canvas,
        ctx,
        world,
        ship = {},
        fixDef,
        shapes = {},
        top_left_corner = {},
        pressed = {};

    var init = {
        start: function(id) {
            this.canvas(id);
            this.set_fullscreen(canvas);

            box2d.create.world();
            box2d.create.defaultFixture();
            ship = user_ship.build(0,0,0.5);
            //@TODO: count corner according to ship position
            top_left_corner.x = 0;
            top_left_corner.y = 0;

            setTimeout(function() { add.random(); }, 500);

            this.callbacks();

            // On my signal: Unleash hell.
            (function hell() {
                loop.step();
                loop.update();
                if (DEBUG) {
                    world.DrawDebugData();
                }
                loop.draw();
                requestAnimFrame(hell);
            })();
        },
        draw: {
            text: function(text, szie, x, y){
                ctx.font = szie+'px "4pixel"';
                ctx.fillStyle = "#fff";
                ctx.fillText(text, x, y);
            },
            /**
             *
             * @param world
             * @param data
             */
            solar_system_objects: function(data){
                var bodyDef = new b2BodyDef;
                var fixDef = new b2FixtureDef;
                //create star
                if (data.star != undefined) {
                    new Circle({x:CENTER_SYSTEM_X, y: CENTER_SYSTEM_Y, radius: data.star.radius});
                    bodyDef.position.Set(CENTER_SYSTEM_X, CENTER_SYSTEM_Y);
                    console.log('add star');
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
        canvas: function(id) {
            canvas = document.getElementById(id);
            ctx = canvas.getContext("2d");
        },
        callbacks: function() {
            /**
             * On mouse 1 click
             */
            canvas.addEventListener('click', function(e) {
                if(e.button == 0){
                    var shapeOptions = {
                        x: (canvas.width / SCALE) * (e.offsetX / canvas.width) + top_left_corner.x,
                        y: (canvas.height / SCALE) * (e.offsetY / canvas.height) + top_left_corner.y
                    };
                    add.random(shapeOptions);
                }
            }, false);

            /**
             * On resize
             */
            canvas.addEventListener('resize', function(event) {
                //@TODO: check onresize event
                init.set_fullscreen(canvas);
            });

            /**
             * Mouse scroll wheel move
             */
            if (document.addEventListener) {
                // IE9, Chrome, Safari, Opera
                document.addEventListener("mousewheel", handlers.mouse_wheel, false);
                // Firefox
                document.addEventListener("DOMMouseScroll", handlers.mouse_wheel, false);
            }

            /**
             * Mouse move wheel move
             */
            document.addEventListener('mousemove', handlers.mouse_move, false);

            /**
             * Keyboard pressed
             */
            document.addEventListener('keydown', function(e){ pressed[e.keyCode] = true;});
            /**
             * Keyboard released
             */
            document.addEventListener('keyup', function(e){ delete pressed[e.keyCode]; });
        }
    };        
     
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
        },
        ship: function(options) {
            options.id = 'ship';
            var shape = new Box(options);
            shapes[shape.id] = shape;
            box2d.addToWorld(shape);
            return shape;
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
                world = new b2World( new b2Vec2(0, GLOBAL_GRAVITY), ALLOW_SLEEP );
                
                if (DEBUG) {
                    var debugDraw = new b2DebugDraw();
                    debugDraw.SetSprite(ctx);
                    debugDraw.SetDrawScale(SCALE);
                    debugDraw.SetFillAlpha(0.3);
                    debugDraw.SetLineThickness(1.0);
                    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
                    world.SetDebugDraw(debugDraw);
                }
            },
            defaultFixture: function() {
                fixDef = new b2FixtureDef;
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

    var loop = {
        step: function() {
            var stepRate = 1 / 60;
            world.Step(stepRate, 10, 10);
            world.ClearForces();
        },
        update: function () {
            //keyboard
            for(i in pressed) {
                handlers.key_pressed(i);
            }
            for (var b = world.GetBodyList(); b; b = b.m_next) {
                if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
                    shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
                }
            }

            // track camera by ship
            var bodies = world.GetBodyList();
            for(var i = 0; i < world.GetBodyCount(); i++){
                if (bodies.IsActive() && bodies.GetUserData() == 'ship' && bodies.GetUserData() != null) {
                    var ship_position = bodies.GetPosition()
                }
                bodies = bodies.GetNext();
            }
            var left_x = (((canvas.width / SCALE) / canvas.width ) * (canvas.width / 4));
            var diff_left_x = left_x - ((canvas.width / (canvas.width / SCALE) ) * (ship_position.x - top_left_corner.x) / SCALE);
            if(diff_left_x > 0){
                top_left_corner.x = top_left_corner.x - diff_left_x;
            }

            var diff_right_x = (left_x * 3) - ((canvas.width / (canvas.width / SCALE) ) * (ship_position.x - top_left_corner.x) / SCALE);
            if(diff_right_x < 0){
                top_left_corner.x = top_left_corner.x - diff_right_x;
            }

            var top_y = (((canvas.height / SCALE) / canvas.height ) * (canvas.height / 4));
            var diff_top_y = top_y - ((canvas.height / (canvas.height / SCALE) ) * (ship_position.y - top_left_corner.y) / SCALE);
            if(diff_top_y > 0){
                top_left_corner.y = top_left_corner.y - diff_top_y;
            }

            var diff_bottom_y = (top_y * 3) - ((canvas.height / (canvas.height / SCALE) ) * (ship_position.y - top_left_corner.y) / SCALE);
            if(diff_bottom_y < 0){
                top_left_corner.y = top_left_corner.y - diff_bottom_y;
            }

            /*
            var x_position = Math.abs((canvas.width / (canvas.width / SCALE)) * (top_left_corner.x + ship_position.x));
            if(x_position > e.offsetX){
                center_x_px = Math.round(e.offsetX + Math.abs(x_position - e.offsetX ) / 2);
            }
            else{
                center_x_px = Math.round(e.offsetX - Math.abs(x_position - e.offsetX ) / 2);
            }
            top_left_corner.x = top_left_corner.x - ((canvas.width / SCALE) * ((canvas.width / 2) / canvas.width) - (canvas.width / SCALE) * ((center_x_px) / canvas.width));

            var y_position = Math.abs((canvas.height / (canvas.height / SCALE)) * (top_left_corner.y + ship_position.y));
            if(y_position > e.offsetY){
                center_y_px = Math.round(e.offsetY + Math.abs(y_position - e.offsetY ) / 2);
            }
            else{
                center_y_px = Math.round(e.offsetY - Math.abs(y_position - e.offsetY ) / 2);
            }
            top_left_corner.y = top_left_corner.y - ((canvas.height / SCALE) * ((canvas.height / 2) / canvas.height) - (canvas.height / SCALE) * ((center_y_px) / canvas.height));
            */

        },
        draw: function() {            
            if (!DEBUG) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (var i in shapes) {
                    if( top_left_corner.x < shapes[i].x &&  top_left_corner.y < shapes[i].y){
                        shapes[i].x -= top_left_corner.x;
                        shapes[i].y -= top_left_corner.y;
                        shapes[i].draw();
                    }
                }
            }
            //count left top corner according to ship position
            var bodies = world.GetBodyList();
            for(var i = 0; i < world.GetBodyCount(); i++){
                if (bodies.IsActive() && bodies.GetUserData() == 'ship' && bodies.GetUserData() != null) {
                    var ship_position = bodies.GetPosition()
                }
                bodies = bodies.GetNext();
            }

            init.draw.text("ZOM : " + (SCALE). toFixed(1), 16, (canvas.width/2+70), 20);
            if(typeof ship != 'undefined'){
                init.draw.text("POS X : " + Math.round(ship_position.x,2), 16, (canvas.width/2-50), 20);
                init.draw.text("POS Y : " + Math.round(ship_position.y,2), 16, (canvas.width/2-50), 40);
            }
        }
    };    
    
    var helpers = {
        randomColor: function() {
            var letters = '0123456789ABCDEF'.split(''),
                color = '#';
            for (var i = 0; i < 6; i++ ) {
                color += letters[Math.round(Math.random() * 15)];
            }
            return color;
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
                case KEY.W: user_ship.move_forward(); break; // w
                case KEY.LEFT:
                case KEY.A: user_ship.turn_left(); break; // a
                case KEY.DOWN:
                case KEY.S: user_ship.move_back(); break; // s
                case KEY.RIGHT:
                case KEY.D: user_ship.turn_right(); break; // d
                case KEY.Q: user_ship.strafe_left(); break; // q
                case KEY.E: user_ship.strafe_right(); break; // e
            }
        },

        /**
         *
         * @param e
         */
        mouse_move: function(e) {

            if(e.button == 1){
                var bodies = world.GetBodyList();
                for(var i = 0; i < world.GetBodyCount(); i++){
                    if (bodies.IsActive() && bodies.GetUserData() == 'ship' && bodies.GetUserData() != null) {
                        var ship_position = bodies.GetPosition()
                    }
                    bodies = bodies.GetNext();
                }
                var x_position = Math.abs((canvas.width / (canvas.width / SCALE)) * (top_left_corner.x + ship_position.x));
                if(x_position > e.offsetX){
                    center_x_px = Math.round(e.offsetX + Math.abs(x_position - e.offsetX ) / 2);
                }
                else{
                    center_x_px = Math.round(e.offsetX - Math.abs(x_position - e.offsetX ) / 2);
                }
                top_left_corner.x = top_left_corner.x - ((canvas.width / SCALE) * ((canvas.width / 2) / canvas.width) - (canvas.width / SCALE) * ((center_x_px) / canvas.width));

                var y_position = Math.abs((canvas.height / (canvas.height / SCALE)) * (top_left_corner.y + ship_position.y));
                if(y_position > e.offsetY){
                    center_y_px = Math.round(e.offsetY + Math.abs(y_position - e.offsetY ) / 2);
                }
                else{
                    center_y_px = Math.round(e.offsetY - Math.abs(y_position - e.offsetY ) / 2);
                }
                top_left_corner.y = top_left_corner.y - ((canvas.height / SCALE) * ((canvas.height / 2) / canvas.height) - (canvas.height / SCALE) * ((center_y_px) / canvas.height));
            }
        },

        /**
         *
         * @param e
         */
        mouse_wheel: function(e) {
            var delta = e.detail < 0 || e.wheelDelta > 0 ? 1 : -1;

            var bodies = world.GetBodyList();
            for(var i = 0; i < world.GetBodyCount(); i++){
                if (bodies.IsActive() && bodies.GetUserData() == 'ship' && bodies.GetUserData() != null) {
                    var position = bodies.GetPosition();
                }
                bodies = bodies.GetNext();
            }

            if(position){
                var x = ((canvas.width / (canvas.width / SCALE )) * ( position.x - top_left_corner.x));
                var y = ((canvas.height / (canvas.height / SCALE )) * ( position.y - top_left_corner.y));
            }
            if (delta < 0) {
                // scroll down
                var e1 = (canvas.width / SCALE) * (x / canvas.width);
                var r1 = (canvas.height / SCALE) * (y / canvas.height);

                if(SCALE > MIN_SCALE_SIZE){
                    if(SCALE > 1){
                        SCALE = (SCALE - 1);
                    }else{
                        SCALE = SCALE / (100 / SCROLL_SPEED);
                    }
                }
                var e2 = (canvas.width / SCALE) * (x / canvas.width);
                var r2 = (canvas.height / SCALE) * (y / canvas.height);
            } else {
                // scroll up
                var e1 = (canvas.width / SCALE) * (x / canvas.width);
                var r1 = (canvas.height / SCALE) * (y / canvas.height);
                if(SCALE < MAX_SCALE_SIZE){
                    if(SCALE > 1){
                        SCALE = (SCALE + 1);
                    }else{
                        SCALE = SCALE * (100 / SCROLL_SPEED);
                    }
                }
                var e2 = (canvas.width / SCALE) * (x / canvas.width);
                var r2 = (canvas.height / SCALE) * (y / canvas.height);
            }
            top_left_corner.x = top_left_corner.x - (e2 - e1);
            top_left_corner.y = top_left_corner.y - (r2 - r1);

        }
    };

    /* Shapes down here */
    var user_ship = {
        build : function(x, y, r){
            var shape = add.ship({x:1,y:1});
            return shape;
        },
        /**
         *
         */
        move_forward: function(){
            if(ship != null){
                this.move(0, 1);
            }
        },

        /**
         *
         */
        turn_left: function(){
            //ApplyAngularImpulse
            if(ship != null){
                //@TODO: fix angular velocity pover according weight of object
                this.rotate(-1, 0.8);
            }
        },

        /**
         *
         */
        move_back: function(){
            if(ship != null){
                this.move(180, 0.5);
            }
        },

        /**
         *
         */
        turn_right: function(){
            if(ship != null){
                this.rotate(1, 0.8);
            }
        },

        /**
         *
         */
        strafe_left: function(){
            if(ship != null){
                this.move(-90, 0.2);
            }
        },

        /**
         *
         */
        strafe_right: function(){
            if(ship != null){
                this.move(90, 0.2);
            }
        },

        /**
         *
         */
        move: function (degrees, power) {
            var bodies = world.GetBodyList();
            for(var i = 0; i < world.GetBodyCount(); i++){
                if (bodies.IsActive() && bodies.GetUserData() == 'ship' && bodies.GetUserData() != null) {
                    var r = bodies.GetAngle();
                    var method = (false) ? 'ApplyForce' : 'ApplyImpulse';
                    var force = new b2Vec2(Math.cos( r + (degrees * Math.PI / 180) ) * power, Math.sin( r + (degrees * Math.PI / 180)) * power);
                    bodies[method](force, bodies.GetPosition());
                    bodies.SetLinearDamping(0.8);
                }
                bodies = bodies.GetNext();
            }
        },
        /**
         *
         */
        rotate: function(a_vel, power){
            var bodies = world.GetBodyList();
            for(var i = 0; i < world.GetBodyCount(); i++){
                if (bodies.IsActive() && bodies.GetUserData() == 'ship' && bodies.GetUserData() != null) {
                    //@TODO: fix changing angular velocity according current velocity
                    bodies.SetAngularVelocity(a_vel);
/*
                    var cur_a_vel = bodies.GetAngularVelocity();
                    if(cur_a_vel > 0){
                        // +
                        if(a_vel > 0){
                            // +
                        }
                        else{
                            // -
                            //if (cur_a_vel > (Math.abs(a_vel) + Math.abs(a_vel))){
                                bodies.SetAngularVelocity(cur_a_vel + a_vel);
                            //}
                            //else{
                            //    bodies.SetAngularVelocity(a_vel);
                            //}
                        }
                    }
                    else{
                        // -
                        if(a_vel > 0){
                            // +
                            bodies.SetAngularVelocity(cur_a_vel + a_vel);
                        }
                        else{
                            // -
                        }
                    }

*/
                    bodies.SetAngularDamping(power);
                }
                bodies = bodies.GetNext();
            }
        }
    }
    /**
     *
     * @param v
     * @constructor
     */
    var Shape = function(v) {
        //todo change to some more reliable than rand
        this.id = (typeof v.id != 'undefined') ? v.id : Math.round(Math.random() * 1000000);
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
    /**
     *
     * @param options
     * @constructor
     */
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
    /**
     *
     * @param options
     * @constructor
     */
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
//})();