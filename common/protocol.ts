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