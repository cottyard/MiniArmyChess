import { IServerAgent, LayoutAgent, OnlineAgent } from "./agent"
import { Move, Player, Players } from "../common/entity"
import { GameRound, GameStatus, GroupLayout, PlayerLayout } from "../common/game_round"
import { Hall } from "./hall"
import { Net } from "./net"
import { SessionId } from "../common/protocol"

export enum GameContextStatus
{
    InMenu,
    NotStarted,
    InQueue,
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
    
    players_name: Players<string> = {
        [Player.P1]: 'player 1',
        [Player.P2]: 'player 2'
    }

    status: GameContextStatus = GameContextStatus.InMenu
    consumed_msec: Players<number> = Players.create(() => 0)
    round_begin_time: number = Date.now()

    private _player: Player

    constructor(){
        this._player = Player.P1
    }

    get player(){
        return this._player
    }

    set player(value: Player){
        this._player = value
    }

    new_round(round: GameRound): void {
        this.rounds.push(round)
        this.round_begin_time = Date.now()
        this.update_status()
    }

    update_status(): void{
        switch (this.present.status)
        {
            case GameStatus.WonByPlayer1:
                this.status = this.player == Player.P1 ? 
                              GameContextStatus.Victorious :
                              GameContextStatus.Defeated
                break
            case GameStatus.WonByPlayer2:
                this.status = this.player == Player.P2 ?
                              GameContextStatus.Victorious : 
                              GameContextStatus.Defeated
                break
            case GameStatus.Ongoing:
                this.status = GameContextStatus.WaitForPlayer
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

    is_in_menu(): boolean 
    {
        return this.status == GameContextStatus.InMenu
    }

    is_playing(): boolean
    {
        return [
            GameContextStatus.WaitForOpponent,
            GameContextStatus.Submitting,
            GameContextStatus.WaitForPlayer,
            GameContextStatus.Loading,
        ].indexOf(this.status) > -1
    }

    is_waiting(): boolean
    {
        return [
            GameContextStatus.WaitForOpponent,
            GameContextStatus.WaitForPlayer
        ].indexOf(this.status) > -1
    }

    is_in_queue(): boolean
    {
        return this.status == GameContextStatus.InQueue
    }

    is_finished(): boolean
    {
        return [
            GameContextStatus.Victorious,
            GameContextStatus.Defeated,
            GameContextStatus.Tied
        ].indexOf(this.status) > -1
    }

    is_not_started(): boolean
    {
        return this.status == GameContextStatus.NotStarted
    }

    is_first_round(): boolean
    {
        return this.last == null
    }
}

export type GameMode = 'layout' | 'online'

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

    online_mode(session_id: SessionId){
        if (!this.hall) return
        this.destroy_agent()
        this.game_mode = 'online'
        this.agent = new OnlineAgent(this.context, session_id, this.hall.username)
    }

    current_player(): Player {
        if (this.game_mode == 'online') {
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

    watch(name: string) {
        Net.watch(name, (session_id: string)=>{
            this.online_mode(session_id)
        }, ()=>{console.log('fail')})
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
