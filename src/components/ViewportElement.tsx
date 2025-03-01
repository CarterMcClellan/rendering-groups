import { useEffect, useRef } from "react";
import { Shape, ShapeTransform } from "./Shape";

type Props = {
    shape: Shape;
    shapeTransform: ShapeTransform | null;
    isSelected?: boolean;
    onClick?: () => void;
}

export const ViewportElement = ({ shape, shapeTransform, isSelected = false, onClick }: Props) => {
    const fillRef = useRef<SVGGElement>(null);
    const strokeRef = useRef<SVGGElement>(null);
    var transformStr = '';

    if (shapeTransform) {
        const scaleStr = shapeTransform.scaleX+','+shapeTransform.scaleY;
        const translateStr = shapeTransform.originX+','+shapeTransform.originY;
        transformStr = `translate(${translateStr}) scale(${scaleStr})`;
        console.log("transformStr", transformStr);
    }


    useEffect(() => {
        if (!fillRef.current || !strokeRef.current) {
            return;
        }

        fillRef.current.innerHTML = shape.getFill();
        strokeRef.current.innerHTML = shape.getStroke();
    }, [shape]);

    return (
        <g 
            className={`viewport-element-container ${isSelected ? 'selected' : ''}`} 
            transform={transformStr}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        > 
            <g className="viewport-element-stroke" ref={strokeRef} />
            <g className="viewport-element-fill" ref={fillRef} />
        </g>
    );
}