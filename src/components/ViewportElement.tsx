import { useEffect, useRef } from "react";
import { Shape } from "./Shape";

type Props = {
    shape: Shape
    color: string
    opacity: number
    stroke: string
    strokeWidth: number
}

export const ViewportElement = ({ shape, color, opacity, stroke, strokeWidth }: Props) => {
  const fillRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.innerHTML = shape.toSvgStr(color, opacity, stroke, strokeWidth);
    }
  }, [shape]);

  return (
    <g ref={fillRef}>
    </g>
  );
};
