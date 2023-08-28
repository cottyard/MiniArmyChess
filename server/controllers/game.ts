import { Request, Response, NextFunction } from 'express'
import { Players, Player, Move, which_player } from '../../common/entity'
import { GameRound, GameStatus, PlayerLayout } from '../../common/game_round'
import { HashSet, IHashable } from '../../common/language'
import { UserStatus, HallDigest, hall_signal_interval, res_hall_full, SessionDigest, find_player, session_signal_interval } from '../../common/protocol'


type SessionId = string
type TimeStamp = number
class IdGenerator<T>
{
    private next_id = 1
    gen(): T
    {
        return <T><unknown>(this.next_id++).toString()
    }
}

const session_id_generator = new IdGenerator<SessionId>()

class UserSession {
    last_access: TimeStamp
    constructor(public session: SessionId) {
        this.last_access = Date.now()
    }
}

let user_heartbeat: Map<string, number> = new Map()
let challenges: Map<string, [string, PlayerLayout]> = new Map()
let sessions: Map<SessionId, Session> = new Map()
let user_session: Map<string, UserSession> = new Map()

function signout_user(name: string) {
    user_heartbeat.delete(name)
    challenges.delete(name)
    user_session.delete(name)
}

function hall_digest(name: string): HallDigest {
    let challengers = []
    for (let challenger of challenges.keys()) {
        if (challenges.has(challenger)) {
            let [challenged, _] = challenges.get(challenger)!
            if (challenged == name) {
                challengers.push(challenger)
            }
        }
    }
    let digest: HallDigest = {
        users: {},
        challengers: challengers,
        challenging: challenges.has(name) ? challenges.get(name)![0] : null
    }
    let now = Date.now()
    for (let user of user_heartbeat.keys()) {
        let last_check_in = user_heartbeat.get(user)!
        if (now - last_check_in > hall_signal_interval * 2) {
            signout_user(user)
            continue
        }
        digest.users[user] = user_session.has(user) ? UserStatus.InGame : UserStatus.Idle
    }
    return digest
}

const get_hall = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.user
    if (user_heartbeat.has(name)) {
        user_heartbeat.set(name, Date.now())
        return res.status(200).json(hall_digest(name))
    } else {
        let success = login(name)
        if (success) {
            return res.status(200).json(hall_digest(name))
        } else {
            return res.status(200).json(res_hall_full)
        }
    }
}

export const send_challenge = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.user
    let other: string = <string>req.query.user
    let layout: PlayerLayout = PlayerLayout.deserialize(JSON.parse(req.body))
    console.log('challenge', other)
    if (name != other) {
        challenges.set(name, [other, layout])
        return res.sendStatus(200)
    } else {
        return res.sendStatus(400)
    }
}

const accept_challenge = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.user
    let other: string = <string>req.query.user
    let layout: PlayerLayout = PlayerLayout.deserialize(JSON.parse(req.body))
    console.log('accept', other)

    if (challenges.has(other)) {
        let [challenged, other_layout] = challenges.get(other)!
        if (challenged == name) {
            let session_id = session_id_generator.gen()
            sessions.set(session_id, new Session(session_id, {
                [Player.P1]: other,
                [Player.P2]: name
            }, [other_layout, layout]))
            challenges.delete(other)
            return res.status(200).json(session_id)
        }
    } 
    return res.sendStatus(404)
}

const watch = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.user
    let other: string = <string>req.query.user
    console.log('watch', other)

    if (user_session.has(other)) {
        let s = user_session.get(other)!
        if (s) {
            return res.status(200).json(s.session)
        }
    }
    return res.sendStatus(404)
}

const MAX_USER_COUNT = 10
function login(name: string): boolean {
    if (user_heartbeat.size >= MAX_USER_COUNT) {
        return false
    } else {
        user_heartbeat.set(name, Date.now())
        console.log(name, 'logged in')
        return true
    }
}

class Session{
    round: GameRound
    timestamp: number = Date.now()
    players_time: Players<number> = {
        [Player.P1]: 0,
        [Player.P2]: 0
    }
    constructor(public id: SessionId, public players_name: Players<string>, public layouts: [PlayerLayout, PlayerLayout]){
        this.round = GameRound.new_game_by_layout(...layouts)
        sessions.set(id, this)
    }
    touch(){
        this.timestamp = Date.now()
    }
    expired(): boolean{
        return Date.now() - this.timestamp > 1000 * 600
    }
    recycle(): void{
        sessions.delete(this.id)
    }
    update(player: Player, move: Move, consumed_time: number) {
        if (which_player(this.round.group_to_move) != player) return false
        this.round = this.round.proceed(move)
        this.players_time[player] += consumed_time
        this.touch()
        return true
    }
}

const get_session = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id
    let name: string = <string>req.query.user
    let session = sessions.get(id)
    if (!session) {
        return res.sendStatus(404)
    }

    user_session.set(name, new UserSession(id))
    
    let now = Date.now()
    for (let name of user_session.keys()) {
        let s = user_session.get(name)!
        if (now - s.last_access > session_signal_interval * 2) {
            user_session.delete(name)
        }
    }

    let digest: SessionDigest = {
        last_update: session.timestamp,
        players: session.players_name,
        time: {...session.players_time}
    }
    return res.status(200).json(digest)
}

const get_game = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id
    let session = sessions.get(id)
    if (!session) {
        return res.sendStatus(404)
    }
    return res.status(200).json(session.round.serialize())
}

const submit_move = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id
    let name: string = <string>req.query.user
    let time: number = parseInt(<string>req.query.time)
    let move: Move = Move.deserialize(JSON.parse(req.body))
    console.log('received move', req.body)

    let session = sessions.get(id)
    if (!session) return res.sendStatus(404)
    session.update(find_player(session.players_name, name), move, time)
    return res.sendStatus(200)
}

export default {get_hall, send_challenge, accept_challenge, watch, get_game, get_session, submit_move }