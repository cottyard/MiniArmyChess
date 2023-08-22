import { Board, create_serializable_board_ctor } from "./board";
import { Group, Move, Unit, UnitConstructor } from "./entity";
import { ISerializable, randint } from "./language";
import { GameBoard, Rule, get_initial_coordinates, units_per_group } from "./rule";

export class InsufficientSupply extends Error { }

export enum GameStatus
{
    Ongoing,
    WonByPlayer1,
    WonByPlayer2
}

export class GameRound implements ISerializable
{
    private _status: GameStatus = GameStatus.Ongoing
    private constructor(
        readonly round_count: number,
        readonly board: GameBoard,
        readonly group_to_move: Group,
        readonly last_move: Move | null,
        )
    {
    }

    proceed(move: Move): GameRound
    {
        let next_board = Rule.proceed(this.board, move)

        let p1_alive = Rule.alive(next_board, 0) || Rule.alive(next_board, 2)
        let p2_alive = Rule.alive(next_board, 1) || Rule.alive(next_board, 3)

        if (!p1_alive || !p2_alive) {
            if (!p1_alive && !p2_alive) {
                if (this.group_to_move == 0 || this.group_to_move == 2) {
                    this._status = GameStatus.WonByPlayer1
                } else {
                    this._status = GameStatus.WonByPlayer2
                }
            } else if (p1_alive) {
                this._status = GameStatus.WonByPlayer1
            } else {
                this._status = GameStatus.WonByPlayer2
            }
        }

        let next_group = this.group_to_move
        if (this._status == GameStatus.Ongoing) {   
            for (let i = 1; i < 4; ++i) {
                let g = (this.group_to_move + i) % 4 as Group
                if (Rule.alive(next_board, g)) {
                    next_group = g
                    break
                }
            }
            if (next_group == this.group_to_move) throw Error("no living group")
        }

        return new GameRound(
            this.round_count + 1,
            next_board,
            next_group,
            move)
    }

    get status(): GameStatus
    {
        return this._status
    }

    validate_move(move: Move): boolean{
        return Rule.validate_move(this.board, this.group_to_move, move)
    }

    static set_out(board: Board<Unit>): void
    {
        let l = [...units_per_group]
        for (let group = 0; group < 4; ++group) {
            for (let i = 0; i < l.length; ++i) {
                let swap_with = randint(l.length)
                if (i != swap_with) {
                    let t = l[i]
                    l[i] = l[swap_with]
                    l[swap_with] = t
                }
            }
            let coords = get_initial_coordinates(group as Group)
            for (let i = 0; i < l.length; ++i) {
                board.put(coords[i], new l[i](group as Group))
            }
        }
    }

    static new_game(): GameRound
    {
        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor)
        let board = new board_ctor()
        this.set_out(board)
        return new GameRound(0, new GameBoard(board), 0, null)
    }

    serialize(): string {
        return JSON.stringify([
            this.round_count, 
            this.board.unit.serialize(), 
            this.last_move == null? null : this.last_move.serialize()
        ])
    }

    static deserialize(payload: string): GameRound
    {
        // let [round_count, players_supply, board_payload, 
        //      players_actions, victims] = JSON.parse(payload);

        // let board = <SerializableBoard<Unit>> create_serializable_board_ctor(
        //     UnitConstructor).deserialize(board_payload);

        // return new GameRound(
        //     round_count, 
        //     new GameBoard(board), 
        //     last_round_actions, 
        //     );
        payload
        return GameRound.new_game()
    }
}
