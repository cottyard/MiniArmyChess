import { Board, create_board } from "./board";
import { Group, Move, Player, Unit, UnitConstructor, all_unit_types, which_groups } from "./entity";
import { ISerializable, randint } from "./language";
import { GameBoard, Rule, starting_coordinates_by_group, unit_count_by_type, unit_count_per_group } from "./rule";

export class InsufficientSupply extends Error { }

export enum GameStatus
{
    Ongoing,
    WonByPlayer1,
    WonByPlayer2
}

export class GroupLayout {
    constructor(public unit_type_ids: number[] = []) {
        if (unit_type_ids.length == 0) {
            this.unit_type_ids = every_possible_layout[randint(every_possible_layout.length)]
        } else if (unit_type_ids.length != unit_count_per_group) {
            throw Error("wrong number of units")
        }
    }
}

export class PlayerLayout {
    constructor(public player: Player, public layout: [GroupLayout, GroupLayout]) {
    }
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
        if (!Rule.validate_move(this.board, this.group_to_move, move)) throw Error("invalid move")
        let next_board = Rule.proceed(this.board, move)

        let p1_alive = Rule.alive(next_board, which_groups[Player.P1][0]) 
                    || Rule.alive(next_board, which_groups[Player.P1][1])
        let p2_alive = Rule.alive(next_board, which_groups[Player.P2][0]) 
                    || Rule.alive(next_board, which_groups[Player.P2][1])

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
                if (Rule.has_valid_move(next_board, g)) {
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

    modify_layout(move: Move) {
        //todo: verify layout
        let u = this.board.units.at(move.to)
        this.board.units.put(move.to, this.board.units.remove(move.from))
        this.board.units.put(move.from, u)
    }

    get status(): GameStatus
    {
        return this._status
    }

    validate_move(move: Move): boolean{
        return Rule.validate_move(this.board, this.group_to_move, move)
    }

    static set_out(board: Board<Unit>, layout: PlayerLayout): void
    {
        for (let g of [0, 1]) {
            let group = which_groups[layout.player][g]
            let unit_type_ids = layout.layout[g].unit_type_ids
            let coords = starting_coordinates_by_group(group as Group)
            for (let i = 0; i < unit_type_ids.length; ++i) {
                let unit = new all_unit_types[unit_type_ids[i] - 1](group as Group)
                unit.lock_down(layout_allowed_types[i])
                board.put(coords[i], unit)
            }
        }
    }

    static new_game_by_layout(p1: PlayerLayout, p2: PlayerLayout | undefined = undefined): GameRound {
        let board = create_board<Unit, UnitConstructor>(UnitConstructor)
        this.set_out(board, p1)
        if (p2) this.set_out(board, p2)
        return new GameRound(0, new GameBoard(board), 0, null)
    }

    serialize(): string {
        return JSON.stringify([
            this.round_count, 
            this.board.units.serialize(), 
            this.last_move == null? null : this.last_move.serialize()
        ])
    }

    // static deserialize(payload: string): GameRound
    // {
    //     // let [round_count, players_supply, board_payload, 
    //     //      players_actions, victims] = JSON.parse(payload);

    //     // let board = <SerializableBoard<Unit>> create_serializable_board_ctor(
    //     //     UnitConstructor).deserialize(board_payload);

    //     // return new GameRound(
    //     //     round_count, 
    //     //     new GameBoard(board), 
    //     //     last_round_actions, 
    //     //     );
    //     return GameRound.new_game_by_layout()
    // }
}

const fst_row_types = [3,4,5,6,7]
const snd_row_types = [2,3,4,5,6,7]
const thd_row_types = [2,3,4,5,6,7,8]
const lst_row_types = [1,2,3,4,5,6,7,8]
const layout_allowed_types = [
    fst_row_types,fst_row_types,fst_row_types,
    snd_row_types,snd_row_types,
    thd_row_types,thd_row_types,thd_row_types,
    lst_row_types,lst_row_types,lst_row_types
]

const every_possible_layout: number[][] = (function () {
    let unit_count = [...unit_count_by_type]
    let picked: number[] = []
    let layouts: number[][] = []
    function solve(unit: number): number {
        let choices = layout_allowed_types[unit]
        let solution_count = 0
        for (let i = 0; i < choices.length; ++i) {
            let unit_type = choices[i]
            if (unit_count[unit_type - 1] == 0) continue
            if (unit == layout_allowed_types.length - 1) {
                ++solution_count
                picked.push(unit_type)
                layouts.push([...picked])
                picked.pop()
            } else {
                --unit_count[unit_type - 1]
                picked.push(unit_type)
                solution_count += solve(unit + 1)
                picked.pop()
                ++unit_count[unit_type - 1]
            }
        }
        return solution_count
    }
    solve(0)
    return layouts
})()