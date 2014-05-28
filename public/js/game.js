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
            ship = user_ship.build(4,4,0.5);
            //@TODO: count rorner according to ship position
            top_left_corner.x = -10;
            top_left_corner.y = -2;

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
                    bodyDef.type = b2Body.b2_staticBody;
                    fixDef.shape = new b2CircleShape(data.star.radius);

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
                var shapeOptions = {
                    x: (canvas.width / SCALE) * (e.offsetX / canvas.width) + top_left_corner.x,
                    y: (canvas.height / SCALE) * (e.offsetY / canvas.height) + top_left_corner.y
                };
                add.random(shapeOptions);
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
            options.user_data = 'ship';
            var shape = new Circle(options);
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
            console.log(pressed);
            for(i in pressed) {
                handlers.key_pressed(i);
            }
            for (var b = world.GetBodyList(); b; b = b.m_next) {
                if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
                    shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
                }
            }
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
            init.draw.text("ZOM : " + (SCALE).toFixed(1), 16, (canvas.width/2+70), 20);
            if(typeof ship != 'undefined'){
                init.draw.text("POS X : " + Math.round(ship.x,2), 16, (canvas.width/2-50), 20);
                init.draw.text("POS Y : " + Math.round(ship.y,2), 16, (canvas.width/2-50), 40);
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
            mouse_x = (e.clientX - canvasPosition.x) / SCALE;
            mouse_y = (e.clientY - canvasPosition.y) / SCALE;
        },

        /**
         *
         * @param e
         */
        mouse_wheel: function(e) {
            var delta = e.detail < 0 || e.wheelDelta > 0 ? 1 : -1;
            if (delta < 0) {
                // scroll down
                var e1 = (canvas.width / SCALE) * (e.offsetX / canvas.width);
                var r1 = (canvas.height / SCALE) * (e.offsetY / canvas.height);

                if(SCALE > MIN_SCALE_SIZE){
                    if(SCALE > 1){
                        SCALE = (SCALE - 1);
                    }else{
                        SCALE = SCALE / (100 / SCROLL_SPEED);
                    }
                }
                var e2 = (canvas.width / SCALE) * (e.offsetX / canvas.width);
                var r2 = (canvas.height / SCALE) * (e.offsetY / canvas.height);
            } else {
                // scroll up
                var e1 = (canvas.width / SCALE) * (e.offsetX / canvas.width);
                var r1 = (canvas.height / SCALE) * (e.offsetY / canvas.height);
                if(SCALE < MAX_SCALE_SIZE){
                    if(SCALE > 1){
                        SCALE = (SCALE + 1);
                    }else{
                        SCALE = SCALE * (100 / SCROLL_SPEED);
                    }
                }
                var e2 = (canvas.width / SCALE) * (e.offsetX / canvas.width);
                var r2 = (canvas.height / SCALE) * (e.offsetY / canvas.height);
            }
            top_left_corner.x = top_left_corner.x - (e2 - e1);
            top_left_corner.y = top_left_corner.y - (r2 - r1);

        }
    };

    /* Shapes down here */
    var user_ship = {
        build : function(x, y, r){
            /*var fixDef = new b2FixtureDef;
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.2;
            fixDef.density = 0.1;
            fixDef.shape =*/
            var shape = add.ship({x:5,y:5});
            //fixDef.shape = new b2CircleShape(1);
            //fixDef.angularDamping = 0.5;

            /*var bodyDef = new b2BodyDef;
            bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.x = x;
            bodyDef.position.y = y;*/
            console.log('add ship');
            //world.CreateBody(bodyDef).CreateFixture(fixDef);
            //var dynamicBody = world.CreateBody(bodyDef).CreateFixture(fixDef);
            //dynamicBody.SetUserData('space_ship');
            //return dynamicBody;
            return shape;
        },
        /**
         *
         */
        move_forward: function(){
            if(ship != null){
                this.move(ship, 0);
            }
        },

        /**
         *
         */
        turn_left: function(){
            if(ship != null){
                ship_body = ship.GetBody();
                current_angular_velocity = ship_body.GetAngularVelocity();
                new_angular_velocity = current_angular_velocity - ROTATION_SHIP_SPEED;

                if (ROTATION_SHIP_SPEED_LIMIT > Math.abs(new_angular_velocity)){
                    ship_body.SetAngularVelocity(new_angular_velocity);
                }
            }
        },

        /**
         *
         */
        move_back: function(){
            if(ship != null){
                this.move(ship, 180);
            }
        },

        /**
         *
         */
        turn_right: function(){
            if(ship != null){
                ship_body = ship.GetBody();
                current_angular_velocity = ship_body.GetAngularVelocity();
                new_angular_velocity = current_angular_velocity + ROTATION_SHIP_SPEED;

                if (ROTATION_SHIP_SPEED_LIMIT > Math.abs(new_angular_velocity)){
                    ship_body.SetAngularVelocity(new_angular_velocity);
                }
            }
        },

        /**
         *
         */
        strafe_left: function(){
            if(ship != null){
                this.move(ship, -90);
            }
        },

        /**
         *
         */
        strafe_right: function(){
            if(ship != null){
                this.move(ship, 90);
            }
        },
        move: function (inner_ship, degrees) {
            //console.log(inner_ship);
            for (var b = world.GetBodyList(); b; b = b.m_next) {
                if (b.IsActive() && typeof b.GetUserData() !== 'ship' && b.GetUserData() != null) {
                    console.log(b);
                    console.log(inner_ship);
                    console.log(box2d.get.bodySpec(b).GetAngle());
                    //shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
                    //ship.update(bshipySpec(b)); //(box2d.get.bodySpec(b));

                    //console.log(shapes[b.GetUserData()])//.update(box2d.get.bodySpec(b));
                }
            }

            var body = obj.GetBody();

            var method = (false) ? 'ApplyForce' : 'ApplyImpulse';
            var r = body.GetAngle();
            //try to get speed of the object
            var force = new b2Vec2(Math.cos( r + (degrees * Math.PI / 180) ), Math.sin( r + (degrees * Math.PI / 180)));
            body[method](force, body.GetPosition());
        }
    }
    var Shape = function(v) {
        //todo change to some more reliable than rand
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
//})();