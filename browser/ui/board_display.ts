import { IGameUiFacade } from '../game'
import { GameCanvas, Position } from './canvas'
import { CanvasUnitFactory } from './canvas_entity'
import { GameBoard, Rule } from '../../common/rule'
import { Coordinate, Move } from '../../common/entity'
import { g } from '../../common/global'
import { IComponent } from './dom_helper'
import { event_box } from './ui'

export interface IBoardDisplay extends IComponent
{
    displaying_board: GameBoard
    highlight(coord: Coordinate): void
    freeze_selection(): void
    unfreeze_selection(): void
}

const group_indicator_position = new Position(7.5*g.settings.grid_size, g.settings.grid_size)

export class BoardDisplay implements IBoardDisplay
{
    canvas: GameCanvas

    hovering: Coordinate | null = null
    selected: Coordinate | null = null
    _selection_frozen: boolean = false

    displaying_board: GameBoard
    displaying_move: Move | null

    constructor(public game: IGameUiFacade)
    {
        this.canvas = new GameCanvas(
            <HTMLCanvasElement> document.getElementById('background'),
            <HTMLCanvasElement> document.getElementById('static'),
            <HTMLCanvasElement> document.getElementById('animate'),
            <HTMLCanvasElement> document.getElementById('animate-transparent'))

        this.canvas.animate.addEventListener("mousedown", this.on_mouse_down.bind(this))
        this.canvas.animate.addEventListener("mouseup", this.on_mouse_up.bind(this))
        this.canvas.animate.addEventListener("mousemove", this.on_mouse_move.bind(this))
        this.canvas.animate.addEventListener("touchstart", this.on_touch.bind(this))
        this.canvas.animate.addEventListener("touchmove", this.on_touch.bind(this))
        this.canvas.animate.addEventListener("touchend", this.on_touch.bind(this))

        this.canvas.paint_background()
        

        this.displaying_board = this.game.context.present.board
        this.displaying_move = null

        this.render_board()
    }

    render(): void {
        this.update_display()
        this.render_board()
        this.render_indicators()
    }

    highlight(coord: Coordinate)
    {
        this.canvas.paint_grid_indicator(coord)
    }

    clear_animate(): void
    {
        this.canvas.clear_canvas(this.canvas.am_ctx)
        this.canvas.clear_canvas(this.canvas.am_ctx_t)
    }

    get_coordinate(event: MouseEvent): Coordinate | undefined
    {
        let rect = this.canvas.background.getBoundingClientRect()
        let mouse_x = event.clientX - rect.left - g.settings.cvs_border_width
        let mouse_y = event.clientY - rect.top - g.settings.cvs_border_width
        return GameCanvas.to_coordinate(mouse_x, mouse_y)
    }

    on_touch(event: TouchEvent)
    {
        let touches = event.changedTouches
        let first = touches[0]
        let type = ""

        switch (event.type)
        {
            case "touchstart":
                type = "mousedown"
                break
            case "touchmove":
                type = "mousemove"
                break
            case "touchend":
                type = "mouseup"
                break
        }

        let simulated = document.createEvent("MouseEvent")
        simulated.initMouseEvent(
            type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0, null)

        first.target.dispatchEvent(simulated)
        event.preventDefault()
    }

    on_mouse_move(event: MouseEvent): void
    {
        let coord = this.get_coordinate(event)
        if (coord == undefined) return
        if (!this.hovering?.equals(coord)){
            this.hovering = coord
            this.render_indicators()
            event_box.emit(
                "refresh status", 
                this.game.context.present.board.unit.at(coord))
        }
    }

    on_mouse_down(_event: MouseEvent): void
    {
        // let coord = this.get_coordinate(event)
        // if (!this.selection_frozen){
        //     this.selected = coord
        // }
        // this.render_indicators()
    }

    freeze_selection(): void
    {
        this._selection_frozen = true
    }

    unfreeze_selection(): void
    {
        this._selection_frozen = false
    }

    get selection_frozen(): boolean{
        return this._selection_frozen
    }

    on_mouse_up(event: MouseEvent): void
    {
        let c = this.get_coordinate(event)
        if (c == undefined) return
        this.hovering = c
        let unit = this.game.context.present.board.unit.at(c)
        let current_group = this.game.context.present.group_to_move
        if (this.selected == null){
            if (this.selection_frozen) return
            if (unit == null) return
            if (unit.group != current_group) return
            this.selected = c
        } else {
            
            if (unit != null && unit.group == current_group) {
                this.selected = c
            } else {
                try {
                    let m = new Move(this.selected, this.hovering)
                    this.game.submit_move(m)
                }
                catch {}
                this.selected = null
            }
        }
        this.render()
    }

    update_display(){
        this.displaying_board = this.game.context.present.board
    }

    render_board(){
        this.canvas.clear_canvas(this.canvas.st_ctx)
        this.displaying_board.unit.iterate_units((unit, coord) => {
            this.canvas.paint_unit(CanvasUnitFactory(unit), coord)
        })

        let gi = group_indicator_position
        for (let g = 0; g < this.game.context.present.group_to_move; ++g) {
            gi = rotate_counter_clockwise(gi)
        }
        this.canvas.paint_group_indicator(gi)
    }

    render_indicators(): void{
        this.clear_animate()
        if (this.hovering){
            this.canvas.paint_grid_indicator(this.hovering, g.const.STYLE_BLACK, 2)
        }
        if (this.selected){
            this.canvas.paint_grid_indicator(this.selected, g.const.STYLE_BLACK, 4)
            for (let c of Rule.get_move_options(this.game.context.present.board, this.selected).as_list()) {
                this.canvas.paint_grid_indicator(c, g.const.STYLE_GREEN, 1.5)
            }
        }
    }
}

function rotate_counter_clockwise(p: Position): Position {
    return new Position(p.y, -p.x + g.cvs_size)
}
