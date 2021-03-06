/**
 * SOS game
 * 2013 Alexander ILivanov jurenites@gmail.com
 */

// Globals
var DEBUG = false;
var SCOREDBKEY = "sos 0.1";

// bind to window events
window.addEventListener('load', onloadHandler, false);

/**
 * Global window onload handler
 */
function onloadHandler() {
    // Init our game with Game.Main derived instance.
    // Set min canvas size and border padding - which implies auto width/height
    // as the game arena can be scaled to window size
    GameHandler.init(400, 32);
    GameHandler.start(new Arena.Main());

    // Load sounds
    if (GameHandler.soundEnabled && GameHandler.webkitAudioContext) {
        //GameHandler.loadSound("sounds/pewpew1.wav.mp3", "laser");
        GameHandler.loadSound("sounds/laser.wav.mp3", "laser");
        GameHandler.loadSound("sounds/pewpew3.wav.mp3", "enemy-bomb");
        GameHandler.loadSound("sounds/explosion1.mp3", "enemy-explosion1");
        GameHandler.loadSound("sounds/explosion2.mp3", "enemy-explosion2");
        GameHandler.loadSound("sounds/explosion3.mp3", "enemy-explosion3");
        GameHandler.loadSound("sounds/explosion4.mp3", "enemy-explosion4");
        GameHandler.loadSound("sounds/hiss1.wav.mp3", "enemy-hit");
        GameHandler.loadSound("sounds/bigboom.mp3", "player-explosion");
        GameHandler.loadSound("sounds/hiss2.wav.mp3", "scoreup");
        GameHandler.loadSound("sounds/pickup4.wav.mp3", "powerup");
    }
}


/**
 * Arena root namespace.
 *
 * @namespace Arena
 */
if (typeof Arena == "undefined" || !Arena) {
    var Arena = {};
}


/**
 * Arena constants
 *
 * @namespace Arena
 */
Arena.Colours =
{
    // NOTE: K3D object colours still defined as [r,g,b] triple
    PLAYER: "rgb(255,255,255)",
    PLAYER_THRUST: "rgb(255,255,255)",
    PARTICLE: "rgb(255,150,75)",
    EXPLOSION: "rgb(255,120,40)",
    ENEMY_DUMBO: "rgb(0,128,255)",
    ENEMY_TRACKER: "rgb(255,96,0)",
    ENEMY_ZONER: "rgb(255,255,0)",
    ENEMY_BORG: "rgb(0,255,64)",
    ENEMY_DODGER: "rgb(0,255,255)",
    ENEMY_SPLITTER: "rgb(148,0,255)",
    ENEMY_BOMBER: "rgb(255,0,255)",
    ENEMY_VENOM: "rgb(255,128,64)",
    COLLECTABLE_MULTIPLIER: "rgb(255,180,0)",
    COLLECTABLE_ENERGY: "rgb(100,255,0)",
    BULLET_ENEMY: "rgb(150,255,150)"
};

Arena.ShadowSize = isFireFox ? 4 : 8;


/**
 * Arena main game class.
 *
 * @namespace Arena
 * @class Arena.Main
 */
(function () {
    Arena.Main = function () {
        Arena.Main.superclass.constructor.call(this);

        // generate the single player actor - available across all scenes
        // TODO: init position etc. here is wrong - should be in the scene...
        this.player = new Arena.Player(new Vector(GameHandler.width / 2, GameHandler.height / 2), new Vector(0, 0), 0);

        // add the attractor scene
        this.scenes.push(new Arena.AttractorScene(this));

        //
        // TEMP!
        //
        //if (DEBUG) this.scenes.push(new Arena.TESTEnemyScene(this, 7));

        // add the main level scene
        var level = new Arena.GameScene(this);
        this.scenes.push(level);

        // set special end scene member value to a Game Over scene
        this.endScene = new Arena.GameOverScene(this);

        // event handlers
        var me = this;
        var fMouseMove = function (e) {
            me.mousex = e.clientX;
            me.mousey = e.clientY;
        };
        GameHandler.canvas.addEventListener("mousemove", fMouseMove, false);

        if (DEBUG) {
            // attach handlers to debug checkboxes
            var setupDebugElement = function (id) {
                var el = document.getElementById("debug-" + id);
                if (el) {
                    DEBUG[id] = el.checked;
                    el.addEventListener("change", function () {
                        DEBUG[id] = el.checked;
                    }, false);
                }
                else {
                    alert("Unable to find expected debug DOM element: " + "debug-" + id);
                }
            };
            setupDebugElement("FPS");
            setupDebugElement("COLLISIONRADIUS");
            setupDebugElement("INVINCIBLE");
            setupDebugElement("DISABLEGLOWEFFECT");
            setupDebugElement("DISABLEAUTOFIRE");
            setupDebugElement("RENDERINGINFO");
            setupDebugElement("K3DREALTIME");
        }

        // load high score from HTML5 local storage
        if (localStorage) {
            var highscore = localStorage.getItem(SCOREDBKEY);
            if (highscore) {
                this.highscore = highscore;
            }
        }
    };

    extend(Arena.Main, Game.Main,
        {
            /**
             * Reference to the single game player actor
             */
            player: null,

            /**
             * Current game score
             */
            score: 0,

            /**
             * High score
             */
            highscore: 0,

            /**
             * Last score
             */
            lastscore: 0,

            /**
             * Current multipler
             */
            scoreMultiplier: 1,

            /**
             * Mouse position
             */
            mousex: 0,
            mousey: 0,

            /**
             * Main game loop event handler method.
             */
            onRenderGame: function onRenderGame(ctx) {
                ctx.clearRect(0, 0, GameHandler.width, GameHandler.height);
            },

            isGameOver: function isGameOver() {
                var over = (!this.player.alive && (this.currentScene.effects && this.currentScene.effects.length === 0));
                if (over) {
                    // reset player ready for game restart
                    this.lastscore = this.score;
                    this.score = 0;
                    this.scoreMultiplier = 1;
                }
                return over;
            }
        });
})();


/**
 * Arena Attractor scene class.
 *
 * @namespace Arena
 * @class Arena.AttractorScene
 */
(function () {
    Arena.AttractorScene = function (game) {
        // generate warp starfield background
        this.starfield = [];
        for (var star, i = 0; i < this.STARFIELD_SIZE; i++) {
            star = new Arena.Star();
            star.init();
            this.starfield.push(star);
        }

        // scene renderers
        // display welcome text, info text and high scores
        this.sceneRenderers = [];
        //var offx = GameHandler.width / 2 - 100,
        //   offy = GameHandler.height / 2 - 5;
        this.sceneRenderers.push(this.sceneRendererInfo);
        this.sceneRenderers.push(this.sceneRendererWelcome);

        // perform prerender steps - create some bitmap graphics to use later
        var me = this;
        var firstCallback = true;
        GameHandler.bitmaps = new Arena.Prerenderer(game.player);
        GameHandler.bitmaps.execute(
            function (percentComplete) {
                var ctx = GameHandler.canvas.getContext('2d');
                var offx = GameHandler.width / 2 - 100,
                    offy = GameHandler.height / 2 - 5;

                ctx.fillRect(offx, offy, percentComplete * 2, 8);
                if (firstCallback) {
                    ctx.fillStyle = "#fff";
                    ctx.strokeStyle = "#aaa";
                    ctx.strokeRect(offx + 0.5, offy + 0.5, 202, 8);
                    //Game.fillText(ctx, "Loading...", '10pt ', offx, offy - 6, "rgba(255,255,255,255")

                    firstCallback = false;
                }
            },
            function () {
                me.initialised = true;
            });

        // allow start via mouse click - useful for testing on touch devices
        var fMouseDown = function (e) {
            if (e.button == 0) {
                me.start = true;
                return true;
            }
        };
        GameHandler.canvas.addEventListener("mousedown", fMouseDown, false);

        // state for gamepad button start
        game.disableAutofire = false;

        Arena.AttractorScene.superclass.constructor.call(this, game, null);
    };

    extend(Arena.AttractorScene, Game.Scene,
        {
            STARFIELD_SIZE: 75,
            SCENE_LENGTH: 500,
            SCENE_FADE: 100,
            initialised: false,
            start: false,
            fadeRGB: 0,
            fadeIncrement: 0,
            sceneRenderers: null,
            currentSceneRenderer: 0,
            currentSceneFrame: 0,

            /**
             * Background starfield star list
             */
            starfield: null,

            /**
             * Scene completion polling method
             */
            isComplete: function isComplete() {
                return this.initialised && this.start;
            },

            onInitScene: function onInitScene() {
                this.start = false;
                this.fadeRGB = 0;
                this.fadeIncrement = 0.01;
                this.currentSceneRenderer = 0;
                this.currentSceneFrame = 0;
            },

            onRenderScene: function onRenderScene(ctx) {
                // quick exit if graphics not loaded yet...
                if (!this.initialised) return;

                // update and render background starfield effect

                ctx.save();
                ctx.globalAlpha = 0.333;
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, GameHandler.width, GameHandler.height);
                this.updateStarfield(ctx);
                ctx.restore();

                // manage scene renderer
                if (this.currentSceneFrame === 50 && this.currentSceneRenderer == 0) {
                    this.currentSceneRenderer = 1;
                    this.currentSceneFrame = 0;
                }
                if (++this.currentSceneFrame === this.SCENE_LENGTH) {
                    /*if (++this.currentSceneRenderer === this.sceneRenderers.length)
                     {
                     this.currentSceneRenderer = this.sceneRenderers.length;
                     }*/
                    this.currentSceneFrame = 0;
                }
                //frame log
                ctx.save();
                // fade in/out
                if (this.currentSceneFrame < this.SCENE_FADE) {
                    // fading in
                    ctx.globalAlpha = 1 - ((this.SCENE_FADE - this.currentSceneFrame) / this.SCENE_FADE);
                }
                else if (this.currentSceneFrame >= this.SCENE_LENGTH - this.SCENE_FADE) {
                    // fading out
                    ctx.globalAlpha = ((this.SCENE_FADE - this.currentSceneFrame) / this.SCENE_FADE);
                }
                // render scene using renderer function
                this.sceneRenderers[this.currentSceneRenderer].call(this, ctx);
                ctx.restore();
            },

            sceneRendererWelcome: function sceneRendererWelcome(ctx) {
                if (this.currentSceneRenderer == 1) {
                    this.fadeRGB = 1;
                }
                var colour = "rgba(255,255,255," + this.fadeRGB + ")";
                ff = '10pt "4pixel"';
                Game.centerFillText(ctx, "click [ SPACE ]  or [ MOUSE 1 ]", ff, GameHandler.height * 0.5 + 12, colour);
            },

            sceneRendererInfo: function sceneRendererInfo(ctx) {
                this.fadeRGB += this.fadeIncrement;
                if (this.fadeRGB < 1.0) {
                    this.fadeRGB = 1.0;
                    this.fadeIncrement = -this.fadeIncrement;
                }
                var colour = "rgba(255,255,255," + this.fadeRGB + ")";
                ff = '40pt "4pixel"';
                Game.centerFillText(ctx, "USeR_", ff, GameHandler.height * 0.5 + 20, colour);
            },

            /**
             * Update each individual star in the starfield background
             */
            updateStarfield: function updateStarfield(ctx) {
                for (var i = 0, j = this.starfield.length; i < j; i++) {
                    this.starfield[i].updateAndRender(i, ctx);
                }
            },

            onKeyDownHandler: function onKeyDownHandler(keyCode) {
                switch (keyCode) {
                    case GameHandler.GAMEPAD + 0:
                    {
                        this.start = true;
                        // for gamepad start - disable mouse autofire
                        this.game.disableAutofire = true;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.T:
                    {
                        GameHandler.soundEnabled = !GameHandler.soundEnabled;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.SPACE:
                    {
                        this.start = true;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.ESC:
                    {
                        GameHandler.pause();
                        return true;
                        break;
                    }
                }
            }
        });
})();


/**
 * Arena GameOver scene class.
 *
 * @namespace Arena
 * @class Arena.GameOverScene
 */
(function () {
    Arena.GameOverScene = function (game) {
        this.player = game.player;

        // construct the interval to represent the Game Over text effect
        var interval = new Game.Interval("GAME OVER", this.intervalRenderer);
        Arena.GameOverScene.superclass.constructor.call(this, game, interval);
    };

    extend(Arena.GameOverScene, Game.Scene,
        {
            game: null,

            /**
             * Scene completion polling method
             */
            isComplete: function isComplete() {
                return true;
            },

            intervalRenderer: function intervalRenderer(interval, ctx) {
                if (interval.framecounter++ === 0) {
                    if (this.game.lastscore === this.game.highscore) {
                        // save new high score to HTML5 local storage
                        if (localStorage) {
                            localStorage.setItem(SCOREDBKEY, this.game.lastscore);
                        }

                        try {
                            if ($) {
                                var score = this.game.lastscore;
                                // write results to browser
                                $("#results").html("<p>High Score: " + score + "</p>");
                                // tweet this result link
                                var tweet = "http://twitter.com/home/?status=I%20scored:%20" + score + "%20-%20in%20the%20Arena5%20game!%20Try%20your%20skillz...%20http://bit.ly/arena5game%20(by%20@kevinroast)%20%23JavaScript%20%23html5";
                                $("#tweetlink").attr('href', tweet);
                                $("#results-wrapper").fadeIn();
                            }
                        } catch (e) {
                        }
                    }
                }
                if (interval.framecounter < 200) {
                    //Game.centerFillText(ctx, interval.label, Game.fontFamily(this.world, 18), GameHandler.height * 0.5 - 9, "white");
                    Game.centerFillText(ctx, "Score: " + this.game.lastscore, Game.fontFamily(this.world, 14), GameHandler.height * 0.5 + 32, "white");
                    if (this.game.lastscore === this.game.highscore) {
                        Game.centerFillText(ctx, "New High Score!", Game.fontFamily(this.world, 14), GameHandler.height * 0.5 + 64, "white");
                    }
                }
                else {
                    interval.complete = true;
                }
            }
        });
})();


/**
 * Arena Base Game scene class.
 *
 * Common functionality for Arena game scenes.
 *
 * @namespace Arena
 * @class Arena.BaseGameScene
 */
(function () {
    Arena.BaseGameScene = function (game, interval) {
        this.player = game.player;

        Arena.BaseGameScene.superclass.constructor.call(this, game, interval);
    };

    extend(Arena.BaseGameScene, Game.Scene,
        {
            player: null,

            /**
             * Top-level list of game actors sub-lists
             */
            actors: null,

            /**
             * Scene init event handler
             */
            onInitScene: function onInitScene() {
                // generate the actors and add the actor sub-lists to the main actor list
                this.actors = [];
                this.actors.push([this.player]);

                with (this.player) {
                    position.x = position.y = this.world.size / 2;
                    vector.x = vector.y = heading = 0;
                }
                // start view centered in the game world
                this.world.viewx = this.world.viewy = (this.world.size / 2) - (this.world.viewsize / 2);
            },

            /**
             * Scene before rendering event handler
             */
            onBeforeRenderScene: function onBeforeRenderScene() {
                this.updateActors();
            },

            /**
             * Scene rendering event handler
             */
            onRenderScene: function onRenderScene(ctx) {
                ctx.save();

                ctx.clearRect(0, 0, GameHandler.width, GameHandler.height);
                ctx.lineWidth = 1;

                // render the game actors
                this.renderActors(ctx);

                if (DEBUG && DEBUG.COLLISIONRADIUS) {
                    this.renderCollisionRadius(ctx);
                }

                ctx.restore();
            },

            onKeyDownHandler: function onKeyDownHandler(keyCode) {
                switch (keyCode) {
                    case GameHandler.KEY.ESC:
                    {
                        GameHandler.pause();
                        return true;
                        break;
                    }
                }
            },

            /**
             * Update the scene actors based on current vectors and expiration.
             */
            updateActors: function updateActors() {
                for (var i = 0, j = this.actors.length; i < j; i++) {
                    var actorList = this.actors[i];

                    for (var n = 0; n < actorList.length; n++) {
                        var actor = actorList[n];

                        // call onUpdate() event for each actor
                        actor.onUpdate(this);

                        // expiration test first
                        if (actor.expired()) {
                            actorList.splice(n, 1);
                        }
                        else {
                            // update actor using its current vector
                            actor.position.add(actor.vector.nscale(GameHandler.frameMultipler));

                            // TODO: different behavior for traversing out of the world space?
                            //       add behavior flag to Actor i.e. bounce, invert, disipate etc.
                            //       - could add method to actor itself - so would handle internally...
                            var bounceX = false,
                                bounceY = false;
                            if (actor.position.x >= this.world.size) {
                                actor.position.x = this.world.size;
                                bounceX = true;
                            }
                            else if (actor.position.x < 0) {
                                actor.position.x = 0;
                                bounceX = true;
                            }
                            if (actor.position.y >= this.world.size) {
                                actor.position.y = this.world.size;
                                bounceY = true;
                            }
                            else if (actor.position.y < 0) {
                                actor.position.y = 0;
                                bounceY = true
                            }
                            // bullets don't bounce - create an effect at the arena boundry instead
                            if ((bounceX || bounceY) &&
                                ((actor instanceof Arena.Bullet && !this.player.bounceWeapons) ||
                                    actor instanceof Arena.EnemyBullet)) {
                                // replace bullet with a particle effect at the same position and vector
                                var vec = actor.vector.nscale(0.5);
                                this.effects.push(new Arena.BulletImpactEffect(actor.position.clone(), vec));
                                // remove bullet actor from play
                                actorList.splice(n, 1);
                            }
                            else {
                                if (bounceX) {
                                    var h = actor.vector.thetaTo2(new Vector(0, 1));
                                    actor.vector.rotate(h * 2);
                                    actor.vector.scale(actor === this.player ? 0.5 : 0.9);
                                    actor.position.add(actor.vector);
                                }
                                if (bounceY) {
                                    var h = actor.vector.thetaTo2(new Vector(1, 0));
                                    actor.vector.rotate(h * 2);
                                    actor.vector.scale(actor === this.player ? 0.5 : 0.9);
                                    actor.position.add(actor.vector);
                                }
                            }
                        }
                    }
                }
            },

            /**
             * Render each actor to the canvas.
             *
             * @param ctx {object} Canvas rendering context
             */
            renderActors: function renderActors(ctx) {
                for (var i = 0, j = this.actors.length; i < j; i++) {
                    // walk each sub-list and call render on each object
                    var actorList = this.actors[i];

                    for (var n = actorList.length - 1; n >= 0; n--) {
                        actorList[n].onRender(ctx, this.world);
                    }
                }
            },

            /**
             * DEBUG - Render the radius of the collision detection circle around each actor.
             *
             * @param ctx {object} Canvas rendering context
             */
            renderCollisionRadius: function renderCollisionRadius(ctx) {
                ctx.save();
                ctx.strokeStyle = "red";
                ctx.lineWidth = 0.5;

                for (var i = 0, j = this.actors.length; i < j; i++) {
                    var actorList = this.actors[i];
                    for (var n = actorList.length - 1, actor; n >= 0; n--) {
                        actor = actorList[n];
                        if (actor.radius)  // filter out effects etc. that are not "alive" in the game world
                        {
                            var viewposition = Game.worldToScreen(actor.position, this.world, actor.radius);
                            if (viewposition) {
                                ctx.save();
                                ctx.translate(viewposition.x, viewposition.y);
                                ctx.beginPath();
                                ctx.arc(0, 0, actor.radius * this.world.scale, 0, TWOPI, true);
                                ctx.closePath();
                                ctx.stroke();
                                ctx.restore();
                            }
                        }
                    }
                }

                ctx.restore();
            },

            screenCenterVector: function screenCenterVector() {
                // transform to world position - to get the center of the game screen
                var m = new Vector(GameHandler.width * 0.5, GameHandler.height * 0.5);
                m.scale(1 / this.world.scale);
                m.x += this.world.viewx;
                m.y += this.world.viewy;
                return m;
            }
        });
})();


/**
 * Arena TEST Enemy scene class.
 *
 * @namespace Arena
 * @class Arena.TESTEnemyScene
 */
(function () {
    Arena.TESTEnemyScene = function (game, enemytype) {
        this.enemytype = enemytype;

        Arena.TESTEnemyScene.superclass.constructor.call(this, game);
    };

    extend(Arena.TESTEnemyScene, Arena.BaseGameScene,
        {
            enemytype: 0,

            /**
             * List of enemy actors (asteroids, ships etc.)
             */
            enemies: null,

            /**
             * List of player fired bullet actors
             */
            playerBullets: null,

            /**
             * List of enemy fired bullet actors
             */
            enemyBullets: null,

            /**
             * Scene init event handler
             */
            onInitScene: function onInitScene() {
                // generate the actors and add the actor sub-lists to the main actor list
                this.actors = [];
                this.actors.push(this.enemies = []);
                this.actors.push(this.playerBullets = []);
                this.actors.push(this.enemyBullets = []);
                //this.actors.push([this.player]);

                with (this.player) {
                    position.x = position.y = this.world.size / 2;
                    vector.x = vector.y = heading = 0;
                }

                // add the test enemies
                for (var i = 0; i < 1; i++) {
                    this.enemies.push(new Arena.EnemyShip(this, this.enemytype));
                }

                // start view centered in the game world
                this.world.viewx = this.world.viewy = (this.world.size / 2) - (this.world.viewsize / 2);
            }
        });
})();


/**
 * Arena Game scene class.
 *
 * @namespace Arena
 * @class Arena.GameScene
 */
(function () {
    Arena.GameScene = function (game) {
        this.player = game.player;

        this.waves = [
            {
                enemyMax: 5,
                enemyWeighting: [0, 0, 0, 1, 1, 1, 2],
                lifetime: 20
            },
            {
                enemyMax: 5,
                enemyWeighting: [0, 0, 1, 1, 2, 3],
                lifetime: 20
            },
            {
                enemyMax: 5,
                enemyWeighting: [2],
                lifetime: 10,
            },
            {
                enemyMax: 8,
                enemyWeighting: [0, 1, 1, 2, 2, 3, 3],
                lifetime: 20,
            },
            {
                enemyMax: 8,
                enemyWeighting: [3],
                lifetime: 10,
            },
            {
                enemyMax: 10,
                enemyWeighting: [1, 2, 5],
                lifetime: 20,
            },
            {
                enemyMax: 10,
                enemyWeighting: [1, 1, 2, 2, 3, 5],
                lifetime: 20,
            },
            {
                enemyMax: 10,
                enemyWeighting: [2, 4, 6],
                lifetime: 10,
            },
            {
                enemyMax: 10,
                enemyWeighting: [1, 1, 2, 2, 4, 5],
                lifetime: 20,
            },
            {
                enemyMax: 10,
                enemyWeighting: [3, 4, 6],
                lifetime: 10,
            },
            {
                enemyMax: 10,
                enemyWeighting: [4, 5, 6],
                lifetime: 20,
            },
            // infinite last wave!
            {
                enemyMax: 12,
                enemyWeighting: [1, 2, 3, 4, 5, 6],
                lifetime: 0
            }
        ];

        var interval = new Game.Interval("ENTER THE ARENA!", this.intervalRenderer);
        Arena.GameScene.superclass.constructor.call(this, game, interval);
    };

    extend(Arena.GameScene, Arena.BaseGameScene,
        {
            waves: null,
            currentWave: 0,
            enemyKills: 0,
            timeInScene: 0,

            /**
             * Key input values
             */
            input: {
                axisMove: null,
                axisFire: null,
                axisFireLR: 0,
                axisFireUD: 0,
                axisMoveLR: 0,
                axisMoveUD: 0,
                left: false,
                right: false,
                up: false,
                down: false
            },

            /**
             * List of player fired bullet actors
             */
            playerBullets: null,

            /**
             * List of enemy actors (asteroids, ships etc.)
             */
            enemies: null,

            /**
             * List of enemy fired bullet actors
             */
            enemyBullets: null,

            /**
             * List of effect actors
             */
            effects: null,

            /**
             * List of collectables actors
             */
            collectables: null,

            /**
             * Displayed score (animates towards actual score)
             */
            scoredisplay: 0,

            controlFire: null,

            /**
             * Scene init event handler
             */
            onInitScene: function onInitScene() {
                // generate the actors and add the actor sub-lists to the main actor list
                this.actors = [];
                this.actors.push(this.enemies = []);
                this.actors.push(this.playerBullets = []);
                this.actors.push(this.enemyBullets = []);
                this.actors.push(this.effects = []);
                this.actors.push(this.collectables = []);

                // start view centered in the game world
                this.world.viewx = this.world.viewy = (this.world.size / 2) - (this.world.viewsize / 2);

                // reset player
                this.resetPlayerActor();

                // reset wave
                this.currentWave = 0;
                this.enemyKills = 0;
                this.timeInScene = Date.now();

                // reset interval
                this.interval.reset();

                this.skipLevel = false;
            },

            /**
             * Restore the player to the game - reseting position etc.
             */
            resetPlayerActor: function resetPlayerActor(persistPowerUps) {
                this.actors.push([this.player]);

                // reset the player position - centre of world
                with (this.player) {
                    position.x = position.y = this.world.size / 2;
                    vector.x = vector.y = heading = 0;
                    reset(persistPowerUps);
                }

                // reset keyboard input values
                with (this.input) {
                    left = right = up = down = false;
                    axisMove = axisFire = null;
                }
            },

            /**
             * Scene before rendering event handler
             */
            onBeforeRenderScene: function onBeforeRenderScene() {
                var p = this.player,
                    w = this.world;

                // player handle input - rotate and move
                p.handleInput(this.input);

                // update all actors using their current vector in the game world
                // do this here before we update the current view position etc.
                this.updateActors();

                // auto-fire in direction of mouse or axis fire
                if ((!(DEBUG && DEBUG.DISABLEAUTOFIRE || this.game.disableAutofire) || this.input.axisFire) && this.controlFire) {
                    var v, h;
                    if (this.input.axisFire) {
                        // axis fire is already a normalised vector
                        v = this.input.axisFire.nscaleTo(16);
                        h = new Vector(0, 1).thetaTo2(this.input.axisFire) / RAD;
                    }
                    else {
                        // TODO: move this down to weapons code - i.e. don't calculate fire vectors here...
                        // transform mouse to world position
                        var m = new Vector(this.game.mousex - GameHandler.offsetX, this.game.mousey - GameHandler.offsetY);
                        m.scale(1 / w.scale);
                        m.x += w.viewx;
                        m.y += w.viewy;

                        v = m.nsub(p.position);
                        v.add(p.vector);

                        // scale resulting vector down to fixed size
                        v.scaleTo(16);

                        // calculate angle from upward pointing vector (the bullet start
                        // heading) and the vector we want the bullet to travel - this
                        // gives the heading we can use to rotate the bullet
                        h = new Vector(0, 1).thetaTo2(v) / RAD;
                    }

                    // fire the primary weapon
                    p.firePrimary(this.playerBullets, v, h);
                }

                // TODO: click to fire secondary weapons?

                // update view position based on new player positiond
                w.viewx = (p.position.x - w.viewsize / 2); //this.game.mousex;
                w.viewy = (p.position.y - (w.viewsize / 2) / (GameHandler.width / GameHandler.height)); //this.game.mousey;

                // ensure enemy count is as appropriate for the current wave
                var wave = this.waves[this.currentWave],
                    now = Date.now();
                if (wave.lifetime !== 0 && (now > this.timeInScene + (wave.lifetime * 1000) || this.skipLevel)) {
                    this.skipLevel = false;

                    // increment wave
                    wave = this.waves[++this.currentWave];
                    this.timeInScene = now;

                    // display wave text effect in the center of the game screen
                    var vec = new Vector(0, -3.5);
                    this.effects.push(new Arena.TextIndicator(
                        this.screenCenterVector(), vec, ("WAVE " + (this.currentWave + 1)), 32, "white", 1500));
                }
                while (this.enemies.length < wave.enemyMax) {
                    this.enemies.push(new Arena.EnemyShip(
                        this, wave.enemyWeighting[randomInt(0, wave.enemyWeighting.length - 1)]));
                }

                // detect bullet collisions
                this.collisionDetectBullets();

                // detect player collision with enemies etc.
                if (!this.player.expired()) {
                    this.collisionDetectPlayer();
                }
                else {
                    // if the player died, then end game after a small delay
                    if (GameHandler.frameStart - this.player.killedOn > 2500) {
                        // remove enemies before game reset - clear the array
                        this.enemies.length = 0;
                        this.resetPlayerActor();
                    }
                }
            },
            startFire: function doFire(){
                this.controlFire = true;
            },
            stopFire: function doFire(){
                this.controlFire = false;
            },
            /**
             * Scene rendering event handler
             */
            onRenderScene: function onRenderScene(ctx) {
                ctx.save();

                ctx.clearRect(0, 0, GameHandler.width, GameHandler.height);
                ctx.lineWidth = 1;

                // render background effect - wire grid
                this.renderBackground(ctx);

                // render the game actors
                this.renderActors(ctx);

                if (DEBUG && DEBUG.COLLISIONRADIUS) {
                    this.renderCollisionRadius(ctx);
                }

                // render info overlay graphics
                this.renderOverlay(ctx);
                ctx.restore();
            },

            intervalRenderer: function intervalRenderer(interval, ctx) {
                if (interval.framecounter++ < 50) {
                    //Game.centerFillText(ctx, interval.label, Game.fontFamily(this.world, 18), GameHandler.height / 2 - 9, "white");
                }
                else {
                    interval.complete = true;
                }
            },

            /**
             * Scene onKeyDownHandler method
             */
            onKeyDownHandler: function onKeyDownHandler(keyCode) {
                switch (keyCode) {
                    case GameHandler.KEY.LEFT:
                    case GameHandler.KEY.A:
                    {
                        this.input.left = true;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.RIGHT:
                    case GameHandler.KEY.D:
                    {
                        this.input.right = true;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.UP:
                    case GameHandler.KEY.W:
                    {
                        this.input.up = true;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.DOWN:
                    case GameHandler.KEY.S:
                    {
                        this.input.down = true;
                        return true;
                        break;
                    }

                    // special keys - key press state not maintained between frames
                    case GameHandler.KEY.L:
                    {
                        if (DEBUG) this.skipLevel = true;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.T:
                    {
                        GameHandler.soundEnabled = !GameHandler.soundEnabled;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.ESC:
                    {
                        GameHandler.pause();
                        return true;
                        break;
                    }
                    case GameHandler.KEY.OPENBRACKET:
                    {
                        if (this.world.viewsize > 2000) {
                            this.world.viewsize -= GameHandler.SCROLLRATE;
                        }
                        return true;
                        break;
                    }
                    case GameHandler.KEY.CLOSEBRACKET:
                    {
                        if (this.world.viewsize < this.world.size) {
                            this.world.viewsize += GameHandler.SCROLLRATE;
                        }
                        return true;
                        break;
                    }
                }
            },

            /**
             * Scene onKeyUpHandler method
             */
            onKeyUpHandler: function onKeyUpHandler(keyCode) {
                switch (keyCode) {
                    case GameHandler.KEY.LEFT:
                    case GameHandler.KEY.A:
                    {
                        this.input.left = false;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.RIGHT:
                    case GameHandler.KEY.D:
                    {
                        this.input.right = false;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.UP:
                    case GameHandler.KEY.W:
                    {
                        this.input.up = false;
                        return true;
                        break;
                    }
                    case GameHandler.KEY.DOWN:
                    case GameHandler.KEY.S:
                    {
                        this.input.down = false;
                        return true;
                        break;
                    }
                }
            },

            onScrollHandler: function onScrollHandler(direction){
                if(direction > 0){
                    if (this.world.viewsize > GameHandler.SCROLLRATE) {
                        this.world.viewsize -= GameHandler.SCROLLRATE;
                    }
                }
                else{
                    if (this.world.viewsize < this.world.size) {
                        this.world.viewsize += GameHandler.SCROLLRATE;
                    }
                }
                return true;
            },

            onMouseClickHandler: function onMouseClickHandler(e){
                switch(e.button){
                    case 0: //mouse1

                        break;
                    case 1: //scroll click

                        break;
                    case 2: //mouse2

                        break;
                }
                return true;
            },
            /**
             * Handle Gamepad API axis input
             */
            onAxisHandler: function onAxisHandler(axis, delta) {
                this.input.axisFire = this.input.axisMove = null;

                // NOTE: hack to support both Webkit and Moz Gamepad
                // TODO: use gamepad.js to normalise axis/button input
                if (GameHandler.webkitGamepad) {
                    switch (axis) {
                        case 0:  // LStick LR axis
                            this.input.axisMoveLR = delta;
                            break;
                        case 1:  // LStick UD axis
                            this.input.axisMoveUD = delta;
                            break;
                        case 2:  // RStick LR axis (2 for Webkit)
                            this.input.axisFireLR = delta;
                            break;
                        case 3:  // RStick UD axis (3 for Webkit)
                            this.input.axisFireUD = delta;
                            break;
                    }
                }
                else {
                    switch (axis) {
                        case 0:  // LStick LR axis
                            this.input.axisMoveLR = delta;
                            break;
                        case 1:  // LStick UD axis
                            this.input.axisMoveUD = delta;
                            break;
                        case 3:  // RStick LR axis (3 for Moz)
                            this.input.axisFireLR = delta;
                            break;
                        case 4:  // RStick UD axis (4 for Moz)
                            this.input.axisFireUD = delta;
                            break;
                    }
                }
                // round (debounce) to ensure there is some movement
                if (Math.round(this.input.axisFireLR) || Math.round(this.input.axisFireUD)) {
                    this.input.axisFire = new Vector(this.input.axisFireLR, this.input.axisFireUD);
                }
                if (Math.round(this.input.axisMoveLR) || Math.round(this.input.axisMoveUD)) {
                    this.input.axisMove = new Vector(this.input.axisMoveLR, this.input.axisMoveUD);
                }
            },

            /**
             * Render background effects for the scene
             */
            renderBackground: function renderBackground(ctx) {
                // render background effect - wire grid
                // manually transform world to screen for this effect and therefore
                // assume there is a horizonal and vertical "wire" every N units
                ctx.save();
                ctx.strokeStyle = "rgb(0,30,60)";
                ctx.lineWidth = 1.0;
                ctx.beginPath();

                var UNIT = 100;
                var w = this.world;
                xoff = UNIT - w.viewx % UNIT,
                    yoff = UNIT - w.viewy % UNIT,
                    // calc top left edge of world (prescaled)
                    x1 = (w.viewx >= 0 ? 0 : -w.viewx) * w.scale,
                    y1 = (w.viewy >= 0 ? 0 : -w.viewy) * w.scale,
                    // calc bottom right edge of world (prescaled)
                    x2 = (w.viewx < w.size - w.viewsize ? w.viewsize : w.size - w.viewx) * w.scale,
                    y2 = (w.viewy < w.size - w.viewsize ? w.viewsize : w.size - w.viewy) * w.scale;

                // plot the grid wires that make up the background
                for (var i = 0, j = w.viewsize / UNIT; i < j; i++) {
                    // check we are in bounds of the visible world before drawing grid line segments
                    if (xoff + w.viewx > 0 && xoff + w.viewx < w.size) {
                        ctx.moveTo(~~(xoff * w.scale) + 0.5, ~~(y1) + 0.5);
                        ctx.lineTo(~~(xoff * w.scale) + 0.5, ~~(y2) + 0.5);
                    }
                    if (yoff + w.viewy > 0 && yoff + w.viewy < w.size) {
                        ctx.moveTo(~~(x1) + 0.5, ~~(yoff * w.scale) + 0.5);
                        ctx.lineTo(~~(x2) + 0.5, ~~(yoff * w.scale) + 0.5);
                    }
                    xoff += UNIT;
                    yoff += UNIT;
                }

                ctx.closePath();
                ctx.stroke();

                // render world edges
                ctx.strokeStyle = "rgb(60,128,90)";
                ctx.lineWidth = 1;
                ctx.beginPath();

                if (w.viewx <= 0) {
                    xoff = -w.viewx;
                    ctx.moveTo(xoff * w.scale, y1);
                    ctx.lineTo(xoff * w.scale, y2);
                }
                else if (w.viewx >= w.size - w.viewsize) {
                    xoff = w.size - w.viewx;
                    ctx.moveTo(xoff * w.scale, y1);
                    ctx.lineTo(xoff * w.scale, y2);
                }
                if (w.viewy <= 0) {
                    yoff = -w.viewy;
                    ctx.moveTo(x1, yoff * w.scale);
                    ctx.lineTo(x2, yoff * w.scale);
                }
                else if (w.viewy >= w.size - w.viewsize) {
                    yoff = w.size - w.viewy;
                    ctx.moveTo(x1, yoff * w.scale);
                    ctx.lineTo(x2, yoff * w.scale);
                }

                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            },

            /**
             * Detect player collisions with various actor classes
             * including Enemies, bullets and collectables etc.
             */
            collisionDetectPlayer: function collisionDetectPlayer() {
                var playerRadius = this.player.radius;
                var playerPos = this.player.position;

                // test circle intersection with each enemy
                for (var n = 0, m = this.enemies.length; n < m; n++) {
                    var enemy = this.enemies[n];

                    // calculate distance between the two circles
                    if (playerPos.distance(enemy.position) <= playerRadius + enemy.radius) {
                        if (!(DEBUG && DEBUG.INVINCIBLE)) {
                            // reduce energy by appropriate level for enemy
                            this.player.damageBy(enemy);
                        }

                        // apply impact to player from the enemy vector due to collision
                        this.player.vector.add(enemy.vector.nscale(0.5));

                        // destroy enemy from impact - no score though for this!
                        enemy.damageBy(-1);
                        this.destroyEnemy(enemy, this.player.vector, false);

                        if (!this.player.alive) {
                            GameHandler.playSound("player-explosion");

                            // replace player with explosion
                            var boom = new Arena.PlayerExplosion(this.player.position.clone(), this.player.vector.clone());
                            this.effects.push(boom);
                        }
                    }
                }

                // test intersection with each enemy bullet
                for (var i = 0; i < this.enemyBullets.length; i++) {
                    var bullet = this.enemyBullets[i];

                    // calculate distance between the two circles
                    if (playerPos.distance(bullet.position) <= playerRadius + bullet.radius) {
                        // remove this bullet from the actor list as it has been destroyed
                        this.enemyBullets.splice(i, 1);

                        if (!(DEBUG && DEBUG.INVINCIBLE)) {
                            // reduce energy by appropriate level for bullet
                            this.player.damageBy(bullet);
                        }

                        // apply impact to player from the enemy vector due to collision
                        this.player.vector.add(bullet.vector.nscale(0.2));

                        // show an effect for the bullet impact
                        this.effects.push(new Arena.BulletImpactEffect(bullet.position.clone(), bullet.vector.nscale(0.5)));

                        if (!this.player.alive) {
                            // replace player with explosion
                            var boom = new Arena.PlayerExplosion(this.player.position.clone(), this.player.vector.clone());
                            this.effects.push(boom);
                        }
                    }
                }

                // test intersection with each collectable
                for (var i = 0; i < this.collectables.length; i++) {
                    var item = this.collectables[i];

                    // calculate distance between the two circles
                    if (playerPos.distance(item.position) <= playerRadius + item.radius) {
                        // collision detected - remove item from play and activate it
                        this.collectables.splice(i, 1);
                        item.collected(this.game, this.player, this);
                    }
                }
            },

            /**
             * Detect bullet collisions with enemy actors.
             */
            collisionDetectBullets: function collisionDetectBullets() {
                var bullet, bulletRadius, bulletPos;

                // collision detect player bullets with enemies
                // NOTE: test length each loop as list length can change
                for (var i = 0; i < this.playerBullets.length; i++) {
                    bullet = this.playerBullets[i];
                    bulletRadius = bullet.radius;
                    bulletPos = bullet.position;

                    // test circle intersection with each enemy actor
                    for (var n = 0, m = this.enemies.length, enemy, z; n < m; n++) {
                        enemy = this.enemies[n];

                        // test the distance against the two radius combined
                        if (bulletPos.distance(enemy.position) <= bulletRadius + enemy.radius) {
                            // impact the enemy with the bullet - may destroy it or just damage it
                            if (enemy.damageBy(bullet.power())) {
                                // destroy the enemy under the bullet
                                this.destroyEnemy(enemy, bullet.vector, true);
                                this.generateMultiplier(enemy);
                                this.generatePowerUp(enemy);
                            }
                            else {
                                GameHandler.playSound("enemy-hit");

                                // add bullet impact effect to show the bullet hit
                                var effect = new Arena.EnemyImpact(
                                    bullet.position.clone(),
                                    bullet.vector.nscale(0.5 + Rnd() * 0.5), enemy);
                                this.effects.push(effect);
                            }

                            // remove this bullet from the actor list as it has been destroyed
                            this.playerBullets.splice(i, 1);
                            break;
                        }
                    }
                }
            },

            /**
             * Destroy an enemy. Replace with appropriate effect.
             * Also applies the score for the destroyed item if the player caused it.
             *
             * @param enemy {Game.EnemyActor} The enemy to destory and add score for
             * @param parentVector {Vector} The vector of the item that hit the enemy
             * @param player {boolean} If true, the player was the destroyer
             */
            destroyEnemy: function destroyEnemy(enemy, parentVector, player) {
                // add an explosion actor at the enemy position and vector
                var vec = enemy.vector.clone();
                // add scaled parent vector - to give some momentum from the impact
                vec.add(parentVector.nscale(0.2));
                this.effects.push(new Arena.EnemyExplosion(enemy.position.clone(), vec, enemy));

                // play a sound
                GameHandler.playSound("enemy-explosion" + randomInt(1, 4));

                if (player) {
                    // increment score
                    var inc = (enemy.scoretype + 1) * 5 * this.game.scoreMultiplier;
                    this.game.score += inc;

                    // generate a score effect indicator at the destroyed enemy position
                    var vec = new Vector(0, -5.0).add(enemy.vector.nscale(0.5));
                    this.effects.push(new Arena.ScoreIndicator(
                        new Vector(enemy.position.x, enemy.position.y - 16), vec, inc));

                    // call event handler for enemy
                    enemy.onDestroyed(this, player);
                }

                this.enemyKills++;
            },

            /**
             * Generate score multiplier(s) for player to collect after enemy is destroyed
             */
            generateMultiplier: function generateMultiplier(enemy) {
                if (enemy.dropsMutliplier) {
                    var count = randomInt(1, (enemy.type < 5 ? enemy.type : 4));
                    for (var i = 0; i < count; i++) {
                        this.collectables.push(new Arena.Multiplier(enemy.position.clone(),
                            enemy.vector.nscale(0.2).rotate(Rnd() * TWOPI)));
                    }
                }
            },

            /**
             * Generate powerup for player to collect after enemy is destroyed
             */
            generatePowerUp: function generatePowerUp(enemy) {
                if (this.player.energy < this.player.ENERGY_INIT && Rnd() < 0.1) {
                    // only allow a fixed max number of powerup collectables visible at once
                    for (var i = 0, j = this.collectables.length, count = 0; i < j; i++) {
                        if (this.collectables[i] instanceof Arena.EnergyBoostPowerup) {
                            count++;
                        }
                    }
                    if (count < 2) {
                        this.collectables.push(new Arena.EnergyBoostPowerup(enemy.position.clone(),
                            enemy.vector.nscale(0.5).rotate(Rnd() * TWOPI)));
                    }
                }
            },

            /**
             * Render player information HUD overlay graphics.
             *
             * @param ctx {object} Canvas rendering context
             */
            renderOverlay: function renderOverlay(ctx) {
                var w = this.world,
                    width = GameHandler.width,
                    height = GameHandler.height;

                ctx.save();
                ctx.fillStyle = "white";
                ctx.font = '5pt "4pixel"';



                var now = new Date();

                //time global
                //time ship
                //time local
                ctx.fillText("UTC: " + (now.getUTCFullYear() + 986) + '-' +
                    ('0' + (now.getUTCMonth() + 1)).slice(-2) + '-' +
                    ('0' + now.getUTCDate()).slice(-2) + ' ' +
                    ('0' + now.getUTCHours()).slice(-2) + ':' +
                    ('0' + now.getUTCMinutes()).slice(-2) + ':' +
                    ('0' + now.getUTCSeconds()).slice(-2) + ' ' +
                    now.getUTCMilliseconds()
                    , width * 0.1, 20);
                //position x on globalmap
                ctx.fillText('POS: X:' + this.player.position.x.toFixed() , width * 0.7, 20);
                //position y on globalmap
                ctx.fillText(' Y:' + this.player.position.y.toFixed() , width * 0.7 + 24, 28);

                //angle in degrees
                //acceleration x
                //acceleration y
                //acceleration axis
                //velocity

                // debug output
                if (DEBUG && DEBUG.FPS) {
                    Game.fillText(ctx, "TPF: " + GameHandler.frametime, ctx.font, 0, height - Game.fontSize(w, 10) - 2, "lightblue");
                    Game.fillText(ctx, "FPS: " + GameHandler.maxfps, ctx.font, 0, height - 2, "lightblue");
                }

                ctx.restore();
            }
        });
})();

function add_zero_before(int, length) {
    valdecimalLength = int.ToString("D").Length + length;
    return format.replace(/%((%)|s)/g, function (m) { return m[2] || arg[i++] })
}

/**
 * Starfield star class.
 *
 * @namespace Arena
 * @class Arena.Star
 */
(function () {
    Arena.Star = function () {
        return this;
    };

    Arena.Star.prototype =
    {
        MAXZ: 15.0,
        VELOCITY: 0.1,

        x: 0,
        y: 0,
        z: 0,
        px: 0,
        py: 0,
        cycle: 0,

        init: function init() {
            // select a random point for the initial location
            this.x = (Rnd() * GameHandler.width - (GameHandler.width * 0.5)) * this.MAXZ;
            this.y = (Rnd() * GameHandler.height - (GameHandler.height * 0.5)) * this.MAXZ;
            this.z = this.MAXZ;
            this.px = 0;
            this.py = 0;
        },

        updateAndRender: function updateAndRender(i, ctx) {
            var xx = this.x / this.z,           // star position
                yy = this.y / this.z,
                e = (1.0 / this.z + 1) * 2,       // size i.e. z
            // hsl colour from a sine wave
            //hsl = "hsl(" + ((this.cycle * i) % 360) + ",90%,75%)";
                hsl = "#fff";
            cx = (GameHandler.width * 0.5), cy = (GameHandler.height * 0.5);

            if (this.px != 0) {
                ctx.strokeStyle = hsl;
                ctx.lineWidth = e;
                ctx.beginPath();
                ctx.moveTo(xx + cx, yy + cy);
                ctx.lineTo(this.px + cx, this.py + cy);
                ctx.closePath();
                ctx.stroke();
            }

            // update star position values with new settings
            this.px = xx;
            this.py = yy;
            this.z -= this.VELOCITY;

            // reset when star is out of the view field
            if (this.z < this.VELOCITY || this.px > GameHandler.width || this.py > GameHandler.height) {
                // reset star
                this.init();
            }

            // colour cycle sinewave rotation
            this.cycle += 0.05;
        }
    };
})();
