import { Player, Players} from "./entity"

export type SessionId = string

export const res_hall_full = 'hall is full'
export type HallDigest = {
    users: {[key: string]: SessionId | null}
    challengers: string[]
    challenging: string | null
    session: string | null
}
export const hall_signal_interval = 5000
export const session_signal_interval = 2500
export type SessionDigest = {
    opponent: string,
    as: Player,
    last_update: number,
    time: Players<number>
}
export function find_player(names: Players<string>, name: string): Player {
    for (let p of [Player.P1, Player.P2]) {
        if (names[p] == name) return p
    }
    throw Error('player not found')
}