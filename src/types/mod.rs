use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

impl Point {
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Dimensions {
    pub width: f64,
    pub height: f64,
}

impl Dimensions {
    pub fn new(width: f64, height: f64) -> Self {
        Self { width, height }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl BoundingBox {
    pub fn new(x: f64, y: f64, width: f64, height: f64) -> Self {
        Self { x, y, width, height }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Polygon {
    pub points: String,
    pub fill: String,
    pub stroke: String,
    pub stroke_width: f64,
}

impl Polygon {
    pub fn new(points: String, fill: String, stroke: String, stroke_width: f64) -> Self {
        Self {
            points,
            fill,
            stroke,
            stroke_width,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ResizeTransform {
    pub width: f64,
    pub height: f64,
    pub anchor_x: f64,
    pub anchor_y: f64,
}

impl ResizeTransform {
    pub fn new(width: f64, height: f64, anchor_x: f64, anchor_y: f64) -> Self {
        Self {
            width,
            height,
            anchor_x,
            anchor_y,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum HandleName {
    Right,
    Bottom,
    Left,
    Top,
    BottomRight,
    BottomLeft,
    TopRight,
    TopLeft,
}

impl HandleName {
    pub fn as_str(&self) -> &'static str {
        match self {
            HandleName::Right => "right",
            HandleName::Bottom => "bottom",
            HandleName::Left => "left",
            HandleName::Top => "top",
            HandleName::BottomRight => "bottom-right",
            HandleName::BottomLeft => "bottom-left",
            HandleName::TopRight => "top-right",
            HandleName::TopLeft => "top-left",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Scale {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Flipped {
    pub x: i32,
    pub y: i32,
}

impl Flipped {
    pub fn new(x: i32, y: i32) -> Self {
        Self { x, y }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GroupTransform {
    pub scale: Scale,
    pub position: Point,
    pub flipped: Flipped,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SelectedGroupProperties {
    pub dimensions: Dimensions,
    pub fixed_anchor: Point,
    pub flipped: Flipped,
}
