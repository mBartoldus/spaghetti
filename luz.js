const luz = (function () {

    const _Animation = {
        frame: 0,
        queued_animation: undefined,
        cancel_animation() {
            let queued_animation = this.queued_animation
            if (typeof queued_animation == "object") {
                queued_animation.cancelled = true
                this.queued_animation = undefined
            }
        },
        schedule_animation(frames, delays = 100, looping = false, interpolate = false) {
            let i = 0, sprite = (this)
            if (interpolate) { for (let j = 0; j < frames.length; j++) if (frames[j] == sprite.frame) i = j + 1 }
            return (function _step() {
                if (i < frames.length || looping) {
                    i %= frames.length
                    sprite.cancel_animation()
                    luz.needs_rendering = true
                    sprite.frame = frames[i]
                    return sprite.queued_animation = schedule(delays[i++] || delays, _step)
                }
            })()
        },
    }

    const _Movement = {
        inertia() {
            let entity = (this)
            for (let axis = 0; axis < 2; axis++) {
                if (!entity.queued_inertia[axis]) {
                    (function _step() {
                        entity.cancel_inertia(axis)
                        if (entity.vel[axis]) {
                            entity.vel[axis] > 0 ? entity.loc[axis]++ : entity.loc[axis]--
                            luz.needs_rendering = true
                            let delay = Math.min(100 / Math.abs(entity.vel[axis]), 500)
                            entity.queued_inertia[axis] = luz.schedule(delay, _step)
                        }
                        "update" in entity && entity.update()
                    })()
                }
            }
        },
        cancel_inertia(axis) {
            if (axis === 0 || axis === 1) {
                let queued_inertia = this.queued_inertia[axis]
                if (typeof queued_inertia == "object") {
                    queued_inertia.cancelled = true
                    this.queued_inertia[axis] = undefined
                }
            } else {
                this.cancel_inertia(0)
                this.cancel_inertia(1)
            }
        },
        schedule_impulse(vel, delay) {
            let entity = (this)
            entity.cancel_impulse()
            return this.queued_impulse = schedule(delay, function () {
                entity.cancel_impulse()
                entity.vel[0] += vel[0]
                entity.vel[1] += vel[1]
                entity.inertia()
            })
        },
        cancel_impulse() {
            let queued_impulse = this.queued_impulse
            if (typeof queued_impulse == "object") {
                queued_impulse.cancelled = true
                this.queued_impulse = undefined
            }
        },
    }

    //------------------------------------------------------------------------

    function Texture(dim, text, alpha = '') {
        return {
            dim: new Int16Array(dim),
            text,
            alpha
        }
    }

    //------------------------------------------------------------------------

    function Block(loc, dim, texture) {
        return Object.assign({
            loc: new Int16Array(loc),
            dim: new Int16Array(dim),
            texture,
        }, _Animation)
    }

    //------------------------------------------------------------------------

    function Sprite(loc, texture) {
        return Object.assign({
            loc: new Int16Array(loc),
            texture,
        }, _Animation)
    }

    //------------------------------------------------------------------------
    let _environment_id = 0
    let environments = []
    function Environment(loc, dim, block, sprite) {
        let environment = {
            id: _environment_id,
            loc: new Int16Array(loc),
            dim: new Int16Array(dim),
            block,
            sprite,
            z: 1,
            visible: true,
        }
        environments[_environment_id++] = environment
        return environment
    }

    //------------------------------------------------------------------------
    let _entity_id = 0
    let entities = []
    function Entity(loc, dim, sprite, logic) {
        let entity = Object.assign({
            id: _entity_id,
            loc: new Int16Array(loc),
            dim: new Int16Array(dim),
            vel: new Float32Array(2),
            sprite,
            visible: true,
            queued_inertia: [],
            queued_impulse: undefined,
            attn: new Float32Array(2),
        }, _Movement, logic)
        entities[_entity_id++] = entity
        return entity
    }

    //------------------------------------------------------------------------

    function _init_buffer(camera, clearChar = ' ') {
        camera.buffer = [];
        let buffer_l = camera.buffer_w * camera.dim[1];
        for (let i = 0; i < buffer_l; i++) {
            if ((i + 1) % camera.buffer_w === 0) camera.buffer[i] = "\n";
            else camera.buffer[i] = clearChar;
        }
        camera.buffer[buffer_l - 1] = '';
    }
    const _Camera = {
        set_dimensions(dim) {
            let [x, y] = dim
            this.dim[0] = x > 1 ? 2 * Math.round(x / 2) : 2;
            this.buffer_w = this.dim[0] + 1;
            this.dim[1] = y > 1 ? 2 * Math.round(y / 2) : 2;
            _init_buffer(this);
            return this
        },
        clear_buffer(clearChar = ' ') {
            for (let i = 0; i < this.dim[1]; i++) {
                for (let j = 0; j < this.dim[0]; j++) { this.buffer[(i * this.buffer_w + j)] = clearChar; }
            }
            return this
        }
    }
    function Camera(loc, dim) {
        let camera = Object.assign({
            loc: new Int16Array(loc),
            dim: new Int16Array(2),
            buffer_w: 0,
            locus: undefined,
            offset: new Int16Array(2),
        }, _Camera)
        return camera.set_dimensions(dim)
    }

    //- SCHEDULING -----------------------------------------------------------

    let _last_frame = performance.now();
    let _in_game_time = _last_frame;
    let _paused = false;
    const _queue = [];
    function _check_queue() {
        while (_queue.length) {
            if (_queue[0].execution_time < _in_game_time) {
                if (typeof _queue[0].callback == "function" && !_queue[0].cancelled) {
                    _queue[0].callback()
                }
                _queue.shift()
            }
            else return;
        }
    }

    const _tick = function () {
        let time_since = performance.now() - _last_frame;
        if (!_paused) _in_game_time += time_since;
        _last_frame += time_since;
        return _in_game_time
    }

    function schedule(delay, callback) {
        let execution_time = _in_game_time + delay;
        let index = 0;
        if (_queue.length) {
            for (let i = _queue.length - 1; i >= 0; i--) {
                if (_queue[i].execution_time < execution_time) { index = i + 1; break; }
            }
        }
        let event = {
            execution_time,
            callback,
            cancelled: false,
        }
        _queue.splice(index, 0, event)
        return event
    }

    //- RENDERING ------------------------------------------------------------

    function _draw_sprites(entity, camera = luz.main_camera) {
        let sprite, texture,
            x_pos, x_min, x_max,
            y_pos, y_min, y_max;
        for (let i = 0; i < entity.sprite.length; i++) {
            sprite = entity.sprite[i];
            texture = sprite.texture;
            x_pos = entity.loc[0] + sprite.loc[0] - camera.loc[0];
            x_min = x_pos < 0 ? 0 : x_pos;
            x_max = x_pos + texture.dim[0];
            if (x_max > camera.dim[0]) x_max = camera.dim[0];
            y_pos = entity.loc[1] + sprite.loc[1] - camera.loc[1];
            y_min = y_pos < 0 ? 0 : y_pos;
            y_max = y_pos + texture.dim[1];
            if (y_max > camera.dim[1]) y_max = camera.dim[1];
            for (let y = y_min; y < y_max; y++) {
                for (let x = x_min; x < x_max; x++) {
                    let textureIndex = x - x_pos +
                        texture.dim[0] * (y - y_pos +
                            sprite.frame * texture.dim[1]);
                    if (texture.text[textureIndex] !== texture.alpha)
                        camera.buffer[(y * camera.buffer_w) + x] = texture.text[textureIndex];
                }
            }
        }
    }

    function _draw_blocks(entity, camera = luz.main_camera) {
        let block, texture,
            x_pos, x_min, x_max,
            y_pos, y_min, y_max;
        for (let i = 0; i < entity.block.length; i++) {
            block = entity.block[i];
            texture = block.texture;
            x_pos = entity.loc[0] + block.loc[0] - Math.floor(camera.loc[0] * entity.z);
            x_min = x_pos < 0 ? 0 : x_pos;
            x_max = x_pos + block.dim[0];
            if (x_max > camera.dim[0]) x_max = camera.dim[0];
            y_pos = entity.loc[1] + block.loc[1] - Math.floor(camera.loc[1] * entity.z);
            y_min = y_pos < 0 ? 0 : y_pos;
            y_max = y_pos + block.dim[1];
            if (y_max > camera.dim[1]) y_max = camera.dim[1];
            for (let y = y_min; y < y_max; y++) {
                for (let x = x_min; x < x_max; x++) {
                    let textureIndex =
                        (x - x_pos) % texture.dim[0] +
                        texture.dim[0] * ((y - y_pos) % texture.dim[1] +
                            texture.dim[1] * block.frame);
                    if (texture.text[textureIndex] !== texture.alpha)
                        camera.buffer[(y * camera.buffer_w) + x] = texture.text[textureIndex];
                }
            }
        }
    }
    const _display = document.getElementById("game_area");

    function render() {
        for (let e of environments) { if (e.visible) { _draw_blocks(e) } }
        for (let e of entities) { if (e.visible) { _draw_sprites(e) } }
        _display.innerHTML = luz.main_camera.buffer.join('');
        luz.main_camera.clear_buffer(" ");
        luz.needs_rendering = false
    }

    function loop() {
        _tick();
        _check_queue();
        luz.needs_rendering && render();
        window.requestAnimationFrame(loop);
    }

    return {
        Texture,
        Block,
        Sprite,
        Entity,
        Camera,

        schedule,
        Environment,
        entities,
        environments,

        needs_rendering: true,
        render,
        loop,

        main_camera: Camera([0, 0], [64, 32])
    }

})();