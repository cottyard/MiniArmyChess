import { GameUiFacade, GameContextStatus } from "../game_context";
import { BoardDisplay } from './board_display'
import { DomHelper, IComponent } from "./dom_helper";

interface IButtonBar extends IComponent
{
    update_counter(secs: number | null): void;
}

export class ButtonBar implements IButtonBar
{
    submit_button: HTMLButtonElement | null = null;
    last_round_button: HTMLButtonElement | null = null;
    heat_button: HTMLButtonElement | null = null;
    private counter_value: number | null = null;

    constructor(
        public dom_element: HTMLDivElement,
        public board_display: BoardDisplay,
        public game: GameUiFacade)
    {
    }

    update_counter(secs: number | null) 
    {
        this.counter_value = secs;
        this.update_submit_name();
    }

    update_text()
    {
        this.update_submit_name();
    }

    update_submit_name()
    {
        if (!this.submit_button)
        {
            return;
        }

        if (this.game.context.status == GameContextStatus.WaitForPlayer)
        {
            this.submit_button.innerText = "Submit Move";
            if (this.counter_value)
            {
                this.submit_button.innerText += ` (${this.counter_value})`;
            }
        }
        else if (this.game.context.status == GameContextStatus.WaitForOpponent)
        {
            this.submit_button.disabled = true;
            this.submit_button.innerText = "Waiting for opponent...";
        }
        else if (this.game.context.status == GameContextStatus.Submitting)
        {
            this.submit_button.disabled = true;
            this.submit_button.innerText = "Submitting...";
        }
        else
        {
            this.submit_button.disabled = true;
            this.submit_button.innerText = "Loading next round...";
        }
    }

    render()
    {
        this.dom_element.innerHTML = "";

        DomHelper.apply_style(this.dom_element, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            height: "40px"
        });


        if (this.game.context.is_in_menu() || this.game.context.is_finished())
        {
            let vs_AI = DomHelper.create_button();
            // vs_AI.onclick = () => { this.game.AI_mode(); };
            vs_AI.innerText = "Play AI";

            let vs_Human = DomHelper.create_button();
            // vs_Human.onclick = () => { this.game.online_mode(); };
            vs_Human.innerText = "Play Online";

            this.dom_element.appendChild(vs_AI);
            this.dom_element.appendChild(vs_Human);
        }
        else if (this.game.context.is_in_queue() || this.game.context.is_not_started())
        {
            let new_game = DomHelper.create_button();
            // new_game.onclick = () => { this.game.new_game(); };

            if (this.game.context.is_in_queue())
            {
                new_game.innerText = "Finding opponent...";
                new_game.disabled = true;
            }
            else
            {
                new_game.innerText = "Find Game";
            }

            let player_name = DomHelper.create_textarea();
            player_name.textContent = this.game.player_name;
            player_name.onfocus = () => { player_name.select(); };
            player_name.onkeyup = () =>
            {
                if (player_name.value)
                {
                    this.game.player_name = player_name.value;
                }
            };
            player_name.style.width = "80px";
            player_name.style.resize = "none";

            if (this.game.context.is_in_queue())
            {
                player_name.readOnly = true;
            }

            this.dom_element.appendChild(new_game);
            this.dom_element.appendChild(player_name);
        }
        else if (this.game.context.is_playing())
        {
            let submit_button = DomHelper.create_button();

            this.dom_element.appendChild(submit_button);
            this.submit_button = submit_button;
        }

        if (this.game.context.is_finished())
        {
            let text: string;

            if (this.game.context.status == GameContextStatus.Defeated)
            {
                text = 'You are defeated.';
            }
            else if (this.game.context.status == GameContextStatus.Victorious)
            {
                text = 'You are victorious!';
            }
            else
            {
                text = 'Game is tied.';
            }

            let status = DomHelper.create_text(text, {
                fontWeight: "bold",
                marginLeft: "20px"
            });
            this.dom_element.appendChild(status);
        }

        this.dom_element.appendChild(DomHelper.create_div({
            flexGrow: 1
        }));

        this.update_text();
    }
}
