const Cat = (function () {
    const cat_ears = luz.Texture([3, 1], "^ '' ^")
    const cat_face = luz.Texture([4, 1], "=..==··==˙˙==ᵥᵥ==▾▾==ᵛᵛ=", ' ')
    const cat_body = luz.Texture([5, 2], "(   )(   )", "a")
    // const cat_sweater = luz.Texture([5, 2], "(   )".split("").concat(["(", "♦̲̅", "♦̲̅", "♦̲̅", ")"]))
    const cat_squatting_feet = luz.Texture([3, 1], [
        "&#160&#812;", " ", "&#160&#812;",
        "ᵥ", " ", "&#160&#804&#803;",
        ".̈", " ", "&#160&#812;",
        "&#160&#804&#803;", " ", "ᵥ",
        "&#160&#812;", " ", ".̈"
    ])
    const cat_standing_feet = luz.Texture([3, 1], [
        "ᵥ", " ", "ᵥ",
        "·̈", " ", "v",
        "•̈", " ", "ᵥ",
        "v", " ", "·̈",
        "ᵥ", " ", "•̈",
    ])
    const cat_tail = luz.Texture([1, 1], "Ɛ3")
    const fork_idle = luz.Texture([1, 2], ['ψ', '\'', 'Ψ̣', '˙'])
    const fork_stab = luz.Texture([2, 1], "-∈Э-")

    const _cat_actions = {
        is_grounded: false,
        is_squat: false,
        pending_jump: false,
        is_facing: 1, // 1 == right, -1 == left
        is_sunglasses: false,
        is_stab: false,
        update() {
            this.is_grounded = this.loc[1] + this.dim[1] >= 20
            this.loc[0] < 0 && (this.loc[0] = 199)
            this.loc[0] > 200 && (this.loc[0] = 1)
            if (!this.is_grounded) {
                if (this.vel[1] == 0 && !this.queued_impulse) {
                    this.schedule_impulse([0, 3], 300)
                }
            } else {
                if (this.pending_jump) {
                    this.jump()
                } else {
                    this.vel[1] > 1 && (this.vel[1] = 0)
                    this.walk()
                    this.loc[1] = 20 - this.dim[1]
                }
            }
            this.look()
            luz.main_camera.loc.set([
                this.loc[0] - 30,
                this.loc[1] - this.is_squat * this.is_grounded - 20
            ])
            luz.needs_rendering = true
        },
        walk() {
            if (this.vel[0] == 0) this.sprite[3].frame = 0
            else {
                if (this.vel[0] > 0 ^ this.loc[0] > 0) {
                    this.sprite[3].frame = 4 - Math.abs(this.loc[0] >> 1) % 4
                } else {
                    this.sprite[3].frame = 1 + Math.abs(this.loc[0] >> 1) % 4
                }
                if (!this.is_stab) {
                    this.sprite[5].frame = this.sprite[3].frame > 2 ? 0 : 1
                }
            }
        },
        squat(is_squat = this.is_squat) {
            this.is_squat = is_squat
            if (is_squat) {
                if (this.is_grounded) {
                    this.loc[1]++
                }
                this.dim[1] = 2
                this.sprite[3].loc.set([0, 1])
                this.sprite[3].texture = cat_squatting_feet
            } else {
                this.dim[1] = 3
                this.sprite[3].loc.set([0, 2])
                this.sprite[3].texture = cat_standing_feet
            }
        },
        jump() {
            if (this.is_grounded) {
                this.vel[1] = -3
                let jump_time = 400
                this.schedule_impulse([0, 3], jump_time)
                this.pending_jump = false
            } else {
                this.pending_jump = true
            }
        },
        look(attn = this.attn) {
            this.attn.set(attn)
            let y = this.attn[1] / (Math.abs(this.attn[0]) + 0.5)
            let frame = 1
            y < -0.1 && (frame = 0)
            y > 0.1 && (frame = 2)
            frame += 3 * this.is_sunglasses
            if (this.sprite[2].frame !== frame) { luz.needs_rendering = true }
            this.sprite[2].frame = frame
            if (this.attn[0] < -0.01) { this.face(-1) }
            else if (this.attn[0] > 0.01) { this.face(1) }
        },
        face(direction) {
            if (direction > 0) {
                this.is_facing = 1
                this.sprite[0].frame = 0 // ears
                this.sprite[2].loc[0] = 0 // face
                this.sprite[4].frame = 0, this.sprite[4].loc.set([-2, 1]) // tail
                this.stab()
            } else if (direction < 0) {
                this.is_facing = -1
                this.sprite[0].frame = 1
                this.sprite[2].loc[0] = -1
                this.sprite[4].frame = 1, this.sprite[4].loc.set([4, 1])
                this.stab()
            }
        },
        sunglasses(is_sunglasses = this.is_sunglasses) {
            if (this.is_sunglasses != is_sunglasses) {
                this.is_sunglasses = !!is_sunglasses
                this.look()
                luz.needs_rendering = true
            }
        },
        stab(is_stab = this.is_stab) {
            this.is_stab = is_stab
            let fork_sprite = this.sprite[5]
            if (is_stab) {
                fork_sprite.texture = fork_stab
                if (this.is_facing > 0) {
                    fork_sprite.loc.set([4, !this.is_squat])
                    fork_sprite.frame = 0
                } else {
                    fork_sprite.loc.set([-3, !this.is_squat])
                    fork_sprite.frame = 1
                }
            } else {
                fork_sprite.texture = fork_idle
                if (this.is_facing > 0) {
                    fork_sprite.loc.set([4, 0])
                } else {
                    fork_sprite.loc.set([-2, 0])
                }
            }
        },
    }
    
    return function Cat() {
        return luz.Entity([65, 17], [3, 3],
            [
                luz.Sprite([0, -1], cat_ears),
                luz.Sprite([-1, 0], cat_body),
                luz.Sprite([0, 0], cat_face),
                luz.Sprite([0, 2], cat_standing_feet),
                luz.Sprite([-2, 1], cat_tail),
                luz.Sprite([4, 0], fork_idle),
            ],
            _cat_actions
        )
    }
})()