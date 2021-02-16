const input = (function () {
    const SMASH = 200
    const bit = {} // input.bit.RIGHT
    const flags = new Int16Array(3)
    const _bit_from_key = new Map()
    const _keyCode_from_bit = new Map()
    const _last_pressed_from_bit = new Map() // bit => timestamp

    function _reserve_bit() {
        let i = 1
        while (_keyCode_from_bit.has(i)) { i <<= 1 }
        return i
    }

    function _down(e) {
        e.preventDefault(); if (e.repeat) return;
        let bitflag = _bit_from_key.get(e.keyCode)
        flags[0] |= bitflag;
        flags[1] |= bitflag;
        _last_pressed_from_bit.set(bitflag, e.timeStamp);
        input.response();
        setTimeout(() => {
            if (~flags[0] & bitflag || performance.now() - _last_pressed_from_bit.get(bitflag) < SMASH * 0.8) { return }
            flags[1] &= ~bitflag;
            flags[2] &= ~bitflag;
        }, SMASH);
    }

    function _up(e) {
        let bitflag = _bit_from_key.get(e.keyCode)
        flags[0] &= ~bitflag;
        flags[2] |= bitflag;
        input.response();
        setTimeout(() => {
            if (performance.now() - _last_pressed_from_bit.get(bitflag) < SMASH * 0.8) return;
            flags[1] &= ~bitflag;
            flags[2] &= ~bitflag;
        }, SMASH);
    }

    return {
        HELD: 0,
        PRESSED: 1,
        RELEASED: 2,
        bit,
        flags,
        on() {
            document.onkeydown = _down
            document.onkeyup = _up
        },
        check_if_pressed(tag) { return !!(input.flags[1] & bit[tag]) },
        check_if_held(tag) { return !!(input.flags[0] & bit[tag]) },
        check_if_released(tag) { return !!(input.flags[2] & bit[tag]) },
        add(tag, keyCode) {
            if (typeof tag == "object") {
                for (let prop in tag) { this.add(prop, tag[prop]) }
            } else {
                let bitflag = _reserve_bit()
                bit[tag] = bitflag
                _bit_from_key.set(keyCode, bitflag)
                _keyCode_from_bit.set(bitflag, keyCode)
                _last_pressed_from_bit.set(bitflag, 0)
            }
            return this
        },
        remove() {
            for (let tag of arguments) {
                let bitflag = bit[tag]
                let keyCode = _keyCode_from_bit.get(bitflag)
                _bit_from_key.delete(keyCode)
                _keyCode_from_bit.delete(bitflag)
                _last_pressed_from_bit.delete(bitflag)
            }
            return this
        },
        response() { },
    }
})()
