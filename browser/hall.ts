import { Net } from "./net"

import { HallDigest, SessionId, hall_signal_interval, res_hall_full } from '../common/protocol'
import { event_box } from "./ui/ui"
import { GameUiFacade } from "./game_context"

export enum HallStatus {
    LoggedOut,
    LoggedIn,
    Full
}

export class Hall {
    info: HallDigest | null = null
    status: HallStatus = HallStatus.LoggedOut
    session: SessionId | null = null
    private query_handle: NodeJS.Timeout

    constructor(public username: string, public game: GameUiFacade) {
        this.query_handle = setInterval(this.query_hall.bind(this), hall_signal_interval)
        this.query_hall()
    }

    query_hall() {
        Net.query_hall(this.username, (response) => {
            let res = JSON.parse(response)
            if (res == res_hall_full) {
                this.status = HallStatus.Full
                event_box.emit("refresh hall", null)
                return
            }
            this.info = res
            this.status = HallStatus.LoggedIn
            if (this.info && this.info.session != this.session) {
                this.session = this.info.session
                if (this.session) {
                    console.log('starting session', this.session)
                    this.game.online_mode(this.session, this.username)
                }
            }
            event_box.emit("refresh hall", null)
        }, () => {
            this.status = HallStatus.LoggedOut
            event_box.emit("refresh hall", null)
        })
    }
    destroy() {
        clearInterval(this.query_handle)
    }
}
