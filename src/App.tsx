import ScaleTransformDemo from '@/components/ScaleTransformDemo';
import ScaleGroupDemo from './components/ScaleGroupDemo';

export default function App() {
  return (
    <div className='w-full p-8'>
      <div className='flex justify-center'>
        <ScaleGroupDemo />
        {/* <ScaleTransformDemo /> */}
      </div>
    </div>
  );
}