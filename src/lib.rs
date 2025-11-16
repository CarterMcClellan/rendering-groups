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
        <div class="w-full p-8">
            <div class="flex justify-center">
                <ResizableCanvas />
            </div>
        </div>
    }
}
