import { useEffect, useRef } from "react";
import { Shape, ShapeTransform } from "./Shape";

type Props = {
    shape: Shape;
    groupTransform: ShapeTransform | null;
    isSelected?: boolean;
    onClick?: () => void;
}

export const ViewportElement = ({ shape, groupTransform, isSelected = false, onClick }: Props) => {
    const fillRef = useRef<SVGGElement>(null);
    const strokeRef = useRef<SVGGElement>(null);

    useEffect(() => {
        if (!fillRef.current || !strokeRef.current) {
            return;
        }

        fillRef.current.innerHTML = shape.getFill();
        strokeRef.current.innerHTML = shape.getStroke();
    }, [shape]);

    // Apply transform only if groupTransform is provided
    const transformValue = groupTransform 
        ? `translate(${groupTransform.x}, ${groupTransform.y}) scale(${groupTransform.scaleX}, ${groupTransform.scaleY})`
        : '';

    return (
        <g 
            className={`viewport-element-container ${isSelected ? 'selected' : ''}`} 
            transform={transformValue}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        > 
            <g className="viewport-element-stroke" ref={strokeRef} />
            <g className="viewport-element-fill" ref={fillRef} />
        </g>
    );
}