import { Move, Player} from "../common/entity"
import { GameRound } from "../common/game_round"
import { session_signal_interval, SessionDigest } from "../common/protocol"
import { GameContextStatus, GameContext } from "./game_context"
import { Net } from "./net"
import { event_box } from "./ui/ui"

export interface IServerAgent
{
    submit_move(move: Move): void
    destroy(): void
}

abstract class GameAgent implements IServerAgent
{
    constructor(protected context: GameContext) {}
    abstract submit_move(move: Move): void
    destroy(): void {}
}

export class LayoutAgent extends GameAgent
{
    constructor(context: GameContext)
    {
        super(context)
        this.context.prepare_layout()
        this.context.status = GameContextStatus.NotStarted
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

    playing_as: Player = Player.P1
    opponent_name: string | null = null

    constructor(context: GameContext, public session_id: string, public user: string, public player_name: string)
    {
        super(context)
        this.context.prepare_layout()
        this.context.status = GameContextStatus.NotStarted
        event_box.emit("refresh ui", null)

        this.query_handle = setInterval(this.pull_session.bind(this), session_signal_interval)
        this.pull_session()
    }

    destroy(): void {
        clearInterval(this.query_handle)
    }

    pull_session(): void {
        Net.get_session(this.session_id, this.user, this.player_name, this.wait_session.bind(this), ()=>{
            console.log('no session', this.session_id)
        })
    }

    wait_session(digest: string){
        let session_digest: SessionDigest = JSON.parse(digest)
        if (session_digest.last_update != this.session_timestamp)
        {
            this.playing_as = session_digest.as
            this.opponent_name = session_digest.opponent
            this.load_game(() => {this.session_timestamp = session_digest.last_update})
        }
    }

    submit_move(move: Move): void {
        if (!this.context.present.validate_move(move)) return

        this.context.status = GameContextStatus.Submitting
        event_box.emit("refresh ui", null)
        let msec_consumed: number = Date.now() - this.context.round_begin_time
        Net.submit_move(
            this.session_id,
            this.player_name,
            move.serialize(),
            msec_consumed, 
            (_: string) => {
                this.pull_session()
            }, () => {
                console.log('submit fail')
            })
    }

    load_game(on_success: () => void){
        this.context.status = GameContextStatus.Loading
        event_box.emit("refresh ui", null)
        console.log('loading from', this.session_id)
        Net.get_game(this.session_id, (serialized_game) =>
        {
            let game_payload = JSON.parse(serialized_game)
            this.context.new_round(GameRound.deserialize(game_payload), this.playing_as)
            on_success()
            event_box.emit("refresh ui", null)
        }, () => {})
    }
}