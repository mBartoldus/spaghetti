# Concept

This game is a loveletter to javascript. It was written vanilla, and runs in the browser with no need for a server or internet connection. All you have to do is download the folder and double click the index file.

You're a cat with a fork. Use the arrow keys to move, "z" is jump, "x" is stab, "s" is wear sunglasses. Moving your mouse gets the cat's attention.

The cat's name is spaghetti. He's named after the style of code his world was written in (:

Try it out! https://mbartoldus.github.io/spaghetti/

# How it works

Index.html loads scripts in the following order:

    1. input.js      // input handling
    2. luz.js        // physics and rendering
    3. background.js // various background assets, 
    4. cat.js        // the cat class
    5. spaghetti.js  // instantiating the player character

The first two (input.js, luz.js) provide the basis for the game engine, and will require the most explanation. The last three files explore asset creation, classes, and input response in the context of that engine.

# Input.js

The input file introduces an "input" object to the global namespace. This object uses bitflags to keep track of which buttons are held, recently pressed, or recently released. It has the following properties and methods:

---
### input.add(tag, keyCode)
Registers a key for use as controller input. A bitflag between 1 and 16 is reserved for tracking the state of that key, and a new property will be added to the "input.bit" lookup.

---
### input.bit
An object for looking up bitflags. If you registered 4 keys as "UP", "DOWN", "LEFT", and "RIGHT" (in that order), the bit object would end up with the following properties:

    input.bit.UP    === 1     // 2 ^ 0  
    input.bit.DOWN  === 2     // 2 ^ 1 
    input.bit.LEFT  === 4     // 2 ^ 3
    input.bit.RIGHT === 8     // 2 ^ 4

---
### input.remove(tag)
removes a key, freeing that bit and deleting the relevant property from the bit object

---
### input.flags
A new Int16Array(3) holding the bitflags representing each button's state.

    flags[0]   // which buttons are currently held,
    flags[1]   // recently pressed,
    flags[2]   // or recently released

---
### input.HELD, input.PRESSED, input.RELEASED

These 3 act as enums, for clarity of intent when accessing flags.

    flags[input.HELD] === flags[0]
    flags[input.PRESSED] === flags[1]
    flags[input.RELEASED] === flags[2]

---
### input.on()
Sets the event listeners required for everything to work. Might become unnecessary in future versions, I wrote this part before I understood much about event listeners.

---
### input.response()
a callback fired every time the state changes
> by default this function does nothing, it's meant to be replaced with custom game-specific code. Here, the input.response method is defined in the final file, "spaghetti.js", correlating user input with the character "spaghetti".

---
### input.check_if_...(tag)

Check_if_pressed, check_if_held, check_if_released. These are self-explanatory. Returns a bool.

    input.check_if_pressed( bit.JUMP ) && character.jump()

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

Luz is the game engine. This file also generates a namespace, providing various constructors for making entities, textures, etc. Its properties are as follows:

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

---
### luz.Texture(dim, text, alpha)
Generates an ascii texture. The first parameter, "dim" sets the dimensions of the texture.

> Keep in mind each character is roughly twice as tall as it is wide. So, a [2,2] texture will look rectangular, not square.

The second parameter initializes the actual text. If you're only using well-behaved monospace characters, then a string will work nicely. If, on the other hand, you're forced into using HTML codes by characters like "<", then you'll want to store the text as an array of strings.

	"('-')"			// this works
	"('<')"			// the "<" character will cause problems
	['(',"'",'&#60',"'",')'] 	// the laborious workaround

If you're using combining diacritics, you might run into a similar issue, as the letter and its diacritic will be interpreted as two characters when accessed via string.

	"ä"		// seen as two characters
	["ä"]		// seen as one

> As I write this, I realize how trivial it would be to make a function that just takes your strings, detects anything within the combining characters block, and automatically parses it into one of these well-behaved arrays. I will definitely include that in the next version; it's unreasonable to expect anyone to do all this.

Animated textures work by storing frames in sequence. The following is an animated texture which smiles on the 0th frame, frowns on the 2nd, and the 1st provides an in-between.

	let emoticon = luz.Texture([2,1], ":):|:(")

> This part can easily cause bugs, if one character is missing in one of the middle frames it will misalign all of the following ones.

Finally, the alpha parameter allows you to set a certain character to be interpreted as transparent. By default, it's an empty string, but you might find it useful to set this to a space, " ", or something else.

---
### luz.Block(loc, dim, texture)
A block, in this context, repeats a texture over a certain area. "loc" defines the location of the block's top-left corner, relative to its "environment" (see luz.Environment). Blocks have properties and methods for animation, which they share with Sprites. They are:

    .frame                  // index representing the current frame
    .queued_animation       // a pointer to the next scheduled animation event
    .cancel_animation()     // cancels the scheduled animation

    .schedule_animation (
        frames,             // an array representing the frames
        delays,             // the time delay in milliseconds between frames. can be a single number or an array corresponding to each frame
        looping,            // If true then the animation loops indefinitely. False by default
        interpolate         // If true, the scheduled animation will continue from the current frame instead of the 0th index. False by default
    )

---
### luz.Sprite(loc, texture)
Sprites place a texture relative to an Environment or an Entity. Sprites don't need specified dimensions, as they display their texture in full. Shares animation properties with luz.Block().

---
### luz.Entity(loc, dim, sprites, logic)
Creates a game entity. Loc should be a 2-array relative to worldspace. Dim is for collision detection purposes. "Sprites" takes an array of sprites, logic will be an object, whatever you want it to be. Any custom methods or properties you want to add to the entity. An Entity has methods that allow it to move, as well.

    .inertia(axis)                  // Evaluates velocity and updats position along an axis, 0(x) or 1(y). Evaluates both by default
    .queued_inertia[2]              // Events representing next discrete movement along both axes
    .cancel_inertia(axis)           // Cancels one or both of those events. 

    .schedule_impulse(vel, delay)   // Schedules the addition of a velocity vector
    .queued_impulse                 // the upcoming impulse
    .cancel_impulse()               // cancels the scheduled impulse

> you can iterate over each entity in the array: luz.entities

---
### luz.Environment(loc, dim, blocks, sprites)
For constructing a scene. Similar parameters to luz.Entity().

> you can iterate over each environment in the array: luz.environments

---
### luz.Camera(loc, dim)
Something responsible for drawing textures to a buffer.

---
### luz.schedule(delay, callback)
Essentially setTimeout(), but it respects in-game time.

---
### luz.needs_rendering
A bool representing whether or not the scene needs to be re-drawn. Any method that would warrant re-drawing already handles this, but if you're manually changing the frame of a sprite or the location of an entity, you're going to want to change this to true.

---
### luz.main_camera
The camera that ends up rendering to the viewport!

# To be continued
