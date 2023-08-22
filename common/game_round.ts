import { Board, create_serializable_board_ctor } from "./board";
import { Group, Move, Unit, UnitConstructor } from "./entity";
import { ISerializable, randint } from "./language";
import { GameBoard, Rule, get_initial_coordinates, units_per_group } from "./rule";

export class InsufficientSupply extends Error { }

export enum GameStatus
{
    Ongoing,
    WonByPlayer1,
    WonByPlayer2,
    Tied
}

export class GameRound implements ISerializable
{
    private constructor(
        readonly round_count: number,
        readonly board: GameBoard,
        readonly group_to_move: Group,
        readonly last_move: Move | null,
        )
    {
    }

    next_group(): Group {
        return (this.group_to_move + 1) % 4 as Group
    }

    proceed(move: Move): GameRound
    {
        let next_board = Rule.proceed(this.board, move);

        return new GameRound(
            this.round_count + 1,
            next_board,
            this.next_group(),
            move);
    }

    status(): GameStatus
    {
        // let king_1 = Rule.count_unit(this.board.unit, Player.P1, King);
        // let king_2 = Rule.count_unit(this.board.unit, Player.P2, King);
        // if (king_1 && king_2)
        // {
        //     return GameStatus.Ongoing;
        // }
        // else if (king_1)
        // {
        //     return GameStatus.WonByPlayer1;
        // }
        // else if (king_2)
        // {
        //     return GameStatus.WonByPlayer2;
        // }
        // else
        // {
        //     
        // }
        return GameStatus.Tied
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
