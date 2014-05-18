/**
 * FPS constant
 */
var FRAME_RATE = 60;

/**
 * Ideal FPS constant
 */
var FPSMS = 1000 / FRAME_RATE;

/**
 * Id dom element
 */
var DOM_OBJ_ID = "game";

/**
 * draw debug info
 */
var DEBUG = false;

/**
 * Size screen
 */
var MIN_SCREEN_SIZE = {x:640, y:480};

/**
 * meters in pixel by default
 */
var SCALE = 30;

var MIN_SCALE_SIZE = 0.00000001;

var MAX_SCALE_SIZE = 30;

var SCROLL_SPEED = 50; //in %

/**
 * Force of gravity on Earth
 */
var GLOBAL_GRAVITY = 0.0;

var ALLOW_SLEEP = true;

var CENTER_SYSTEM_X = 100000000000;
var CENTER_SYSTEM_Y = 50000000000;


/**
 * Keycode constants
 */
var KEY = {
    SHIFT: 16, CTRL: 17, ESC: 27, RIGHT: 39, UP: 38, LEFT: 37, DOWN: 40, SPACE: 32,
    A: 65, D: 68, E: 69, G: 71, L: 76,Q: 81, P: 80, R: 82, S: 83, T: 84, W: 87, Z: 90, OPENBRACKET: 219, CLOSEBRACKET: 221
};