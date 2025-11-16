use crate::types::{Dimensions, HandleName, Point, ResizeTransform};

pub fn calculate_resize_transform(
    handle: HandleName,
    current: &Dimensions,
    point: &Point,
    fixed: &Point,
) -> ResizeTransform {
    match handle {
        HandleName::Right => ResizeTransform::new(
            point.x - fixed.x,
            current.height,
            fixed.x,
            fixed.y,
        ),
        HandleName::Bottom => ResizeTransform::new(
            current.width,
            point.y - fixed.y,
            fixed.x,
            fixed.y,
        ),
        HandleName::Left => ResizeTransform::new(
            fixed.x + current.width - point.x,
            current.height,
            point.x,
            fixed.y,
        ),
        HandleName::Top => ResizeTransform::new(
            current.width,
            fixed.y + current.height - point.y,
            fixed.x,
            point.y,
        ),
        HandleName::BottomRight => ResizeTransform::new(
            point.x - fixed.x,
            point.y - fixed.y,
            fixed.x,
            fixed.y,
        ),
        HandleName::BottomLeft => ResizeTransform::new(
            fixed.x + current.width - point.x,
            point.y - fixed.y,
            point.x,
            fixed.y,
        ),
        HandleName::TopRight => ResizeTransform::new(
            point.x - fixed.x,
            fixed.y + current.height - point.y,
            fixed.x,
            point.y,
        ),
        HandleName::TopLeft => ResizeTransform::new(
            fixed.x + current.width - point.x,
            fixed.y + current.height - point.y,
            point.x,
            point.y,
        ),
    }
}
