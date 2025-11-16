use crate::types::{BoundingBox, Point, Polygon};
use web_sys::{MouseEvent, SvgsvgElement};

pub fn parse_points(points_string: &str) -> Vec<Point> {
    points_string
        .split_whitespace()
        .filter_map(|pair| {
            let coords: Vec<&str> = pair.split(',').collect();
            if coords.len() == 2 {
                let x = coords[0].parse::<f64>().ok()?;
                let y = coords[1].parse::<f64>().ok()?;
                Some(Point::new(x, y))
            } else {
                None
            }
        })
        .collect()
}

pub fn stringify_points(points_array: &[Point]) -> String {
    points_array
        .iter()
        .map(|p| format!("{},{}", p.x, p.y))
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn client_to_svg_coords(event: &MouseEvent, svg_element: &SvgsvgElement) -> Option<Point> {
    let rect = svg_element.get_bounding_client_rect();
    let x = (event.client_x() as f64 - rect.left()) / rect.width() * 500.0;
    let y = (event.client_y() as f64 - rect.top()) / rect.height() * 500.0;
    Some(Point::new(x, y))
}

pub fn transform_point(
    point: &Point,
    scale_x: f64,
    scale_y: f64,
    translate_x: f64,
    translate_y: f64,
) -> Point {
    Point::new(
        translate_x + point.x * scale_x,
        translate_y + point.y * scale_y,
    )
}

pub fn transform_polygons(
    polygons: &[Polygon],
    scale_x: f64,
    scale_y: f64,
    translate_x: f64,
    translate_y: f64,
) -> Vec<Polygon> {
    polygons
        .iter()
        .map(|polygon| {
            let points = parse_points(&polygon.points);
            let transformed_points: Vec<Point> = points
                .iter()
                .map(|p| transform_point(p, scale_x, scale_y, translate_x, translate_y))
                .collect();

            Polygon::new(
                stringify_points(&transformed_points),
                polygon.fill.clone(),
                polygon.stroke.clone(),
                polygon.stroke_width,
            )
        })
        .collect()
}

pub fn calculate_bounding_box(polygon_list: &[Polygon]) -> Option<BoundingBox> {
    let all_points: Vec<Point> = polygon_list
        .iter()
        .flat_map(|polygon| parse_points(&polygon.points))
        .collect();

    if all_points.is_empty() {
        return None;
    }

    let xs: Vec<f64> = all_points.iter().map(|p| p.x).collect();
    let ys: Vec<f64> = all_points.iter().map(|p| p.y).collect();

    let min_x = xs.iter().copied().fold(f64::INFINITY, f64::min);
    let max_x = xs.iter().copied().fold(f64::NEG_INFINITY, f64::max);
    let min_y = ys.iter().copied().fold(f64::INFINITY, f64::min);
    let max_y = ys.iter().copied().fold(f64::NEG_INFINITY, f64::max);

    Some(BoundingBox::new(
        min_x,
        min_y,
        max_x - min_x,
        max_y - min_y,
    ))
}

pub fn convert_to_local_coordinates(polygons: &[Polygon], bbox: &BoundingBox) -> Vec<Polygon> {
    polygons
        .iter()
        .map(|polygon| {
            let points = parse_points(&polygon.points);
            let local_points: Vec<Point> = points
                .iter()
                .map(|p| Point::new(p.x - bbox.x, p.y - bbox.y))
                .collect();

            Polygon::new(
                stringify_points(&local_points),
                polygon.fill.clone(),
                polygon.stroke.clone(),
                polygon.stroke_width,
            )
        })
        .collect()
}
