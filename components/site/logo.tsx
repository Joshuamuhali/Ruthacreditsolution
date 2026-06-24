import Image from 'next/image'

type LogoProps = {
  className?: string
  variant?: 'navbar' | 'footer'
}

export function Logo({ className, variant = 'navbar' }: LogoProps) {
  const isFooter = variant === 'footer'

  return (
    <div className={`flex items-center overflow-hidden ${isFooter ? 'h-16' : 'h-14'} ${className ?? ''}`}>
      <Image
        src="/logo.png"
        alt="Rutha Credit Solutions"
        width={isFooter ? 180 : 160}
        height={isFooter ? 64 : 56}
        className={`w-auto object-contain ${isFooter ? 'h-14 max-h-14' : 'h-12 max-h-12'}`}
        priority
      />
    </div>
  )
}