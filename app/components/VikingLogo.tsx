import Image from 'next/image';
import vikingLogo from '../../../public/viking-builder-logo.png';

interface VikingLogoProps {
  size?: number;
  className?: string;
}

export default function VikingLogo({ size = 250, className = '' }: VikingLogoProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Image
        src={vikingLogo}
        alt="Valhalla Builder Logo"
        width={size}
        height={size}
        className="rounded-full"
        priority
      />
    </div>
  );
}

