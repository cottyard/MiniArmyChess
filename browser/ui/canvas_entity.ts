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
        this.paint_unit(renderer);
    }

    abstract paint_unit(renderer: Renderer): void;
}

const text_offset = new Position(-12, 10)

class CanvasScout extends CanvasUnit{
    paint_unit(renderer: Renderer): void{
        renderer.text("侦", text_offset)
    }
}

class CanvasArtillery extends CanvasUnit{
    paint_unit(renderer: Renderer): void {
        renderer.text("炮", text_offset)
    }
}

class CanvasBomb extends CanvasUnit{
    paint_unit(renderer: Renderer): void {
        renderer.text("炸", text_offset)
    }
}

class CanvasInfantry extends CanvasUnit{
    paint_unit(renderer: Renderer): void {
        renderer.text("兵", text_offset)
    }
}

class CanvasTank extends CanvasUnit{
    paint_unit(renderer: Renderer): void {
        renderer.text("坦", text_offset)
    }
}

class CanvasAirforce extends CanvasUnit{
    paint_unit(renderer: Renderer): void {
        renderer.text("飞", text_offset)
    }
}

class CanvasBase extends CanvasUnit{
    paint_unit(renderer: Renderer): void {
        renderer.text("营", text_offset)
    }
}

class CanvasMine extends CanvasUnit{
    paint_unit(renderer: Renderer): void {
        renderer.text("雷", text_offset)
    }
}

