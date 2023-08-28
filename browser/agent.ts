import { Move} from "../common/entity"
import { GameRound } from "../common/game_round"
import { session_signal_interval, SessionDigest } from "../common/protocol"
import { GameContextStatus, GameContext } from "./game_context"
import { Net } from "./net"
import { event_box } from "./ui/ui"

export interface IServerAgent
{
    submit_move(move: Move): void
    //new_game(name: string): void
    destroy(): void
}

abstract class GameAgent implements IServerAgent
{
    constructor(protected context: GameContext) {}
    abstract submit_move(move: Move): void
    //abstract new_game(_: string): void
    destroy(): void {}
}

export class LayoutAgent extends GameAgent
{
    constructor(context: GameContext)
    {
        super(context)
        this.context.prepare_layout()
        this.context.status = GameContextStatus.WaitForPlayer
        event_box.emit("refresh ui", null)
    }
    
    submit_move(move: Move): void
    {
        if (this.context.present.modify_layout(move)) {
            event_box.emit("refresh ui", null)
        }
    }
}

export class OnlineAgent extends GameAgent
{
    private session_timestamp: number = 0
    private query_handle: NodeJS.Timeout

    constructor(context: GameContext, public session_id: string, public player_name: string)
    {
        super(context)
        this.context.status = GameContextStatus.NotStarted
        event_box.emit("refresh ui", null)

        this.query_handle = setInterval(() =>{
            Net.get_session(this.session_id, this.player_name, this.wait_session.bind(this), ()=>{
                console.log('no session', this.session_id)
            })
        }, session_signal_interval)
    }

    destroy(): void {
        clearInterval(this.query_handle)
    }

    wait_session(digest: string){
        let session_digest: SessionDigest = JSON.parse(digest)
        
        if (session_digest.last_update != this.session_timestamp)
        {
            //let player = find_player(session_digest.players, this.player_name)
            let self = this
            this.load_game(() => {self.session_timestamp = session_digest.last_update})
            event_box.emit("refresh ui", null)
        }
    }

    submit_move(_move: Move): void {
        throw new Error("Method not implemented.")
    }

    load_game(on_success: () => void)
    {
        if (this.context.status == GameContextStatus.Loading) return

        this.context.status = GameContextStatus.Loading
        
        Net.get_game(this.session_id, (serialized_game) =>
        {
            let game_payload = JSON.parse(serialized_game)
            this.context.new_round(GameRound.deserialize(game_payload))
            on_success()
            event_box.emit("refresh ui", null)
        }, () => {})
    }
}

    // submit_move(): void
    // {
    //     if (this.current_game_id)
    //     {
    //         this.context.status = GameContextStatus.Submitting
    //         this.stop_count_down()
    //         event_box.emit("refresh counter", null)
    //         event_box.emit("refresh ui", null)
    //         let msec_consumed: number = Date.now() - this.context.round_begin_time
    //         Net.submit_move(
    //             this.current_game_id, 
    //             this.context.staging_area.move,
    //             msec_consumed, 
    //             (_: string) =>
    //             {
    //                 this.context.status = GameContextStatus.WaitForOpponent
    //                 event_box.emit("refresh ui", null)
    //             })
    //     }
    // }

    // new_game(name: string): void
    // {
    //     this.player_name = name
    //     Net.new_game(
    //         name, 
    //         (session: string) =>
    //         {
    //             let session_id = JSON.parse(session)
    //             console.log('new session:', session_id)
    //             this.context.status = GameContextStatus.InQueue
    //             this.context.clear_as_newgame()
    //             this.session_id = session_id
    //             this.latest_game_id = null
    //             this.current_game_id = null
    //             event_box.emit("refresh ui", null)
    //         })
    // }