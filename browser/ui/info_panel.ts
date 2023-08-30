import { Unit } from "../../common/entity"
import { g } from "../../common/global"
import { using } from "../../common/language"
import { GameUiFacade } from "../game_context"
import { Position } from "./canvas"
import { CanvasUnitFactory, PaintMode } from "./canvas_entity"
import { DomHelper } from "./dom_helper"
import { Renderer } from "./renderer"

export class InfoPanel
{
    expand_rules: boolean = false
    constructor(public dom_element: HTMLDivElement, public game: GameUiFacade)
    {
    }

    render() {
        this.dom_element.innerHTML = ""
        let div = DomHelper.create_div({
            'border-bottom': '1px dashed black',
        })
        div.appendChild(DomHelper.create_text('被吃', {
            display: 'flex',
            flex: 1,
            'font-weight': 'bold',
            height: '30px',
            margin: '5px',
            'background-color': g.styles.STYLE_GREY,
            justifyContent: 'center'
        }))
        this.dom_element.appendChild(div)

        let div2 = DomHelper.create_div({
            display: "flex",
            flexDirection: "row",
            padding: "5px",
            flexGrow: '0',
            flexWrap: 'wrap',
        })
        this.game.context.present.board.outcasts.forEach((unit) => {
            if (unit.owner == this.game.current_player()) {
                div2.appendChild(this.render_unit(unit))
            }
        })
        this.dom_element.appendChild(div2)
        this.dom_element.appendChild(DomHelper.create_div({
            display: "flex",
            flex: 1
        }))
        this.dom_element.appendChild(this.render_rules())
    }

    render_unit(unit: Unit): HTMLElement {
        const canvas = DomHelper.create_canvas()
        canvas.width = g.node_size
        canvas.height = g.node_size
        const context = canvas.getContext("2d")
        if (context == null){
            throw new Error("Your browser is outdated.")
        }
        const canvas_unit = CanvasUnitFactory(unit, PaintMode.Normal)

        using(new Renderer(context), (renderer) => {
            renderer.translate(new Position(g.node_size / 2, g.node_size / 2))
            canvas_unit.paint(renderer)
        })

        return canvas
    }

    render_rules(): HTMLElement {
        let div = DomHelper.create_div({
            display: "flex",
            flexDirection: "column",
            flex: this.expand_rules ? 1 : 0,
        })
        let div1 = DomHelper.create_div({
            'border-top': '1px dashed black',
            'border-bottom': this.expand_rules ? '1px dashed black' : 'none'
        })
        let rule = DomHelper.create_button({
            fontSize: '15px',
            border: 'none',
        })
        rule.innerText = this.expand_rules ? "- 规则" : "+ 规则"
        rule.onclick = () => {
            this.expand_rules = !this.expand_rules
            this.render()
        }
        let div2 = DomHelper.create_div({
            display: 'flex',
            flex: 1,
            margin: "5px",
            height: '30px',
            backgroundColor: g.styles.STYLE_GREY,
        })
        div2.appendChild(rule)
        div1.appendChild(div2)
        div.appendChild(div1)
        if (this.expand_rules) {
            instructions.split('\n').forEach((i) => {
                div.appendChild(DomHelper.create_text(i, {margin: '3px'}))
            })
        }
        return div
    }
}

const instructions = `
1. 坦 > 车 > 兵 > 侦\n
2. 炸 与任何敌子同归于尽。不可放在第一排\n
3. 炮 可吃任何敌子（炸、雷除外），也可被任何敌子吃（炸除外）\n
4. 雷 不可移动。只能被 兵 吃。放在后两排\n
5. 营 不可移动。受攻击时同色棋子全军覆没。放在最后一排\n
6. 侦 可以飞。打不过除 炮 以外的任何敌子。可使敌子暴露身份\n
7. 坦 阵亡时己方 营 暴露
8. 敌方棋子上的数字标记是其可能的身份数量\n
9. 所有敌子阵亡时获胜。第100回合场上还有双方棋子时平局\n
`