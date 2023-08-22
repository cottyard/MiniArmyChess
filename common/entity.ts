import { g } from "./global"
import { IHashable, ISerializable, ICopyable, IDeserializable } from "./language"

class InvalidParameter extends Error { }

export type Coord = [number, number]
export class Coordinate implements IHashable, ISerializable, ICopyable<Coordinate>
{
    constructor(public x: number, public y: number){
        if (!Coordinate.is_valid(x, y)){
            throw new InvalidParameter("Coordinate")
        }
    }

    static from_list(coord: Coord): Coordinate {
        return new Coordinate(coord[0], coord[1])
    }

    equals(other: Coordinate): boolean{
        return this.x == other.x && this.y == other.y
    }

    add(delta: CoordinateDelta): Coordinate | undefined{
        if (!Coordinate.is_valid(this.x + delta.dx, this.y + delta.dy)){
            return undefined
        }
        return new Coordinate(this.x + delta.dx, this.y + delta.dy)
    }

    delta(other: Coordinate): CoordinateDelta {
        return new CoordinateDelta(this.x - other.x, this.y - other.y)
    }

    copy(): Coordinate{
        return new Coordinate(this.x, this.y)
    }

    hash(): string{
        return `Crd(${ this.x },${ this.y })`
    }

    serialize(): string{
        return `${ this.x }${ this.y }`
    }

    static deserialize(payload: string): Coordinate{
        return new Coordinate(parseInt(payload[0]), parseInt(payload[1]))
    }

    static is_valid(x: number, y: number): boolean{
        return 0 <= x && x < g.grid_count && 0 <= y && y < g.grid_count
            && ((x >= 4 && x < 7) || (y >= 4 && y < 7))
    }

    as_list(): Coord {
        return [this.x, this.y]
    }
}

export class CoordinateDelta {
    equals(other: CoordinateDelta): boolean {
        return this.dx == other.dx && this.dy == other.dy
    }
    manhattan(): number {
        return Math.abs(this.dx) + Math.abs(this.dy)
    }
    constructor(public dx: number, public dy: number) {
    }
}

export enum Player
{
    P1 = 1,
    P2 = 2
}

export type Group = 0 | 1 | 2 | 3

export type Players<T> =
    {
        [Player.P1]: T,
        [Player.P2]: T,
    }

export module Players
{  
    export function* both()
    {
        yield Player.P1
        yield Player.P2
    }

    export function* values<T>(players: Players<T>)
    {
        yield players[Player.P1]
        yield players[Player.P2]
    }

    export function create<T>(ctor: (p: Player) => T): Players<T>
    {
        return {
            [Player.P1]: ctor(Player.P1),
            [Player.P2]: ctor(Player.P2)
        }
    }

    export function copy<T extends ICopyable<T>>(players: Players<T>): Players<T>
    {
        return {
            [Player.P1]: players[Player.P1].copy(),
            [Player.P2]: players[Player.P2].copy()
        }
    }
}

export function opponent(player: Player)
{
    return player == Player.P1 ? Player.P2 : Player.P1
}

export function deserialize_player(payload: string): Player
{
    return <Player> Player[<keyof typeof Player>('P' + payload)]
}

export function serialize_player(player: Player)
{
    return JSON.stringify(player)
}

export class Move implements ISerializable, ICopyable<Move>, IHashable
{
    constructor(public from: Coordinate, public to: Coordinate)
    {
    }

    equals(other: Move): boolean
    {
        return this.from.equals(other.from) && this.to.equals(other.to)
    }

    hash(): string
    {
        return `Move(${ this.from.hash() },${ this.to.hash() })`
    }

    serialize(): string
    {
        return this.from.serialize() + this.to.serialize()
    }

    static deserialize(payload: string)
    {
        return new Move(Coordinate.deserialize(payload.slice(0, 2)), Coordinate.deserialize(payload.slice(2, 4)))
    }

    copy(): Move
    {
        return new Move(this.from.copy(), this.to.copy())
    }
}

export enum ActionType
{
    Upgrade = 1,
    Defend = 2,
    Move = 3,
    Attack = 4
}

export abstract class Unit implements ISerializable, ICopyable<Unit>{
    constructor(public group: Group){
    }

    get owner(): Player {
        if (this.group % 2 == 0) return Player.P1
        else return Player.P2
    }

    serialize(): string{
        return JSON.stringify([this.type.name, this.group])
    }

    copy(): Unit{
        let ctor = <UnitConstructor> this.constructor
        let u = new ctor(this.group)
        return u
    }

    get type(): UnitConstructor{
        return <UnitConstructor> this.constructor
    }
}

export interface UnitConstructor extends IDeserializable<Unit>{
    new(group: Group): Unit
    deserialize(payload: string): Unit
    readonly id: number
    discriminator: string
}

export const UnitConstructor: UnitConstructor = class _ extends Unit{
    static readonly id = 0
    static discriminator = ''

    static deserialize(payload: string): Unit
    {
        let display: string, owner: string
        [display, owner] = <[string, string, string]> JSON.parse(payload)

        let type = unit_type_by_name.get(display)
        if (!type)
        {
            throw new Error('Unit.deserialize: no constructor')
        }
        let unit = new type(deserialize_player(owner))
        return unit
    }
}

export class Scout extends UnitConstructor{
    static readonly id = 1
}

export class Artillery extends UnitConstructor{
    static readonly id = 2
}

export class Bomb extends UnitConstructor{
    static readonly id = 3
}

export class Infantry extends UnitConstructor{
    static readonly id = 4
}

export class Tank extends UnitConstructor{
    static readonly id = 5
}

export class Airforce extends UnitConstructor{
    static readonly id = 6
}

export class Base extends UnitConstructor{
    static readonly id = 7
}

export class Mine extends UnitConstructor{
    static readonly id = 8
}

export const all_unit_types: UnitConstructor[] = [
    Scout, Artillery, Bomb, Infantry, Tank, Airforce, Base, Mine
]

const unit_type_by_name = new Map<string, UnitConstructor>()
