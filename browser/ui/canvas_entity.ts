import { Unit, UnitConstructor, Scout, Artillery, Infantry, Tank, Airforce, Mine, Base, Bomb } from "../../common/entity";
import { g } from "../../common/global";
import { Position } from "./canvas";
import { Renderer } from "./renderer";

type CanvasUnitConstructor = new (unit: Unit) => CanvasUnit;

export let CanvasUnitFactory = function (unit: Unit): CanvasUnit
{
    let cmap = new Map<UnitConstructor, CanvasUnitConstructor>([
        [Scout, CanvasScout],
        [Artillery, CanvasArtillery],
        [Bomb, CanvasBomb],
        [Infantry, CanvasInfantry],
        [Tank, CanvasTank],
        [Airforce, CanvasAirforce],
        [Base, CanvasBase],
        [Mine, CanvasMine],
    ]);

    let constructor = cmap.get(unit.type);
    if (!constructor)
    {
        throw new Error(`Canvas ${ unit.type.name } missing`);
    }
    return new constructor(unit);
};

export const color = {
    0: g.const.STYLE_RED_LIGHT,
    1: g.const.STYLE_BLUE_LIGHT,
    2: g.const.STYLE_YELLOW,
    3: g.const.STYLE_GREEN_LIGHT
}

export abstract class CanvasUnit
{
    color: string
    constructor(protected unit: Unit){
        this.color = color[this.unit.group]
    }

    paint(renderer: Renderer): void
    {
        renderer.circle(new Position(0, 0), 18, 2, this.color)
        this.paint_unit(renderer)
    }

    paint_unit(renderer: Renderer): void {
        renderer.text(type_to_literal(this.unit.type), text_offset)
    }
}

const text_offset = new Position(-12, 10)

export function type_to_literal(t: UnitConstructor) {
    return ["营", "炸", "炮", "侦", "兵", "坦", "飞", "雷"][t.id - 1]
}

class CanvasScout extends CanvasUnit{
}

class CanvasArtillery extends CanvasUnit{
}

class CanvasBomb extends CanvasUnit{
}

class CanvasInfantry extends CanvasUnit{
}

class CanvasTank extends CanvasUnit{
}

class CanvasAirforce extends CanvasUnit{
}

class CanvasBase extends CanvasUnit{
}

class CanvasMine extends CanvasUnit{
}

