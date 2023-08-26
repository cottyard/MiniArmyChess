import { Net } from "./net"

import { HallDigest, hall_signal_interval, res_hall_full } from '../common/protocol'
import { event_box } from "./ui/ui"

export enum HallStatus {
    LoggedOut,
    LoggedIn,
    Full
}

export class Hall {
    info: HallDigest | null = null
    status: HallStatus = HallStatus.LoggedOut

    private query_handle: NodeJS.Timeout

    constructor(public username: string) {
        this.query_handle = setInterval(this.query_hall.bind(this), hall_signal_interval)
        this.query_hall()
    }

    query_hall() {
        Net.query_hall(this.username, (response) => {
            if (response == res_hall_full) {
                this.status = HallStatus.Full
                return
            }
            this.info = JSON.parse(response)
            this.status = HallStatus.LoggedIn
            event_box.emit("refresh hall", null)
        })
    }
    destroy() {
        clearInterval(this.query_handle)
    }
}
