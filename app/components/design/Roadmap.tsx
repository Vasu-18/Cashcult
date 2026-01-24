import gradient  from '@/assets/gradient.png'
import Image from 'next/image';

export const Gradient = () => {
  return (
    <div className="absolute top-73 -left-121.5 w-226.5 opacity-60 mix-blend-color-dodge pointer-events-none">
      <div className="absolute top-1/2 left-1/2 w-[58.85rem] h-[58.85rem] -translate-x-3/4 -translate-y-1/2">
        <Image
          className="w-full"
          src={gradient}
          width={942}
          height={942}
          alt="Gradient"
        />
      </div>
    </div>
  );
};