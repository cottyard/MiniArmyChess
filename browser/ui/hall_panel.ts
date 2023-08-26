import { g } from '../../common/global'
import { UserStatus } from '../../common/protocol'
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
            justifyContent: 'center'
        })
    )
    return div
}

export class HallPanel implements IComponent
{
    constructor(public dom_element: HTMLDivElement, public game: GameUiFacade)
    {
        DomHelper.apply_style(this.dom_element, {
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            userSelect: "none",
        })
    }

    render()
    {
        this.dom_element.innerHTML = ""

        if (this.game.hall != null) {
            let div = DomHelper.create_div({
                display: "flex",
                flexDirection: "row",
                margin: "5px",
                height: '30px',
            })
            div.appendChild(DomHelper.create_text('Welcome,', {}))
            div.appendChild(DomHelper.create_text(
                this.game.hall.username, {
                    'font-weight': 'bold',
                    'padding-left': '3px',
                    'padding-right': '3px'
                }))
            div.appendChild(DomHelper.create_text('!', {}))
            this.dom_element.appendChild(div)

            if (this.game.hall.status == HallStatus.Full) {
                this.dom_element.appendChild(hall_status_indicator("hall is full"))
            } else if (this.game.hall.status == HallStatus.LoggedOut) {
                this.dom_element.appendChild(hall_status_indicator("offline"))
            } else {
                this.dom_element.appendChild(hall_status_indicator("online"))
                if (this.game.hall.info) {
                    for (let name in this.game.hall.info) {
                        this.dom_element.appendChild(
                            create_item(name, this.game.hall.info[name]))
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
            name.style.width = "80px"
            name.style.resize = "none"
            name.onkeyup = () => {
                login.disabled = name.value.length == 0
            }

            let login = DomHelper.create_button()
            login.innerText = "Login"
            login.disabled = true
            login.onclick = () => { 
                let n = name.value
                if (n) this.game.initialize_hall(n)
            }
            div.appendChild(name)
            div.appendChild(btn_div)
            btn_div.appendChild(login)
            this.dom_element.appendChild(div)
        }
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

function create_item(name: string, status: UserStatus): HTMLElement {
    let status_info
    if (status == UserStatus.Idle) {
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
        flex: 1,
    })
    div2.appendChild(DomHelper.create_text(status_info, {
        backgroundColor: g.styles.STYLE_GREEN_LIGHT,
        borderRadius: '3px',
        padding: '2px',
        fontWeight: 'bold'}))
    div.appendChild(div2)
    return div
}