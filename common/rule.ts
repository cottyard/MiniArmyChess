import { Board, SerializableBoard } from "./board";
import { Tank, Base, Coord, Coordinate, Group, Mine, Move, Player, Scout, Unit, UnitConstructor, all_unit_types} from "./entity";
import { g } from "./global";
import { HashMap, HashSet } from "./language";

/* judge table decies what happens when a piece duels another */

enum JudgeCall {
    TIED = 0,
    WON = 1,
    LOST = 2,
    INVALID = 3
}

const judge_table: number[][] = [
    [3, 3, 3, 3, 3, 3, 3, 3], // 1 Base
    [0, 0, 0, 0, 0, 0, 0, 0], // 2 Bomb
    [1, 0, 1, 1, 1, 1, 1, 2], // 3 Artillery
    [1, 0, 1, 0, 2, 2, 2, 2], // 4 Scout
    [1, 0, 1, 1, 0, 2, 2, 1], // 5 Infantry
    [1, 0, 1, 1, 1, 0, 2, 2], // 6 Armored
    [1, 0, 1, 1, 1, 1, 0, 2], // 7 Tank
    [3, 3, 3, 3, 3, 3, 3, 3]  // 8 Mine
]

function judge(attacker: Unit, defender: Unit): JudgeCall {
    return judge_table[attacker.type.id - 1][defender.type.id - 1]
}

//class InvalidMove extends Error { }
class Connection {
     constructor(public grid_1: Coordinate, public grid_2: Coordinate) {
     }
}

type Connectivity = [Coord, Coord]

export const unit_count_by_type = [1,1,1,1,3,1,1,2]

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

const starting_coordinates: Coordinate[] = [
    [4,3], [5, 3], [6, 3],
    [4,2], [6, 2],
    [4,1], [5, 1], [6, 1],
    [4,0], [5, 0], [6, 0]
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

export function starting_coordinates_by_group(group: Group) {
    let coords = starting_coordinates
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

function find_unit(board: GameBoard, group: Group, type: UnitConstructor): Unit | null {
    let found = null
    board.unit.iterate_units((unit, _) => {
        if (unit.group == group && unit.type.id == type.id) {
            found = unit
        }
    })
    return found
}

export class Rule
{
    static alive(board: GameBoard, group: Group): boolean {
        let alive = false
        board.unit.iterate_units((unit, coord) => {
            if (unit.group == group) {
                // todo: fix - add choke logic
                if (this.get_move_options(board, coord).size() > 0) {
                    alive = true
                }
            }
        })
        return alive
    }

    static update_observation_on_combat(board: GameBoard, attacker: Unit, defender: Unit, call: JudgeCall): void {
        let possible_attackers = []
        for (let attacker_type = 1; attacker_type <= all_unit_types.length; ++attacker_type) {
            if (judge_table[attacker_type - 1][defender.type.id - 1] == call) {
                possible_attackers.push(attacker_type)
            }
        }
        attacker.lock_on(possible_attackers)

        let possible_defenders = []
        for (let defender_type = 1; defender_type <= all_unit_types.length; ++defender_type) {
            if (judge_table[attacker.type.id - 1][defender_type - 1] == call) {
                possible_defenders.push(defender_type)
            }
        }
        defender.lock_on(possible_defenders)

        if (attacker.type == Scout && call == JudgeCall.LOST) {
            defender.reveal()
        }
        if (attacker.type == Tank && call != JudgeCall.WON) {
            this.reveal_base(board, attacker.group)
        }
        if (defender.type == Tank && call != JudgeCall.LOST) {
            this.reveal_base(board, defender.group)
        }
    }

    static reveal_base(board: GameBoard, group: Group): void {
        let unit = find_unit(board, group, Base)
        if (unit == null) throw Error("expect Base")
        unit.reveal()
    }

    static proceed(_board: GameBoard, move: Move): GameBoard {
        let board = _board.copy()
        let attacker = board.unit.at(move.from)
        if (attacker == null) throw new Error('null piece')

        let normal_moves = this.get_move_options(board, move.from, false)
        if (!normal_moves.has(move.to)) {
            if (attacker.type != Scout) throw Error('expect scout')
            attacker.reveal()
        } else {
            attacker.rule_out(Mine.id)
            attacker.rule_out(Base.id)
        }

        let defender = board.unit.at(move.to)

        board.unit.remove(move.from)

        let keep_attacker = false
        let keep_defender = false

        if (defender == null) {
            keep_attacker = true
        }
        else {
            let call = judge(attacker, defender)
            if (call >= JudgeCall.INVALID) {
                throw Error('impossible duel')
            }
            if (call == JudgeCall.WON) {
                keep_attacker = true
            } else if (call == JudgeCall.LOST) {
                keep_defender = true
            }

            this.update_observation_on_combat(board, attacker, defender, call)

            if (defender.type == Base) {
                let dg = defender.group
                board.unit.iterate_units((unit, coord) => {
                    if (unit.group == dg) {
                        board.unit.remove(coord)
                    }
                })
            }
        }

        if (keep_attacker) {
            board.unit.put(move.to, attacker)
        } else if (!keep_defender) {
            board.unit.remove(move.to)
        }
        return board
    }

    static get_move_options(
            board: GameBoard, at: Coordinate, enable_scout: boolean = true): HashSet<Coordinate> {
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

        function collect_as_long_as_rail(from: Coordinate) {
            let status = collect(from)
            if (status == "attack" || status == "occupied") return
            let nexts = rail_map.get(from)!
            for (let next of nexts) {
                if (options.has(next)) continue
                collect_as_long_as_rail(next)
            }
        }

        if (rail_map.has(at)) {
            for (let next of rail_map.get(at)!) {
                if (enable_scout && unit.type == Scout) {
                    collect_as_long_as_rail(next)
                } else {
                    collect_along_rail(at, next)
                }
            }
        }
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

