import { Board, SerializableBoard } from "./board";
import { Airforce, Artillery, Base, Bomb, Coord, Coordinate, Group, Infantry, Mine, Move, Player, Scout, Tank, Unit, UnitConstructor} from "./entity";
import { g } from "./global";
import { HashMap, HashSet } from "./language";

/* judge table decies what happens when a piece duels another */
// const DUEL_TIED = 0
const DUEL_WON = 1
const DUEL_LOST = 2
const DUEL_IMPOSSIBLE = 3
const judge_table: number[][] = [
    [3, 3, 3, 3, 3, 3, 3, 3], // 1 Base
    [0, 0, 0, 0, 0, 0, 0, 0], // 2 Bomb
    [1, 0, 1, 1, 1, 1, 1, 2], // 3 Artillery
    [1, 0, 1, 0, 2, 2, 2, 2], // 4 Scout
    [1, 0, 1, 1, 2, 2, 2, 1], // 5 Infantry
    [1, 0, 1, 1, 1, 0, 2, 2], // 6 Tank
    [1, 0, 1, 1, 1, 1, 0, 2], // 7 Airforce
    [3, 3, 3, 3, 3, 3, 3, 3]  // 8 Mine
]

//class InvalidMove extends Error { }
class Connection {
     constructor(public grid_1: Coordinate, public grid_2: Coordinate) {
     }
}

type Connectivity = [Coord, Coord]

export const units_per_group: UnitConstructor[] = [
    Scout, Artillery, Bomb, Infantry, Infantry, Infantry, Tank, Airforce, Base, Mine, Mine
]

const connectivity_road_quarter: Connectivity[] = [
    [[4,0],[4,1]],[[4,0],[5,0]],[[5,0],[5,1]],[[5,0],[6,0]],[[6,0],[6,1]],
    [[5,2],[4,1]],[[5,2],[4,2]],[[5,2],[4,3]],[[5,2],[5,1]],[[5,2],[5,3]],
    [[5,2],[6,1]],[[5,2],[6,2]],[[5,2],[6,3]]
]

const connectivity_rail_quarter: Connectivity[] = [
    [[4,1],[4,2]],[[4,2],[4,3]],[[4,3],[4,4]],[[4,3],[3,4]],
    [[5,1],[4,1]],[[5,1],[6,1]],
    [[5,3],[4,3]],[[5,3],[6,3]],[[5,3],[5,4]],
    [[6,1],[6,2]],[[6,2],[6,3]],[[6,3],[6,4]],[[6,3],[7,4]],
    [[6,4],[5,4]],[[6,4],[6,5]],[[6,5],[5,5]]
]

const starting_grids: Coordinate[] = [
    [4,0], [5, 0], [6, 0],
    [4,1], [5, 1], [6, 1],
    [4,2], [6, 2],
    [4,3], [5, 3], [6, 3]
].map(([x, y]) => new Coordinate(x, y))

export const camps: Coordinate[] = [
    new Coordinate(5,2), new Coordinate(8,5),
    new Coordinate(2,5), new Coordinate(5,8)]

export function is_camp(coord: Coordinate): boolean {
    for (let k = 0; k < camps.length; ++k) {
        if (camps[k].equals(coord)) return true
    }
    return false
}

export function get_initial_coordinates(group: Group) {
    let coords = starting_grids
    for (let i = 0; i < group; ++i) {
        coords = coords.map((c) => rotate_counter_clockwise(c))
    }
    return coords
}

export function rotate_counter_clockwise(coord: Coordinate): Coordinate {
    return new Coordinate(coord.y, -coord.x + g.grid_center * 2)
}

function create_connections(connectivity: Connectivity[], rotate_times: number): Connection[]{
    let cons: Connection[] = []

    for (let [g1, g2] of connectivity){
        let start = Coordinate.from_list(g1)
        let end = Coordinate.from_list(g2)

        for (let i = 0; i < rotate_times; ++i) {
            start = rotate_counter_clockwise(start)
            end = rotate_counter_clockwise(end)
        }
        cons.push(new Connection(start, end))
    }
    return cons
}

function create_connections_all_quadrant(connectivities: Connectivity[]): Connection[] {
    let connections: Connection[][] = []
    for (let g = 0; g < 4; ++g) {
        connections.push(create_connections(connectivities, g))
    }
    return connections.flat()
}

function get_roads(): Connection[] {
    return create_connections_all_quadrant(connectivity_road_quarter)
}

function get_rails(): Connection[] {
    return create_connections_all_quadrant(connectivity_rail_quarter)
}

export const roads = get_roads()
export const rails = get_rails()

function create_connection_map(connections: Connection[]): HashMap<Coordinate, Coordinate[]> {
    let m = new HashMap<Coordinate, Coordinate[]>()
    function connect(g1: Coordinate, g2: Coordinate) {
        let record = m.get(g1)
        if (record != undefined) {
            record.push(g2)
        } else {
            m.put(g1, [g2])
        }
    }
    for (let con of connections) {
        connect(con.grid_1, con.grid_2)
        connect(con.grid_2, con.grid_1)
    }
    return m
}

export const rail_map: HashMap<Coordinate, Coordinate[]> = create_connection_map(rails)
export const road_map: HashMap<Coordinate, Coordinate[]> = create_connection_map(roads)

export const rail_joint = function () {
    let j = new HashMap<Coordinate, Coordinate>()
    j.put(new Coordinate(4, 3), new Coordinate(4, 2))
    j.put(new Coordinate(3, 4), new Coordinate(2, 4))
    j.put(new Coordinate(6, 3), new Coordinate(6, 2))
    j.put(new Coordinate(7, 4), new Coordinate(8, 4))
    j.put(new Coordinate(4, 7), new Coordinate(4, 8))
    j.put(new Coordinate(3, 6), new Coordinate(2, 6))
    j.put(new Coordinate(6, 7), new Coordinate(6, 8))
    j.put(new Coordinate(7, 6), new Coordinate(8, 6))
    return j
}()

// function auto_reconing() {
//     let all = [
//         [3,4,5,6,7],[3,4,5,6,7],[3,4,5,6,7],
//         [2,3,4,5,6,7],[2,3,4,5,6,7],
//         [2,3,4,5,6,7,8],[2,3,4,5,6,7,8],[2,3,4,5,6,7,8],
//         [1,2,3,4,5,6,7,8], [1,2,3,4,5,6,7,8], [1,2,3,4,5,6,7,8]
//     ]
//     let count = [2,3,3,3,3,2,2,2,2,1,1,1]
    
//     function solve(piece: number): number {
//         let choices = all[piece]
//         let solutions = 0
//         for (let i = 0; i < choices.length; ++i) {
//             let piece_type = choices[i]
//             if (count[piece_type] == 0) continue
//             if (piece == all.length - 1) {
//                 ++solutions
//                 //picked.push(piece_type)
//                 //solution_records.push([...picked])
//                 //picked.pop()
//             } else {
//                 --count[piece_type]
//                 //picked.push(piece_type)
//                 solutions += solve(piece + 1)
//                 //picked.pop()
//                 ++count[piece_type]
//             }
//         }
//         return solutions
//     }
    
//     console.log(solve(0))
//     //console.log(solution_records.length)
//     //for (let i = 0; i < 20; ++i)
//         //console.log(solution_records[i])
    
// }


export class Rule
{
    static alive(board: GameBoard, group: Group): boolean {
        let alive = false
        board.unit.iterate_units((unit, coord) => {
            if (unit.group == group) {
                if (this.get_move_options(board, coord).size() > 0) {
                    alive = true
                }
            }
        })
        return alive
    }

    static proceed(board: GameBoard, move: Move): GameBoard {
        let b = board.copy()
        let attacker = b.unit.at(move.from)
        if (attacker == null) throw new Error('null piece')
        let defender = board.unit.at(move.to)

        b.unit.remove(move.from)

        let keep_attacker = false
        let keep_defender = false

        if (defender == null) {
            keep_attacker = true
        }
        else {
            let result = judge_table[attacker.type.id - 1][defender.type.id - 1]
            if (result >= DUEL_IMPOSSIBLE) {
                throw Error('impossible duel')
            }
            if (result == DUEL_WON) {
                keep_attacker = true
            } else if (result == DUEL_LOST) {
                keep_defender = true
                if (attacker.type == Scout) {
                    // todo: reveal defender
                }
            }

            if (defender.type == Base) {
                let dg = defender.group
                b.unit.iterate_units((unit, coord) => {
                    if (unit.group == dg) {
                        b.unit.remove(coord)
                    }
                })
            }
        }

        if (keep_attacker) {
            b.unit.put(move.to, attacker)
        } else if (!keep_defender) {
            b.unit.remove(move.to)
        }
        return b
    }

    static get_move_options(board: GameBoard, at: Coordinate): HashSet<Coordinate> {
        let unit = board.unit.at(at)
        let options = new HashSet<Coordinate>()
        if (unit == null) return options
        if (unit.type == Mine || unit.type == Base) return options
        let player = unit.owner

        function collect(c: Coordinate): "move" | "attack" | "occupied" {
            let piece = board.unit.at(c)
            if (piece == null) {
                options.put(c)
                return "move"
            }
            if (is_camp(c)) {
                return "occupied"
            }
            if (piece.owner == player) {
                return "occupied"
            } else {
                options.put(c)
                return "attack"
            }
        }
        
        if (road_map.has(at)) {
            for (let next of road_map.get(at)!) {
                collect(next)
            }
        }

        function collect_along_rail(from: Coordinate, to: Coordinate) {
            let status = collect(to)
            if (status == "attack" || status == "occupied") return
            let nexts = rail_map.get(to)!

            let direction = to.delta(from)
            for (let next of nexts) {
                if (options.has(next)) continue
                let new_direction = next.delta(to)

                if (direction.equals(new_direction)) {
                    // keep straight
                    collect_along_rail(to, next)
                }

                if (direction.manhattan() > 1) {
                    // already in the turn
                    let after_joint = rail_joint.get(to)
                    if (after_joint == undefined) throw Error('expect joint')
                    collect_along_rail(to, after_joint)
                }
                
                if (new_direction.manhattan() > 1) {
                    // about to go into a turn
                    let before_joint = rail_joint.get(to)
                    if (before_joint == undefined) throw Error('expect joint')
                    if (before_joint.equals(from)) {
                        // a joint can only be entered when piece is leaving
                        // another joint
                        collect_along_rail(to, next)
                    }
                }
            }
        }

        options.put(at)
        if (rail_map.has(at)) {
            for (let next of rail_map.get(at)!) {
                collect_along_rail(at, next)
            }
        }
        options.remove(at)

        return options
    }

    static validate_move(board: GameBoard, group: Group, move: Move): boolean{
        let attacker = board.unit.at(move.from)
        if (attacker == null) return false
        if (attacker.group != group) return false
        let options = this.get_move_options(board, move.from)
        return options.has(move.to)
    }

    static count_unit(board: Board<Unit>, player: Player, unit_type: UnitConstructor | null = null): number
    {
        let count = 0;
        board.iterate_units((unit: Unit, _) =>
        {
            if (unit.owner == player)
            {
                if (unit_type == null || unit.constructor == unit_type)
                {
                    count++;
                }
            }
        });
        return count;
    }

    static where(board: Board<Unit>, player: Player, unit_type: UnitConstructor): Coordinate[]
    {
        let found: Coordinate[] = [];
        board.iterate_units((unit, coord) =>
        {
            if (unit.owner == player && unit.constructor == unit_type)
            {
                found.push(coord);
            }
        });
        return found;
    }
}

export class GameBoard{
    constructor(public unit: SerializableBoard<Unit>){
    }
    copy(): GameBoard {
        return new GameBoard(this.unit.copy())
    }
}

