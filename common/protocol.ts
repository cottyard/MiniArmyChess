export enum UserStatus {
    Idle,
    InGame
}

export const res_hall_full = 'hall is full'
export type HallDigest = {[key: string]: UserStatus}
export const hall_signal_interval = 5000