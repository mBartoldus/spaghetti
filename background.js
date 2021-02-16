const rain_texture = luz.Texture([4, 2], [
    "'", ' ', "¡", ' ',
    "&#160&#809&#781", ' ', ' ', ' ',
    "¡", ' ', "&#160&#809&#781", ' ',
    ' ', ' ', "'", ' ',
    "&#160&#809&#781", ' ', ' ', ' ',
    "'", ' ', "¡", ' ',
    ' ', ' ', "'", ' ',
    "¡", ' ', "&#160&#809&#781", ' '
], ' ')
const rain = luz.Environment([0, 0], [0, 0], [luz.Block([-100, 0], [1000, 6], rain_texture)])
rain.z = 0
rain.block[0].schedule_animation([0, 1, 2, 3], 150, true)

const tree_texture = luz.Texture([8, 5], "aaaa:aaaaaax *aaaa*   xaa·     +·       ", "a")
const line_texture = luz.Texture([25,1], "‾¨¨¨‾‾¨¨¨¨¨¨‾‾‾‾‾‾¨¨¨‾‾‾¨")
const forest = luz.Environment([0, 0], [0, 0],
    [
        luz.Block([-100, 10], [2000, 5], tree_texture),
        luz.Block([-100, 20], [2000, 1], line_texture)
    ]
)

const car = luz.Entity([40, 17], [10, 3],
    [
        luz.Sprite([9, -2], luz.Texture([4, 1], "____")),
        luz.Sprite([0, -1], luz.Texture([19, 1], [
            "_", "_", "_", "_", "\\̅", "\\", "\\&#773", "\\", "/",
            "\\", '_', "_", "_", "\\", '', '', "_", "_", "_"
        ])),
        luz.Sprite([0, 0], luz.Texture([12, 1], "\\  —————    ")),

        luz.Sprite([12, 0], luz.Texture([8, 1], "◡) ¯'\\◡)")),

        luz.Sprite([1, 1], luz.Texture([18, 1], [
            "[", "—", "—", "_", "_", "_", "_", "/", "¯", "\\", "_", "/&#818",
            "|&#818&#773", "|&#818&#773", "|&#818&#773", "|&#818&#773", "|&#818&#773", "/&#773"
        ])),
        luz.Sprite([3, 2], luz.Texture([14, 1], "\\_/   \\_/¯ \\_/"))
    ]
)

const moon_texture = luz.Texture([9, 5], [
    "", ".", "'", "‾", "‾", "◥̅", "■̲", "◣̲", "",
    "", "", "", "", "", "", "█̅", "█̅", "▙",
    "", "", "", "", "", "◀", "█̲̅", "▟̅", "█̅",
    "", "", "", "", "", "", "▂", "▟", "▛̅",
    "", "'", ".", "_", "_", "◢̲", "■̿", "◤̿", ""
])
const moon = luz.Entity([80, 0], [9, 5], [ luz.Sprite([0, 0], moon_texture) ])