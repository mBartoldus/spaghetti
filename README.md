# spaghetti

## Concept

This game is a loveletter to javascript. It was written vanilla, and runs in the browser with no need for a server or internet connection. All you have to do is download the folder and double click the index file.

You're a cat with a fork. Use the arrow keys to move, "z" is jump, "x" is stab, "s" is wear sunglasses. Moving your mouse gets the cat's attention.

The cat's name is spaghetti. He's named after the style of code his world was written in (:

Try it out! https://mbartoldus.github.io/spaghetti/

## How it works

Index.html loads scripts in the following order:

    1. input.js      // input handling
    2. luz.js        // physics and rendering
    3. background.js // various background assets, 
    4. cat.js        // the cat class
    5. spaghetti.js  // instantiating the player character

The first two (input.js, luz.js) provide the basis for the game engine, and will require the most explanation. The last three files explore asset creation, classes, and input response in the context of that engine.

## Input.js

The input file introduces an "input" object to the global namespace. This object uses bitflags to keep track of which buttons are held, recently pressed, or recently released. It has the following properties and methods:

### input.add(tag, keyCode)
Registers a key for use as controller input. A bitflag between 1 and 16 is reserved for tracking the state of that key, and a new property will be added to the "input.bit" lookup.

### input.bit
An object for looking up bitflags. If you registered 4 keys as "UP", "DOWN", "LEFT", and "RIGHT" (in that order), the bit object would end up with the following properties:

    input.bit.UP    === 1     // 2 ^ 0  
    input.bit.DOWN  === 2     // 2 ^ 1 
    input.bit.LEFT  === 4     // 2 ^ 3
    input.bit.RIGHT === 8     // 2 ^ 4

### input.remove(tag)
removes a key, freeing that bit and deleting the relevant property from the bit object
    
### input.flags
A new Int16Array(3) holding the bitflags representing each button's state.

    flags[0]   // which buttons are currently held,
    flags[1]   // recently pressed,
    flags[2]   // or recently released

### input.HELD, input.PRESSED, input.RELEASED

These 3 act as enums, for clarity of intent when accessing flags.

    flags[input.HELD] === flags[0]
    flags[input.PRESSED] === flags[1]
    flags[input.RELEASED] === flags[2]
    
### input.on()
Sets the event listeners required for everything to work. Might become unnecessary in future versions, I wrote this part before I understood much about event listeners.

### input.response()
a callback fired every time the state changes
> by default this function does nothing, it's meant to be replaced with custom game-specific code. Here, the input.response method is defined in the final file, "spaghetti.js", correlating user input with the character "spaghetti".

### input.check_if_pressed(tag), check_if_held(), check_if_released()
These are self-explanatory. Returns a bool.

The .check_if...() methods are there for convenience in trivial situations, but there are times that call for more creativity. For example:

    let bit = input.bit
    switch (input.flags[input.HELD] & (bit.RIGHT | bit.LEFT)) {
        case bit.RIGHT:
            spaghetti.vel[0] = 3
            spaghetti.face(1)
            break;
        case bit.LEFT:
            spaghetti.vel[0] = -3
            spaghetti.face(-1)
            break;
        default:
            spaghetti.vel[0] = 0
            break;
    }

In this situation, we only want the character to move if *either* RIGHT or LEFT are being held - not both. To do this, I pulled up the HELD bits, and use a bitmask (binary "&") to only look at the ones representing RIGHT and LEFT. If the player is holding both RIGHT and LEFT, then the switch statement will default, treating it the same as if neither were held.

# Luz.js

luz also generates a namespace, which provides various constructors for making entities, textures, etc. Its properties are as follows:

     Texture,           // an ascii texture. can be a string or an array of strings

     Block,             // repeating texture covering a certain area
                        // texture 
     Sprite,            // non-repeating texture
     Entity,
     Camera,

     schedule,          // in-game setTimeout

     Environment,       // may have a z component
     entities,
     environments,

     needs_rendering    // false while the game is idle, set to true when something changes onscreen

     render,            // appends main_camera's buffer to html, sets needs_rendering to false
     loop,              // in-game event loop

     main_camera        // the camera that renders to the html element

# STILL A WORK IN PROGRESS
