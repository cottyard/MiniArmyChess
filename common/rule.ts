import { Board, SerializableBoard } from "./board";
import { Airforce, Artillery, Base, Bomb, Coord, Coordinate, CoordinateDelta, Group, Infantry, Mine, Move, Player, Scout, Tank, Unit, UnitConstructor} from "./entity";
import { g } from "./global";
import { HashMap, HashSet } from "./language";

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

export const RailJoint = function () {
    let j = new HashMap<Coordinate, [CoordinateDelta, CoordinateDelta]>()
    j.put(new Coordinate(4, 3), [new CoordinateDelta(1, 0), new CoordinateDelta(0, -1)])
    j.put(new Coordinate(3, 4), [new CoordinateDelta(0, 1), new CoordinateDelta(-1, 0)])
    j.put(new Coordinate(6, 3), [new CoordinateDelta(-1, 0), new CoordinateDelta(0, -1)])
    j.put(new Coordinate(7, 4), [new CoordinateDelta(0, 1), new CoordinateDelta(1, 0)])
    j.put(new Coordinate(4, 7), [new CoordinateDelta(1, 0), new CoordinateDelta(0, 1)])
    j.put(new Coordinate(3, 6), [new CoordinateDelta(0, -1), new CoordinateDelta(-1, 0)])
    j.put(new Coordinate(6, 7), [new CoordinateDelta(-1, 0), new CoordinateDelta(0, 1)])
    j.put(new Coordinate(7, 6), [new CoordinateDelta(0, -1), new CoordinateDelta(1, 0)])
    return j
}()

export class Rule
{
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
            
            if (defender.type == Base) {
                let dg = defender.group
                b.unit.iterate_units((unit, coord) => {
                    if (unit.group == dg) {
                        b.unit.remove(coord)
                    }
                })
            } else if (attacker.type == Bomb || defender.type == Bomb 
                    || attacker.type == defender.type) {
                // no action needed here
            } else if (attacker.type == Scout) {
                // todo: reveal defender
                keep_defender = true
            } else if (defender.type == Mine) {
                if (attacker.type == Infantry) {
                    keep_attacker = true
                } else {
                    keep_defender = true
                }
            } else if (attacker.type == Artillery) {
                keep_attacker = true
            } else if (attacker.type == Airforce) {
                keep_attacker = true
            } else if (attacker.type == Tank) {
                keep_attacker = defender.type != Airforce
            } else if (attacker.type == Infantry) {
                if (defender.type == Airforce || defender.type == Tank) {
                    keep_defender = true
                } else {
                    keep_attacker = true
                }
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

        function collect_along_rail(start: Coordinate, direction: CoordinateDelta) {
            if (!rail_map.has(start)) return
            let status = collect(start)
            if (status == "attack" || status == "occupied") return
            let expected = start.add(direction)
            if (expected == undefined) return
            let cons = rail_map.get(start)!
            for (let c of cons) {
                if (options.has(c)) continue
                if (c.equals(expected)) collect_along_rail(c, direction)
                if (RailJoint.has(c)) {
                    let [from_direcion, to_direction] = RailJoint.get(c)!
                    if (from_direcion.equals(direction)) collect_along_rail(c, to_direction)
                }
            }
        }

        if (rail_map.has(at)) {
            for (let next of rail_map.get(at)!) {
                let direction = next.delta(at)
                collect_along_rail(next, direction)
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

