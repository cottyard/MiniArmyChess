import { IServerAgent, LocalAgent } from "./agent";
import { Move, Player, Players } from "../common/entity";
import { GameRound, GameStatus } from "../common/game_round";

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

export interface IGameContext
{
    player: Player
    last: GameRound | null
    present: GameRound
    status: GameContextStatus
    consumed_msec: Players<number>
    players_name: Players<string>
    round_begin_time: number
    new_game(): void
    new_round(round: GameRound): void
    is_in_menu(): boolean
    is_playing(): boolean
    is_waiting(): boolean
    is_in_queue(): boolean
    is_finished(): boolean
    is_not_started(): boolean
    is_first_round(): boolean
}

export class GameContext implements IGameContext
{
    private rounds: GameRound[] = [ GameRound.new_game() ];
    
    players_name: Players<string> = {
        [Player.P1]: 'player 1',
        [Player.P2]: 'player 2'
    };

    status: GameContextStatus = GameContextStatus.InMenu;
    consumed_msec: Players<number> = Players.create(() => 0);
    round_begin_time: number = Date.now();

    private _player: Player;

    constructor()
    {
        this._player = Player.P1;
    }

    get player()
    {
        return this._player;
    }

    set player(value: Player)
    {
        this._player = value;
    }

    new_round(round: GameRound): void 
    {
        this.rounds.push(round)
        this.round_begin_time = Date.now()
        this.update_status()
    }

    update_status(): void
    {
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

    new_game(): void {
        this.rounds = [ GameRound.new_game() ]
        this.consumed_msec = Players.create(() => 0)
    }

    get last(): GameRound | null
    {
        if (this.rounds.length >= 2)
        {
            return this.rounds[this.rounds.length - 2];
        }
        return null;
    }

    get present(): GameRound
    {
        return this.rounds[this.rounds.length - 1];
    }

    is_in_menu(): boolean 
    {
        return this.status == GameContextStatus.InMenu;
    }

    is_playing(): boolean
    {
        return [
            GameContextStatus.WaitForOpponent,
            GameContextStatus.Submitting,
            GameContextStatus.WaitForPlayer,
            GameContextStatus.Loading,
        ].indexOf(this.status) > -1;
    }

    is_waiting(): boolean
    {
        return [
            GameContextStatus.WaitForOpponent,
            GameContextStatus.WaitForPlayer
        ].indexOf(this.status) > -1;
    }

    is_in_queue(): boolean
    {
        return this.status == GameContextStatus.InQueue;
    }

    is_finished(): boolean
    {
        return [
            GameContextStatus.Victorious,
            GameContextStatus.Defeated,
            GameContextStatus.Tied
        ].indexOf(this.status) > -1;
    }

    is_not_started(): boolean
    {
        return this.status == GameContextStatus.NotStarted;
    }

    is_first_round(): boolean
    {
        return this.last == null;
    }
}

export interface IGameUiFacade
{
    context: IGameContext;
    player_name: string;
    submit_move(move: Move): void;
    new_game(): void;
    online_mode(): void;
    AI_mode(): void;
}

export class GameUiFacade implements IGameUiFacade
{
    player_name: string = "Anonymous";
    context: IGameContext = new GameContext();
    agent: IServerAgent | null = null;

    constructor()
    {
    }

    private destroy_agent()
    {
        if (this.agent)
        {
            this.agent.destroy();
        }
    }

    online_mode()
    {
        this.destroy_agent();
        this.context = new GameContext();
        //this.agent = new OnlineAgent(this.context);
    }

    AI_mode()
    {
        this.destroy_agent();
        this.context = new GameContext();
        this.agent = new LocalAgent(this.context);
    }

    submit_move(move: Move): void 
    {
        if (this.agent)
        {
            this.agent.submit_move(move);
        }
    }

    new_game(): void
    {
        if (this.agent)
        {
            this.agent.new_game(this.player_name);
        }
    }
}
