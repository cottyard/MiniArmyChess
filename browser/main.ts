import { GameUiFacade } from "./game";
import { BoardDisplay } from "./ui/board_display";
import { HallPanel } from "./ui/hall_panel";
// import { ButtonBar } from "./ui/button_bar";
import { StatusBar } from "./ui/status_bar"
import { event_box, ui_components } from "./ui/ui";

export function main()
{
    let facade = new GameUiFacade()
    facade.AI_mode()
    let board_display = new BoardDisplay(facade)

    let status_bar = new StatusBar(
        <HTMLDivElement> document.getElementById('status-bar'), board_display, facade)
    
    // let button_bar = new ButtonBar(
    //     <HTMLDivElement> document.getElementById('button-bar'), board_display, facade);

    let hall_panel = new HallPanel(
        <HTMLDivElement> document.getElementById('hall-panel'))

    ui_components.push(board_display)
    ui_components.push(status_bar)
    ui_components.push(hall_panel)
    // ui_components.push(button_bar);

    event_box.subscribe('refresh ui', _ => {
        for (let c of ui_components) {
            c.render()
        }
    })

    event_box.subscribe('refresh status', arg => {
        status_bar.render(arg)
    })

    // event_box.subscribe("refresh counter", secs => {
    //     button_bar.update_counter(secs);
    // });

    event_box.emit("refresh ui", null)
}

window.onload = main;