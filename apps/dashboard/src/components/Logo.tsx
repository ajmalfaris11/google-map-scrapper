import Image from 'next/image';

export function Logo({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <div className={`relative flex items-center justify-center rounded-full overflow-hidden ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/logo.png"
        alt="Spider X Logo"
        width={size}
        height={size}
        className="object-cover"
        priority
      />
    </div>
  );
}
