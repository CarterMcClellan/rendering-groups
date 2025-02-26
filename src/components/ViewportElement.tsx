import { useEffect, useRef } from "react";
import { Shape } from "./Shape";

type Props = {
    shape: Shape;
    scaleX: number;
    scaleY: number;
}

export const ViewportElement = ({ shape, scaleX, scaleY }: Props) => {
    const fillRef = useRef<SVGGElement>(null);
    const strokeRef = useRef<SVGGElement>(null);

    useEffect(() => {
        if (!fillRef.current || !strokeRef.current) {
            return;
        }

        fillRef.current.innerHTML = shape.getFill();
        strokeRef.current.innerHTML = shape.getStroke();
    }, [shape]);

    return (
        <g className="viewport-element-container" transform={`scale(${scaleX}, ${scaleY})`}> 
            <g className="viewport-element-stroke" ref={strokeRef} />
            <g className="viewport-element-fill" ref={fillRef} />
        </g>
    );
}