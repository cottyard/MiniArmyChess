import { g } from '../../common/global'
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

    constructor(public dom_element: HTMLDivElement)
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
        this.dom_element.appendChild(DomHelper.create_text(
            "online players", {
                color: "black",
                'font-weight': 'bold',
                padding: "10px"
            }))
        //this.dom_element.appendChild(this.render_action(action, index))
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
