use crate::config::calculate_resize_transform;
use crate::constants::*;
use crate::types::{BoundingBox, Dimensions, Flipped, HandleName, Point, Polygon};
use crate::utils::{calculate_bounding_box, client_to_svg_coords, convert_to_local_coordinates, transform_polygons};
use gloo::events::EventListener;
use wasm_bindgen::JsCast;
use web_sys::{MouseEvent, SvgsvgElement};
use yew::prelude::*;

pub struct ResizableCanvas {
    fixed_anchor: Point,
    dimensions: Dimensions,
    base_dimensions: Dimensions,
    flipped: Flipped,
    is_dragging: bool,
    active_handle: Option<HandleName>,
    is_grouped: bool,
    polygons: Vec<Polygon>,
    svg_ref: NodeRef,
    _mousemove_listener: Option<EventListener>,
    _mouseup_listener: Option<EventListener>,
}

pub enum Msg {
    ResizeStart(MouseEvent, HandleName),
    Resize(MouseEvent),
    ResizeEnd,
    ApplyGroupTransform,
    RegroupElements,
    Reset,
}

impl Component for ResizableCanvas {
    type Message = Msg;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            fixed_anchor: get_initial_fixed_anchor(),
            dimensions: get_initial_dimensions(),
            base_dimensions: get_initial_dimensions(),
            flipped: get_initial_flipped(),
            is_dragging: false,
            active_handle: None,
            is_grouped: true,
            polygons: get_initial_polygons(),
            svg_ref: NodeRef::default(),
            _mousemove_listener: None,
            _mouseup_listener: None,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Msg::ResizeStart(_e, handle) => {
                self.is_dragging = true;
                self.active_handle = Some(handle);

                let link = ctx.link().clone();
                let mousemove_listener = EventListener::new(&web_sys::window().unwrap(), "mousemove", move |e| {
                    let mouse_event = e.dyn_ref::<MouseEvent>().unwrap().clone();
                    link.send_message(Msg::Resize(mouse_event));
                });

                let link = ctx.link().clone();
                let mouseup_listener = EventListener::new(&web_sys::window().unwrap(), "mouseup", move |_| {
                    link.send_message(Msg::ResizeEnd);
                });

                self._mousemove_listener = Some(mousemove_listener);
                self._mouseup_listener = Some(mouseup_listener);

                true
            }
            Msg::Resize(e) => {
                if !self.is_dragging || self.active_handle.is_none() {
                    return false;
                }

                let handle = self.active_handle.unwrap();
                let svg_element = self.svg_ref.cast::<SvgsvgElement>();

                if let Some(svg) = svg_element {
                    if let Some(point) = client_to_svg_coords(&e, &svg) {
                        let transform = calculate_resize_transform(
                            handle,
                            &self.dimensions,
                            &point,
                            &self.fixed_anchor,
                        );

                        let should_flip_x = transform.width < 0.0;
                        let should_flip_y = transform.height < 0.0;

                        let abs_width = transform.width.abs().max(MIN_SIZE);
                        let abs_height = transform.height.abs().max(MIN_SIZE);

                        self.flipped = Flipped::new(
                            if should_flip_x { -1 } else { 1 },
                            if should_flip_y { -1 } else { 1 },
                        );

                        self.dimensions = Dimensions::new(
                            if should_flip_x { -abs_width } else { abs_width },
                            if should_flip_y { -abs_height } else { abs_height },
                        );

                        self.fixed_anchor = Point::new(transform.anchor_x, transform.anchor_y);

                        return true;
                    }
                }
                false
            }
            Msg::ResizeEnd => {
                self.is_dragging = false;
                self.active_handle = None;
                self._mousemove_listener = None;
                self._mouseup_listener = None;
                true
            }
            Msg::ApplyGroupTransform => {
                let scale_x = (self.flipped.x as f64) * self.dimensions.width.abs() / self.base_dimensions.width;
                let scale_y = (self.flipped.y as f64) * self.dimensions.height.abs() / self.base_dimensions.height;

                let transformed = transform_polygons(
                    &self.polygons,
                    scale_x,
                    scale_y,
                    self.fixed_anchor.x,
                    self.fixed_anchor.y,
                );

                if let Some(bbox) = calculate_bounding_box(&transformed) {
                    self.polygons = transformed;
                    self.fixed_anchor = Point::new(bbox.x, bbox.y);
                    self.dimensions = Dimensions::new(bbox.width, bbox.height);
                    self.base_dimensions = Dimensions::new(bbox.width, bbox.height);
                    self.flipped = Flipped::new(1, 1);
                    self.is_grouped = false;
                }
                true
            }
            Msg::RegroupElements => {
                if let Some(bbox) = calculate_bounding_box(&self.polygons) {
                    let local_polygons = convert_to_local_coordinates(&self.polygons, &bbox);

                    self.polygons = local_polygons;
                    self.fixed_anchor = Point::new(bbox.x, bbox.y);
                    self.dimensions = Dimensions::new(bbox.width, bbox.height);
                    self.base_dimensions = Dimensions::new(bbox.width, bbox.height);
                    self.flipped = Flipped::new(1, 1);
                    self.is_grouped = true;
                }
                true
            }
            Msg::Reset => {
                self.polygons = get_initial_polygons();
                self.dimensions = get_initial_dimensions();
                self.base_dimensions = get_initial_dimensions();
                self.flipped = get_initial_flipped();
                self.fixed_anchor = get_initial_fixed_anchor();
                self.is_grouped = true;
                true
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let scale_x = (self.flipped.x as f64) * self.dimensions.width.abs() / self.base_dimensions.width;
        let scale_y = (self.flipped.y as f64) * self.dimensions.height.abs() / self.base_dimensions.height;

        let bounding_box = BoundingBox::new(
            self.fixed_anchor.x + if self.flipped.x == -1 { self.dimensions.width } else { 0.0 },
            self.fixed_anchor.y + if self.flipped.y == -1 { self.dimensions.height } else { 0.0 },
            self.dimensions.width.abs(),
            self.dimensions.height.abs(),
        );

        html! {
            <div class="flex flex-col items-center p-8">
                <div class="mb-4">
                    <p class="text-lg font-semibold">{"Drag any handle to resize or flip the shapes"}</p>
                    <p>{format!("Width: {}px, Height: {}px", self.dimensions.width.abs() as i32, self.dimensions.height.abs() as i32)}</p>
                    <p>{format!("Scale X: {:.2}, Scale Y: {:.2}", scale_x.abs(), scale_y.abs())}</p>
                    <p>{format!("Flipped X: {}, Flipped Y: {}", if self.flipped.x == -1 { "Yes" } else { "No" }, if self.flipped.y == -1 { "Yes" } else { "No" })}</p>
                </div>

                <svg
                    ref={self.svg_ref.clone()}
                    width={SVG_SIZE.to_string()}
                    height={SVG_SIZE.to_string()}
                    class="border border-gray-300 bg-gray-50"
                >
                    {if self.is_grouped {
                        html! {
                            <>
                                <g transform={format!("translate({}, {}) scale({}, {})", self.fixed_anchor.x, self.fixed_anchor.y, scale_x, scale_y)}>
                                    {for self.polygons.iter().enumerate().map(|(index, polygon)| {
                                        html! {
                                            <polygon
                                                key={index}
                                                points={polygon.points.clone()}
                                                fill={polygon.fill.clone()}
                                                stroke={polygon.stroke.clone()}
                                                stroke-width={polygon.stroke_width.to_string()}
                                            />
                                        }
                                    })}
                                </g>

                                <rect
                                    x={bounding_box.x.to_string()}
                                    y={bounding_box.y.to_string()}
                                    width={bounding_box.width.to_string()}
                                    height={bounding_box.height.to_string()}
                                    fill="none"
                                    stroke="#3b82f6"
                                    stroke-width="1"
                                    stroke-dasharray="4"
                                />

                                {for get_all_handles().iter().map(|handle| {
                                    let config = get_handle_config(*handle);
                                    let pos = config.calc(*handle, &bounding_box);
                                    let handle_clone = *handle;

                                    let onmousedown = ctx.link().callback(move |e: MouseEvent| {
                                        e.prevent_default();
                                        e.stop_propagation();
                                        Msg::ResizeStart(e, handle_clone)
                                    });

                                    html! {
                                        <circle
                                            key={handle.as_str()}
                                            cx={pos.x.to_string()}
                                            cy={pos.y.to_string()}
                                            r={if config.is_corner { HANDLE_SIZE_CORNER } else { HANDLE_SIZE_EDGE }.to_string()}
                                            fill="#3b82f6"
                                            stroke="white"
                                            stroke-width="2"
                                            style={format!("cursor: {}", config.cursor)}
                                            onmousedown={onmousedown}
                                        />
                                    }
                                })}
                            </>
                        }
                    } else {
                        html! {
                            <>
                                {for self.polygons.iter().enumerate().map(|(index, polygon)| {
                                    html! {
                                        <polygon
                                            key={index}
                                            points={polygon.points.clone()}
                                            fill={polygon.fill.clone()}
                                            stroke={polygon.stroke.clone()}
                                            stroke-width={polygon.stroke_width.to_string()}
                                        />
                                    }
                                })}
                            </>
                        }
                    }}
                </svg>

                <div class="mt-4 flex gap-2">
                    {if self.is_grouped {
                        html! {
                            <button
                                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                onclick={ctx.link().callback(|_| Msg::ApplyGroupTransform)}
                            >
                                {"Apply Group Transform"}
                            </button>
                        }
                    } else {
                        html! {
                            <button
                                class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                onclick={ctx.link().callback(|_| Msg::RegroupElements)}
                            >
                                {"Re-group Elements"}
                            </button>
                        }
                    }}
                    <button
                        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onclick={ctx.link().callback(|_| Msg::Reset)}
                    >
                        {"Reset"}
                    </button>
                </div>
            </div>
        }
    }
}
