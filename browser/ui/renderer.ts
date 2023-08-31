import { g } from "../../common/global";
import { IDisposable } from "../../common/language";
import { Angle, Direction, Position, PositionDelta } from "./canvas";

export class Renderer implements IDisposable
{
    transform_matrix: DOMMatrix | null = null;
    alpha: number = 1;
    constructor(public ctx: CanvasRenderingContext2D)
    {
        this.ctx.save();
    }

    translate(position: Position)
    {
        this.ctx.translate(position.x, position.y);
    }

    rotate(radian: number)
    {
        this.ctx.rotate(radian);
    }

    record()
    {
        this.transform_matrix = this.ctx.getTransform();
    }

    rewind()
    {
        if (this.transform_matrix)
        {
            this.ctx.setTransform(this.transform_matrix);
        }
    }

    line(from: Position, to: Position, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    }

    circle(position: Position, radius: number, width: number, fill_style: string | null = null, stroke: boolean = true): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
        if (fill_style != null)
        {
            this.set_fill_color(fill_style);
            this.ctx.fill();
        }
        if (stroke) this.ctx.stroke()
    }

    arc(position: Position, radius: number, angle: Angle, width: number): void
    {
        this.ctx.lineWidth = width;
        let radian_angle = angle.to_radian();
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, radian_angle.start.value, radian_angle.end.value, false);
        this.ctx.stroke();
    }

    curve(from: Position, control: Position, to: Position, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
        this.ctx.stroke();
    }

    triangle(point_1: Position, point_2: Position, point_3: Position, width: number, fill_style: string | null = null): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(point_1.x, point_1.y);
        this.ctx.lineTo(point_2.x, point_2.y);
        this.ctx.lineTo(point_3.x, point_3.y);
        
        this.ctx.closePath();
        if (fill_style != null)
        {
            this.set_fill_color(fill_style);
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    text(text: string, position: Position, fill_style: string=g.styles.STYLE_BLACK, size=24): void
    {
        this.set_fill_color(fill_style)
        this.ctx.font = `${size}px serif`
        this.ctx.fillText(text, position.x, position.y)
    }

    rectangle(position: Position, width: number, height: number, border_width: number, fill_style: string | null = null): void
    {
        this.ctx.lineWidth = border_width;
        if (fill_style != null)
        {
            this.set_fill_color(fill_style);
            this.ctx.fillRect(position.x, position.y, width, height);
        }
        if (border_width != 0)
        {
            this.ctx.strokeRect(position.x, position.y, width, height);
        }
    }

    rectangle_dashed(
        position: Position, width: number, height: number, border_width: number, 
        style: string | null = null, density: number | null): void
    {
        if (style)
        {
            this.set_color(style);
        }

        if (density != null)
        {
            density = Math.floor(density * 10 + 1);
            this.ctx.setLineDash(
                [10 + border_width * density,
                border_width * (10 - density)]);
        }

        this.ctx.lineWidth = border_width;
        this.ctx.beginPath();
        this.ctx.moveTo(position.x, position.y);
        this.ctx.lineTo(position.x + width, position.y);
        this.ctx.lineTo(position.x + width, position.y + height);
        this.ctx.lineTo(position.x, position.y + height);
        this.ctx.lineTo(position.x, position.y);
        this.ctx.stroke();
    }

    static go_towards(from: Position, to: Position, length: number): Position
    {
        let direction = Renderer.get_direction(from, to);
        let dy = length * Math.sin(direction.to_radian().value);
        let dx = length * Math.cos(direction.to_radian().value);
        return from.add(new PositionDelta(dx, dy));
    }

    static get_direction(from: Position, to: Position): Direction
    {
        let delta = from.delta(to);
        
        if (delta.dx == 0)
        {
            if (delta.dy > 0)
            {
                return new Direction(90);
            }
            else if (delta.dy < 0)
            {
                return new Direction(270);
            }
            else
            {
                return new Direction(0);
            }
        }
        else
        {
            let direction = Direction.from_radian(Math.atan(delta.dy / delta.dx));
            
            if (delta.dx < 0)
            {
                return direction.opposite();
            }
            else
            {
                return direction;
            }
        }
    }

    set_color(style: string): void
    {
        this.ctx.strokeStyle = this.ctx.fillStyle = style;
        this.ctx.globalAlpha = this.alpha;
    }

    set_fill_color(style: string): void
    {
        this.ctx.fillStyle = style;
        this.ctx.globalAlpha = this.alpha;
    }

    set_alpha(alpha: number): void
    {
        this.alpha = alpha;
    }

    dispose() 
    {
        this.ctx.restore();
    }
}
