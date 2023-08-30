import { g } from '../../common/global'
import { SessionId } from '../../common/protocol'
import { GameUiFacade } from '../game_context'
import { HallStatus } from '../hall'
import { DomHelper, IComponent } from './dom_helper'

function hall_status_indicator(status: string): HTMLElement {
    let div = DomHelper.create_div({
        'border-top': '1px dashed black',
        'border-bottom': '1px dashed black',
    })
    div.appendChild(DomHelper.create_text(
        status, {
            display: 'flex',
            flexDirection: 'row',
            'font-weight': 'bold',
            height: '30px',
            margin: '5px',
            flex: 1,
            'background-color': g.styles.STYLE_GREY,
            justifyContent: 'center',
            alignItems: 'center'
        })
    )
    return div
}

export class HallPanel implements IComponent
{
    constructor(public dom_element: HTMLDivElement, public game: GameUiFacade)
    {
    }

    render(){
        this.dom_element.innerHTML = ""
        let game = this.game
        if (game.hall != null) {
            let div = DomHelper.create_div({
                display: "flex",
                flexDirection: "row",
                margin: "5px",
                height: '30px',
            })
            div.appendChild(DomHelper.create_text('Welcome,', {}))
            div.appendChild(DomHelper.create_text(
                game.hall.username, {
                    'font-weight': 'bold',
                    'padding-left': '3px',
                    'padding-right': '3px'
                }))
            div.appendChild(DomHelper.create_text('!', {}))
            this.dom_element.appendChild(div)

            if (game.hall.status == HallStatus.Full) {
                this.dom_element.appendChild(hall_status_indicator("hall is full"))
            } else if (game.hall.status == HallStatus.LoggedOut) {
                this.dom_element.appendChild(hall_status_indicator("offline"))
            } else {
                this.dom_element.appendChild(hall_status_indicator("online"))
                if (game.hall.info) {
                    for (let name in game.hall.info.users) {
                        this.dom_element.appendChild(
                            this.create_item(
                                game.hall.username,
                                game.current_session(),
                                name, game.hall.info.users[name],
                                game.hall.info.challengers.find((n) => n == name) != undefined,
                                game.hall.info.challenging == name))
                    }
                }
            }
        } else {
            let div = DomHelper.create_div({
                display: "flex",
                flexDirection: "row",
                margin: "5px",
                padding: "5px",
                boxSizing: "border-box",
                height: '40px',
                'background-color': g.styles.STYLE_GREY
            })
            let btn_div = DomHelper.create_div({
                display: "flex",
                flex: 1,
                flexDirection: "row-reverse",
            })

            let name = DomHelper.create_textarea()
            name.textContent = ''
            name.onfocus = () => { name.select() }
            name.autofocus = true
            name.style.width = "80px"
            name.style.resize = "none"

            function try_login() {
                let v = name.value.trim()
                if (v) game.initialize_hall(v)
            }
            name.onkeyup = (event) => {
                if (event.key == 'Enter') try_login()
                login.disabled = name.value.trim().length == 0
            }

            let login = DomHelper.create_button()
            login.innerText = "Login"
            login.disabled = true
            login.onclick = try_login
            div.appendChild(name)
            div.appendChild(btn_div)
            btn_div.appendChild(login)
            this.dom_element.appendChild(div)
        }
    }

    create_item(my_name: string, my_session: SessionId | undefined, 
                name: string, session: SessionId | null, 
                is_challenger: boolean, challenging: boolean): HTMLElement {
        let status_info
        if (session == null) {
            status_info = "Idle"
        } else {
            status_info = "Playing"
        }
        let div = DomHelper.create_div({
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            margin: "3px",
            padding: "1px",
            boxSizing: "border-box",
            height: '30px',
        })
        div.appendChild(DomHelper.create_text(name, {
            display: 'flex',
            flex: 1,
            fontWeight: 'bold',
        }))
        let div2 = DomHelper.create_div({
            display: 'flex',
            flex: 2
        })
        div2.appendChild(DomHelper.create_text(status_info, {
            backgroundColor: g.styles.STYLE_GREEN_LIGHT,
            borderRadius: '3px',
            padding: '2px',
            fontWeight: 'bold'}))
   
        let action = DomHelper.create_button({display: 'flex', alignSelf: 'center', flexDirection: 'row-reverse'})
        action.innerText = ''

        if (my_session) {
            if (my_name == name) {
                action.innerText = "Leave"
                action.onclick = () => {
                    this.game.layout_mode()
                    this.render()
                }
            } else if (session == my_session) {
                action.innerText = 'Playing'
                action.disabled = true
            } 
        } else if (!my_session && my_name != name) {
            if (is_challenger) {
                action.innerText = "Accept"
                action.onclick = () => {
                    action.innerText = "Accepting"
                    action.disabled = true
                    this.game.accept_challenge(name)
                }
            } else {
                if (session == null) {
                    if (challenging) {
                        action.innerText = "Challenging"
                        action.disabled = true
                    } else {
                        action.innerText = "Challenge"
                        action.onclick = () => {
                            action.innerText = "Challenging"
                            action.disabled = true
                            this.game.send_challenge(name)
                        }
                    }
                } else {
                    action.innerText = "Watch"
                    action.onclick = () => {
                        action.innerText = 'Watching'
                        action.disabled = true
                        this.game.online_mode(session, name)
                    }
                }
            }
        }
        
        let div3 = DomHelper.create_div({
            display: 'flex',
            flex: 1,
            flexDirection: 'row-reverse',
        })
        if (action.innerText) {
            div3.appendChild(action)
        }
        div2.appendChild(div3)
        div.appendChild(div2)
        return div
    }

    // render_player(index: number): HTMLElement
    // {
    //     const div = create_div()
    //     div.appendChild(DomHelper.create_text(
    //         "anonymous",{
    //             color: "black",
    //             'font-weight': 'bold',
    //             padding: "10px"
    //         }
    //     ))

    //     div.appendChild(DomHelper.create_div({
    //         flexGrow: "1",
    //     }))

    //     const button = div.appendChild(DomHelper.create_text("✘", {
    //         fontSize: "20px",
    //         padding: "20px",
    //         margin: "-10px"
    //     }))

    //     button.addEventListener("mouseenter", () =>
    //     {
    //         DomHelper.apply_style(button, {
    //             color: "red",
    //         })
    //     })
    //     button.addEventListener("mouseleave", () =>
    //     {
    //         DomHelper.apply_style(button, {
    //             color: "black",
    //         })
    //     })
    //     button.addEventListener("mousedown", (_e: MouseEvent) =>
    //     {
    //     })
        
    //     const mouseup = () =>
    //     {
    //         //event_box.emit("challenge", null)
    //         //event_box.emit("watch", null)
    //     }

    //     div.addEventListener("mouseup", mouseup)
    //     return div
    // }
}
