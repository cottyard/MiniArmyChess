import { g } from '../../common/global'
import { GameUiFacade } from '../game_context'
import { HallStatus } from '../hall'
import { DomHelper, IComponent } from './dom_helper'

export class HallPanel implements IComponent
{
    static padding = 5
    static margin = 5
    static scale = 0.75
    static item_height = (
        g.settings.grid_size * HallPanel.scale +
        (HallPanel.padding + HallPanel.margin) * 2
    )

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
            this.dom_element.appendChild(DomHelper.create_text(
                this.game.hall.username, {
                    color: "black",
                    'font-weight': 'bold',
                    padding: "10px"
                }))

            if (this.game.hall.status == HallStatus.Full) {
                this.dom_element.appendChild(DomHelper.create_text(
                    "Hall is full.", {padding: "10px"}))
            } else if (this.game.hall.status == HallStatus.LoggedOut) {
                this.dom_element.appendChild(DomHelper.create_text(
                    "Logging in...", {padding: "10px"}))
            } else {
                this.dom_element.appendChild(DomHelper.create_text(
                    "online players", {
                        'font-weight': 'bold',
                        padding: "10px"
                    }))
                if (this.game.hall.info) {
                    for (let name in this.game.hall.info) {
                        let div = DomHelper.create_div({
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: g.styles.STYLE_GREY,
                            borderRadius: "5px",
                            margin: HallPanel.margin.toString() + "px",
                            padding: HallPanel.padding.toString() + "px",
                            cursor: "pointer",
                            boxSizing: "border-box",
                        })

                        div.appendChild(DomHelper.create_text(
                            name, {padding: "10px"}))
                        div.appendChild(DomHelper.create_text(
                            this.game.hall.info[name].toString(), {padding: "10px"}))
                        this.dom_element.appendChild(div)
                    }
                }
                
            }
        } else {
            let name = DomHelper.create_textarea()
            name.textContent = ''
            name.onfocus = () => { name.select() }
            name.style.width = "80px"
            name.style.resize = "none"

            let login = DomHelper.create_button()
            login.innerText = "Login"
            login.onclick = () => { 
                let n = name.value
                if (n) this.game.initialize_hall(n)
            }

            this.dom_element.appendChild(name)
            this.dom_element.appendChild(login)
        }
    }

    render_player(index: number): HTMLElement
    {
        const div = DomHelper.create_div({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: g.styles.STYLE_GREY,
            borderRadius: "5px",
            margin: HallPanel.margin.toString() + "px",
            padding: HallPanel.padding.toString() + "px",
            cursor: "pointer",
            boxSizing: "border-box",
            order: index * 2,
        })

        div.appendChild(DomHelper.create_text(
            "anonymous",{
                color: "black",
                'font-weight': 'bold',
                padding: "10px"
            }
        ))

        div.appendChild(DomHelper.create_div({
            flexGrow: "1",
        }))

        const button = div.appendChild(DomHelper.create_text("✘", {
            fontSize: "20px",
            padding: "20px",
            margin: "-10px"
        }))

        button.addEventListener("mouseenter", () =>
        {
            DomHelper.apply_style(button, {
                color: "red",
            })
        })
        button.addEventListener("mouseleave", () =>
        {
            DomHelper.apply_style(button, {
                color: "black",
            })
        })
        button.addEventListener("mousedown", (_e: MouseEvent) =>
        {
        })
        
        const mouseup = () =>
        {
            //event_box.emit("challenge", null)
            //event_box.emit("watch", null)
        }

        div.addEventListener("mouseup", mouseup)
        return div
    }
}
