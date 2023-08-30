import { IServerAgent, LayoutAgent, OnlineAgent } from "./agent"
import { Move, Player, Players, which_player } from "../common/entity"
import { GameRound, GameStatus, GroupLayout, PlayerLayout } from "../common/game_round"
import { Hall } from "./hall"
import { Net } from "./net"
import { SessionId } from "../common/protocol"

export enum GameContextStatus
{
    NotStarted,
    WaitForPlayer,
    Submitting,
    WaitForOpponent,
    Loading,
    Victorious,
    Defeated,
    Tied
}

export class GameContext
{
    private rounds: GameRound[] = []
    status: GameContextStatus = GameContextStatus.NotStarted
    consumed_msec: Players<number> = Players.create(() => 0)
    round_begin_time: number = Date.now()

    new_round(round: GameRound, player: Player): void {
        this.rounds.push(round)
        this.round_begin_time = Date.now()
        this.update_status(player)
    }

    update_status(player: Player): void{
        switch (this.present.status){
            case GameStatus.Ongoing:
                if (which_player(this.present.group_to_move) == player) {
                    this.status = GameContextStatus.WaitForPlayer
                } else {
                    this.status = GameContextStatus.WaitForOpponent
                }
                break
            case GameStatus.WonByPlayer1:
                this.status = player == Player.P1 ? 
                              GameContextStatus.Victorious :
                              GameContextStatus.Defeated
                break
            case GameStatus.WonByPlayer2:
                this.status = player == Player.P2 ?
                              GameContextStatus.Victorious : 
                              GameContextStatus.Defeated
                break
            case GameStatus.Tied:
                this.status = GameContextStatus.Tied
                break
            default:
                throw new Error("Unknown status")
        }
    }

    // new_game(p1: PlayerLayout, p2: PlayerLayout): void {
    //     this.rounds = [ GameRound.new_game_by_layout(p1, p2) ]
    //     this.consumed_msec = Players.create(() => 0)
    // }

    prepare_layout(): void {
        this.rounds = [ GameRound.new_game_by_layout(new PlayerLayout(Player.P1, [new GroupLayout(), new GroupLayout()])) ]
    }

    get last(): GameRound | null
    {
        if (this.rounds.length >= 2)
        {
            return this.rounds[this.rounds.length - 2]
        }
        return null
    }

    get present(): GameRound
    {
        return this.rounds[this.rounds.length - 1]
    }

    // is_playing(): boolean
    // {
    //     return [
    //         GameContextStatus.WaitForOpponent,
    //         GameContextStatus.Submitting,
    //         GameContextStatus.WaitForPlayer,
    //         GameContextStatus.Loading,
    //     ].indexOf(this.status) > -1
    // }

    // is_waiting(): boolean
    // {
    //     return [
    //         GameContextStatus.WaitForOpponent,
    //         GameContextStatus.WaitForPlayer
    //     ].indexOf(this.status) > -1
    // }

    // is_finished(): boolean
    // {
    //     return [
    //         GameContextStatus.Victorious,
    //         GameContextStatus.Defeated,
    //         GameContextStatus.Tied
    //     ].indexOf(this.status) > -1
    // }

    // is_not_started(): boolean
    // {
    //     return this.status == GameContextStatus.NotStarted
    // }

    // is_first_round(): boolean
    // {
    //     return this.last == null
    // }
}

export type GameMode = 'layout' | 'match' | 'observer'

export class GameUiFacade{
    game_mode: GameMode = 'layout'
    context: GameContext = new GameContext()
    agent: IServerAgent | null = null
    hall: Hall | null = null
    saved_layout: PlayerLayout | undefined = undefined

    constructor(){}

    private destroy_agent(){
        if (this.agent){
            this.agent.destroy()
        }
    }

    layout_mode() {
        this.destroy_agent()
        this.game_mode = 'layout'
        this.agent = new LayoutAgent(this.context)
    }

    online_mode(session_id: SessionId, player_name: string){
        if (!this.hall) return
        this.destroy_agent()
        this.game_mode = this.hall.username == player_name ? 'match' : 'observer'
        this.agent = new OnlineAgent(this.context, session_id, this.hall.username, player_name)
    }

    current_player(): Player {
        if (this.game_mode == 'match' || this.game_mode == 'observer') {
            return (<OnlineAgent>this.agent).playing_as
        }
        return Player.P1
    }

    submit_move(move: Move): void 
    {
        if (this.agent)
        {
            this.agent.submit_move(move)
        }
    }

    initialize_hall(name: string): void {
        if (this.hall != null) {
            this.hall.destroy()
        }
        this.hall = new Hall(name, this)
    }

    current_layout(): PlayerLayout | undefined {
        let layout = this.context.present.get_layout(Player.P1)
        if (layout == undefined) {
            layout = this.saved_layout
        } else {
            this.saved_layout = layout
        }
        return layout
    }

    current_session(): SessionId | undefined {
        if (this.game_mode == 'match' || this.game_mode == 'observer') {
            return (<OnlineAgent>this.agent).session_id
        }
        return undefined
    }

    send_challenge(name: string) {
        if (this.hall) {
            let layout = this.current_layout()
            if (layout) {
                Net.send_challenge(
                    this.hall.username, name, 
                    layout.serialize(),
                    ()=>{}, ()=>{console.log('fail challenge')})
            }
        }
    }

    accept_challenge(name: string) {
        if (this.hall) {
            let layout = this.current_layout()
            if (layout) {
                Net.accept_challenge(
                    this.hall.username, name, layout.serialize(), ()=>{}, ()=>{
                        console.log('fail accept')
                    })
            }
        }
    }
}
