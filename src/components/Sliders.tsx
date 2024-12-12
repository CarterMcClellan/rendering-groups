import { Slider } from '@/components/ui/slider';

type Props = {
  scaleX: number;
  scaleY: number;
  setScaleX: (value: number) => void;
  setScaleY: (value: number) => void;
}

export const Sliders = ({ scaleX, scaleY, setScaleX, setScaleY }: Props) => {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Scale X: {scaleX.toFixed(2)}</label>
        <Slider
          value={[scaleX]}
          onValueChange={([value]) => setScaleX(value)}
          min={-1}
          max={3}
          step={0.1}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Scale Y: {scaleY.toFixed(2)}</label>
        <Slider
          value={[scaleY]}
          onValueChange={([value]) => setScaleY(value)}
          min={-1}
          max={3}
          step={0.1}
        />
      </div>
    </>
  )
}