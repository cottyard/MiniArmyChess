//import { Player, Players } from "../../common/entity"
import { Coordinate, Unit, all_unit_types } from "../../common/entity"
import { GameStatus } from "../../common/game_round"
import { IGameUiFacade } from "../game"
import { IBoardDisplay } from "./board_display"
import { type_to_literal } from "./canvas_entity"
import { IComponent, DomHelper } from "./dom_helper"

function observation_literal(unit: Unit): string {
    let l = [type_to_literal(unit.type), ":"]
    for (let t of all_unit_types) {
        if (unit.skeptical(t.id)) {
            l.push(type_to_literal(t))
        }
    }
    return l.join(' ')
}

export class StatusBar implements IComponent
{
    cursor: Coordinate | undefined = undefined
    constructor(
        public dom_element: HTMLDivElement,
        public board_display: IBoardDisplay,
        public game: IGameUiFacade)
    {
        // setInterval(() =>
        // {
        //     this.render()
        // }, 1000)
    }

    render(cursor: Coordinate | undefined = undefined)
    {
        if (cursor) this.cursor = cursor
        this.dom_element.innerHTML = ""

        DomHelper.apply_style(this.dom_element, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            height: "40px"
        })

        // for (let player of Players.both())
        // {
        //     // this.dom_element.appendChild(this.player_status(
        //     //     player,
        //     //     this.game.context.players_name[player] || "",
        //     //     player == this.game.context.player
        //     // ))
        // }

        let round_number = this.game.context.present.round_count
        this.dom_element.appendChild(DomHelper.create_text(
            `Step ${ round_number }`,
            {
                'text-align': 'left',
                fontWeight: "bold",
                flexGrow: 1,
            }))

        if (this.game.context.present.status != GameStatus.Ongoing) {
            this.dom_element.appendChild(DomHelper.create_text(
                "End",
                {
                    'text-align': 'center',
                    fontWeight: "bold",
                    flexGrow: 1,
                }))
        }

        if (this.cursor) {
            let unit = this.game.context.present.board.unit.at(this.cursor)
            if (unit == null) return
            this.dom_element.appendChild(DomHelper.create_text(
                observation_literal(unit),
                {
                    'text-align': 'right',
                    fontWeight: "bold",
                    flexGrow: 1,
                }))
        }
    }

    // timestamp(consumed: number)
    // {
    //     function display(v: number): string
    //     {
    //         let display = v.toString()
    //         return display.length < 2 ? '0' + display : display
    //     }
    //     let _seconds = Math.floor(consumed / 1000)
    //     let seconds = _seconds % 60
    //     let _minutes = (_seconds - seconds) / 60
    //     let minutes = _minutes % 60
    //     let _hours = (_minutes - minutes) / 60
    //     return `${ display(_hours) }:${ display(minutes) }:${ display(seconds) }`
    // }

    // player_status(
    //     player: Player,
    //     name: string,
    //     is_me: boolean
    // ): HTMLElement
    // {
    //     const div = DomHelper.create_div({
    //         display: "flex",
    //         flexDirection: "row",
    //         marginLeft: "10px",
    //         marginRight: "10px",
    //         alignItems: "center",
    //         fontWeight: is_me ? "bold" : "normal",
    //     })

    //     // div.appendChild(DomHelper.create_text(name, {
    //     //     color: Players.color[player]
    //     // }))

    //     // let text = null
    //     // if (this.game.context.players_moved[player])
    //     // {
    //     //     text = '🟢'
    //     // }
    //     // else
    //     // {
    //     //     text = '🟡'
    //     // }
    //     // if (text)
    //     // {
    //     //     div.appendChild(DomHelper.create_text(text, {
    //     //         marginLeft: "10px"
    //     //     }))
    //     // }

    //     // let consumed = this.game.context.consumed_msec[player]
    //     // if (this.game.context.is_waiting() && !this.game.context.players_moved[player])
    //     // {
    //     //     consumed += Date.now() - this.game.context.round_begin_time
    //     // }
        
    //     // div.appendChild(DomHelper.create_text(
    //     //     this.timestamp(consumed),
    //     //     {
    //     //         marginLeft: "3px"
    //     //     }
    //     // ))

    //     return div
    // }
}
