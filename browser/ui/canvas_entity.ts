import { Unit, UnitConstructor, Scout, Artillery, Infantry, Armored, Tank, Mine, Base, Bomb } from "../../common/entity";
import { g } from "../../common/global";
import { Position } from "./canvas";
import { Renderer } from "./renderer";

type CanvasUnitConstructor = new (unit: Unit, mode: PaintMode) => CanvasUnit;

export let CanvasUnitFactory = function (unit: Unit, mode: PaintMode): CanvasUnit
{
    let cmap = new Map<UnitConstructor, CanvasUnitConstructor>([
        [Scout, CanvasScout],
        [Artillery, CanvasArtillery],
        [Bomb, CanvasBomb],
        [Infantry, CanvasInfantry],
        [Armored, CanvasArmored],
        [Tank, CanvasTank],
        [Base, CanvasBase],
        [Mine, CanvasMine],
    ])
    let constructor = cmap.get(unit.type)
    if (!constructor){
        throw new Error(`Canvas ${ unit.type.name } missing`)
    }
    return new constructor(unit, mode)
};

export const color = {
    0: g.styles.STYLE_RED_LIGHT,
    1: g.styles.STYLE_BLUE_LIGHT,
    2: g.styles.STYLE_YELLOW,
    3: g.styles.STYLE_GREEN_LIGHT
}
const text_offset = new Position(-12, 10)
const text_number_offset = new Position(-6, 8)

export enum PaintMode {
    Normal,
    Hidden,
    Revealed
}

export abstract class CanvasUnit
{
    color: string
    constructor(protected unit: Unit, public mode: PaintMode){
        this.color = color[this.unit.group]
    }

    paint(renderer: Renderer): void
    {
        renderer.circle(new Position(0, 0), 18, 2, this.color)
        if (this.mode == PaintMode.Normal) {
            this.paint_unit(renderer)
        } else if (this.mode == PaintMode.Hidden) {
            renderer.text(this.unit.possible_types().length.toString(), text_number_offset, g.styles.STYLE_BLACK, 20)
        } else {
            this.paint_unit(renderer)
        }
    }

    paint_unit(renderer: Renderer): void {
        renderer.text(type_to_literal(this.unit.type.id), text_offset)
    }
}

export function type_to_literal(type_id: number) {
    return ["营", "炸", "炮", "侦", "兵", "车", "坦", "雷"][type_id - 1]
}

class CanvasScout extends CanvasUnit{
}

class CanvasArtillery extends CanvasUnit{
}

class CanvasBomb extends CanvasUnit{
}

class CanvasInfantry extends CanvasUnit{
}

class CanvasArmored extends CanvasUnit{
}

class CanvasTank extends CanvasUnit{
}

class CanvasBase extends CanvasUnit{
}

class CanvasMine extends CanvasUnit{
}

