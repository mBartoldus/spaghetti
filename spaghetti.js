let spaghetti = Cat()

input.add({
    UP: 38,
    LEFT: 37,
    DOWN: 40,
    RIGHT: 39,
    JUMP: 90,
    FORK: 88,
    GLASSES: 83,
})

document.onmousemove = function (e) {
    let x = e.pageX / window.innerWidth
    let y = e.pageY / window.innerHeight
    let coords = [x - 0.5, -y + 0.6]
    spaghetti.attn.set(coords)
    spaghetti.look()
}

input.response = function () {
    let bit = input.bit
    switch (input.flags[input.HELD] & (bit.UP | bit.DOWN)) {
        case bit.UP:
            spaghetti.attn.set([0, 1])
            spaghetti.look()
            break;
        case bit.DOWN:
            spaghetti.squat(true)
            break;
        default:
            spaghetti.attn.set([0, 0])
            spaghetti.look()
            spaghetti.squat(false)
            break;
    }
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

    if (spaghetti.pending_jump = input.check_if_held("JUMP")) {
        if(input.check_if_pressed("JUMP")) spaghetti.jump()
    } else if (spaghetti.vel[1] < 0) {
        spaghetti.vel[1] = 0
        spaghetti.cancel_impulse()
    }

    spaghetti.inertia()
    spaghetti.stab(input.check_if_held("FORK"))
    spaghetti.sunglasses(input.check_if_held("GLASSES"))
}

input.on()
luz.loop()