//import { Player, Players } from "../../common/entity"
import { Coordinate, Unit} from "../../common/entity"
import { GameContextStatus, GameUiFacade } from "../game_context"
import { BoardDisplay } from "./board_display"
import { type_to_literal } from "./canvas_entity"
import { IComponent, DomHelper } from "./dom_helper"

function observation_literal(unit: Unit): string {
    return unit.possible_types().map((id)=>type_to_literal(id)).join(' ')
}

const status_messages = new Map<GameContextStatus, string>([
    [GameContextStatus.NotStarted, '布局'],
    [GameContextStatus.WaitForPlayer, '你走'],
    [GameContextStatus.Submitting, '正在提交'],
    [GameContextStatus.WaitForOpponent, '等对手走'],
    [GameContextStatus.Loading, '正在载入'],
    [GameContextStatus.Victorious, '你赢了'],
    [GameContextStatus.Defeated, '你输了'],
    [GameContextStatus.Tied, '平局'],
])
    
export class StatusBar implements IComponent
{
    cursor: Coordinate | undefined = undefined
    constructor(
        public dom_element: HTMLDivElement,
        public board_display: BoardDisplay,
        public game: GameUiFacade)
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
            `Step ${ round_number }`,{
                'text-align': 'left',
                fontWeight: "bold",
                flex: 1,
            }))

        let status_message = status_messages.get(this.game.context.status)!
        this.dom_element.appendChild(DomHelper.create_text(
            status_message ,{
                'text-align': 'center',
                fontWeight: "bold",
                flex: 1,
            }))

        let observation_message = ' '
        if (this.cursor) {
            let unit = this.game.context.present.board.units.at(this.cursor)
            if (unit && unit.owner != this.game.current_player()) {
                observation_message = observation_literal(unit)
            }
        }
        this.dom_element.appendChild(DomHelper.create_text(
            observation_message ,{
                'text-align': 'right',
                flex: 1,
            }))
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
