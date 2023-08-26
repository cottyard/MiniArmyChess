import { Request, Response, NextFunction } from 'express'
import { Players, Player, Move } from '../../common/entity'
import { GameRound, GameStatus } from '../../common/game_round'
import { HashSet, IHashable } from '../../common/language'
import { UserStatus, HallDigest, hall_signal_interval, res_hall_full } from '../../common/protocol'

type SessionId = string
type ServerGameRoundId = string
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
const server_game_round_id_generator = new IdGenerator<ServerGameRoundId>()

// class QueueItem
// {
//     constructor(public session_id: SessionId, public player_name: string)
//     {
//     }
// }

// let match_queue: QueueItem[] = []
// let session_store: {[id: SessionId]: Session} = {}
// let game_round_store: {[id: ServerGameRoundId]: ServerGameRound} = {}
// let name_store: {[name: string]: SessionId} = {}

class User {
    status: UserStatus = UserStatus.Idle
    constructor(public name: string, public last_check_in: TimeStamp) {
    }
}

let online_users: Map<string, User> = new Map()
let challenges: Map<string, string> = new Map()

function signout_user(name: string) {
    online_users.delete(name)
}

function hall_digest(): HallDigest {
    let digest: HallDigest = {}
    let now = Date.now()
    for (let name of online_users.keys()) {
        let u = online_users.get(name)!
        if (now - u.last_check_in > hall_signal_interval * 2) {
            signout_user(name)
            continue
        }
        digest[u.name] = u.status
    }
    return digest
}

const get_hall = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.name
    if (online_users.has(name)) {
        let user = online_users.get(name)!
        user.last_check_in = Date.now()
        return res.status(200).json(hall_digest())
    } else {
        let success = login(name)
        if (success) {
            return res.status(200).json(hall_digest())
        } else {
            return res.status(200).json(res_hall_full)
        }
    }
}

const send_challenge = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.name
    let other: string = req.params.other
    challenges.set(name, other)
    return res.status(200)
}

const accept_challenge = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.name
    let other: string = req.params.other

    if (challenges.get(other) == name) {
        challenges.delete(other)
        //set up session
        return res.status(200).json('todo: session id')
    } else {
        return res.status(404)
    }
}

const watch = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.name
    let other: string = req.params.other
    // todo: get other's session
    return res.status(200)
}

const MAX_USER_COUNT = 10
function login(name: string): boolean {
    if (online_users.size >= MAX_USER_COUNT) {
        return false
    } else {
        online_users.set(name, new User(name, Date.now()))
        console.log(name, 'logged in')
        return true
    }
}

// class ServerGameRound
// {
//     id: ServerGameRoundId

//     constructor(private round: GameRound = GameRound.new_game())
//     {
//         this.id = server_game_round_id_generator.gen()
//         game_round_store[this.id] = this
//     }

//     proceed(move: Move): ServerGameRound | null
//     {
//         let next_round = this.round.proceed(move)

//         if (!next_round)
//         {
//             console.log("error proceeding next round")
//             return null
//         }

//         return new ServerGameRound(next_round)
//     }

//     serialize_round(): string
//     {
//         return this.round.serialize()
//     }
// }

// class Session
// {
//     private rounds: ServerGameRound[] = [ new ServerGameRound() ]
//     private update_time: number = Date.now()

//     players_time: Players<number> = {
//         [Player.P1]: 0,
//         [Player.P2]: 0
//     }

//     constructor(public id: SessionId, public players_name: Players<string>)
//     {
//         session_store[id] = this
//     }

//     touch()
//     {
//         this.update_time = Date.now()
//     }

//     expired(): boolean
//     {
//         return Date.now() - this.update_time > 1000 * 3600
//     }

//     recycle(): void
//     {
//         for (let player of Players.both())
//         {
//             delete name_store[this.players_name[player]]
//         }

//         for (let round of this.rounds)
//         {
//             delete game_round_store[round.id]
//         }
//         delete session_store[this.id]
//     }

//     update(round: ServerGameRound, time: Players<number>)
//     {
//         this.rounds.push(round)
//         this.touch()
        
//         for (let player of Players.both())
//         {
//             this.players_time[player] += time[player]
//         }
//     }

//     current_game_round(): ServerGameRound
//     {
//         return this.rounds[this.rounds.length - 1]
//     }

//     static process_all()
//     {
//         // for (let id in session_store)
//         // {
//         //     let session = session_store[id]
//         //     let round = session.current_game_round()
//         //     if (!move_stash.all_players_moved())
//         //     {
//         //         continue
//         //     }
//         //     let next_round = round.proceed(move_stash)
//         //     if (next_round)
//         //     {
//         //         session.update(next_round, move_stash.players_time)
//         //     }
//         // }

//         for (let id in session_store)
//         {
//             let session = session_store[id]
//             if (session.expired())
//             {
//                 session.recycle()
//             }
//         }
//     }
// }

// const get_game = async (req: Request, res: Response, next: NextFunction) => {
//     let id: string = req.params.id
//     let game_round = game_round_store[id]
//     if (!game_round)
//     {
//         return res.sendStatus(404)
//     }

//     return res.status(200).json(game_round.serialize_round())
// }

// const get_session_status = async (req: Request, res: Response, next: NextFunction) => {
//     let id: string = req.params.id
//     let session = session_store[id]
//     if (!session)
//     {
//         return res.status(200).json('not started')
//     }

//     let game_round = session.current_game_round()
//     let result = {
//         latest: game_round.id,
//         players_moved: {
//             [Player.P1]: false,
//             [Player.P2]: false
//         },
//         players_name: session.players_name,
//         players_time: {...session.players_time}
//     }

//     return res.status(200).json(result)
// }

// const submit_move = async (req: Request, res: Response, next: NextFunction) => {
//     let id: string = req.params.id
//     let msec: number = parseInt(<string>req.query.consumed)
    
//     //console.log("Received move ", player_move.serialize())
    
//     Session.process_all()

//     return res.status(200).json('done')
// }

// const join_new_session = async (req: Request, res: Response, next: NextFunction) => {
//     let name: string = req.params.name

//     if (name in name_store)
//     {
//         return res.status(200).json(name_store[name])
//     }

//     if (match_queue.length > 0)
//     {
//         let item = match_queue.pop()!

//         if (item.player_name == name)
//         {
//             match_queue.push(item)
//             return res.sendStatus(400)
//         }

//         new Session(item.session_id, {
//             [Player.P1]: item.player_name,
//             [Player.P2]: name
//         })
        
//         name_store[name] = item.session_id
//         return res.status(200).json(item.session_id)
//     }
//     else
//     {
//         let session_id = session_id_generator.gen()
//         match_queue.push(new QueueItem(session_id, name))
//         name_store[name] = session_id
//         return res.status(200).json(session_id)
//     }
// }

export default {get_hall, send_challenge, accept_challenge, watch}//{ get_game, get_session_status, submit_move, join_new_session }