mod components;
mod config;
mod constants;
mod types;
mod utils;

use components::ResizableCanvas;
use yew::prelude::*;

#[function_component(App)]
pub fn app() -> Html {
    html! {
        <div class="flex justify-center p-8">
            <ResizableCanvas />
        </div>
    }
}
