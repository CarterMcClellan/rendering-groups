import { useEffect, useRef } from "react";
import { Shape } from "./Shape";

type Props = {
    shape: Shape;
    isSelected?: boolean;
    onClick?: () => void;
}

export const ViewportElement = ({ shape, isSelected = false, onClick }: Props) => {
    const fillRef = useRef<SVGGElement>(null);
    const strokeRef = useRef<SVGGElement>(null);
    const containerRef = useRef<SVGGElement>(null);
    // var transformStr = '';

    useEffect(() => {
        if (!fillRef.current || !strokeRef.current || !containerRef.current) {
            return;
        }
        fillRef.current.innerHTML = shape.getFill();
        strokeRef.current.innerHTML = shape.getStroke();
        containerRef.current.setAttribute('transform', shape.getTransformStr());
    }, [shape]);

    return (
        <g 
            ref={containerRef}
            className={`viewport-element-container ${isSelected ? 'selected' : ''}`} 
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        > 
            <g className="viewport-element-stroke" ref={strokeRef} />
            <g className="viewport-element-fill" ref={fillRef} />
        </g>
    );
}