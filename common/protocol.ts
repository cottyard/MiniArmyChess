import { Player, Players } from "./entity"

export enum UserStatus {
    Idle,
    InGame
}

export const res_hall_full = 'hall is full'
export type HallDigest = {
    users: {[key: string]: UserStatus}
    challengers: string[]
    challenging: string | null
}
export const hall_signal_interval = 5000
export const session_signal_interval = 2500
export type SessionDigest = {
    last_update: number,
    players: Players<string>,
    time: Players<number>
}
export function find_player(names: Players<string>, name: string): Player {
    for (let p of [Player.P1, Player.P2]) {
        if (names[p] == name) return p
    }
    throw Error('player not found')
} 