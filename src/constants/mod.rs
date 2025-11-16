use crate::types::{BoundingBox, Dimensions, Flipped, HandleName, Point, Polygon};

pub const SVG_SIZE: f64 = 500.0;
pub const MIN_SIZE: f64 = 10.0;
pub const HANDLE_SIZE_EDGE: f64 = 6.0;
pub const HANDLE_SIZE_CORNER: f64 = 8.0;
pub const ANCHOR_RADIUS: f64 = 5.0;

pub fn get_initial_polygons() -> Vec<Polygon> {
    vec![
        Polygon::new(
            "0,0 30,0 15,30".to_string(),
            "#ff6347".to_string(),
            "black".to_string(),
            1.0,
        ),
        Polygon::new(
            "40,10 70,10 55,40".to_string(),
            "#4682b4".to_string(),
            "black".to_string(),
            1.0,
        ),
        Polygon::new(
            "20,50 50,50 35,80".to_string(),
            "#9acd32".to_string(),
            "black".to_string(),
            1.0,
        ),
    ]
}

pub fn get_initial_fixed_anchor() -> Point {
    Point::new(150.0, 150.0)
}

pub fn get_initial_dimensions() -> Dimensions {
    Dimensions::new(100.0, 100.0)
}

pub fn get_initial_flipped() -> Flipped {
    Flipped::new(1, 1)
}

pub struct HandleConfig {
    pub cursor: &'static str,
    pub is_corner: bool,
}

impl HandleConfig {
    pub fn calc(&self, handle: HandleName, bbox: &BoundingBox) -> Point {
        match handle {
            HandleName::Right => Point::new(bbox.x + bbox.width, bbox.y + bbox.height / 2.0),
            HandleName::Bottom => Point::new(bbox.x + bbox.width / 2.0, bbox.y + bbox.height),
            HandleName::Left => Point::new(bbox.x, bbox.y + bbox.height / 2.0),
            HandleName::Top => Point::new(bbox.x + bbox.width / 2.0, bbox.y),
            HandleName::BottomRight => Point::new(bbox.x + bbox.width, bbox.y + bbox.height),
            HandleName::BottomLeft => Point::new(bbox.x, bbox.y + bbox.height),
            HandleName::TopRight => Point::new(bbox.x + bbox.width, bbox.y),
            HandleName::TopLeft => Point::new(bbox.x, bbox.y),
        }
    }
}

pub fn get_handle_config(handle: HandleName) -> HandleConfig {
    match handle {
        HandleName::Right => HandleConfig {
            cursor: "ew-resize",
            is_corner: false,
        },
        HandleName::Bottom => HandleConfig {
            cursor: "ns-resize",
            is_corner: false,
        },
        HandleName::Left => HandleConfig {
            cursor: "ew-resize",
            is_corner: false,
        },
        HandleName::Top => HandleConfig {
            cursor: "ns-resize",
            is_corner: false,
        },
        HandleName::BottomRight => HandleConfig {
            cursor: "nwse-resize",
            is_corner: true,
        },
        HandleName::BottomLeft => HandleConfig {
            cursor: "nesw-resize",
            is_corner: true,
        },
        HandleName::TopRight => HandleConfig {
            cursor: "nesw-resize",
            is_corner: true,
        },
        HandleName::TopLeft => HandleConfig {
            cursor: "nwse-resize",
            is_corner: true,
        },
    }
}

pub fn get_all_handles() -> Vec<HandleName> {
    vec![
        HandleName::Right,
        HandleName::Bottom,
        HandleName::Left,
        HandleName::Top,
        HandleName::BottomRight,
        HandleName::BottomLeft,
        HandleName::TopRight,
        HandleName::TopLeft,
    ]
}
