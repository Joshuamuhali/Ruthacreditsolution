import Image from 'next/image'

type LogoProps = {
  className?: string
  variant?: 'navbar' | 'footer'
}

export function Logo({ className, variant = 'navbar' }: LogoProps) {
  const isFooter = variant === 'footer'

  return (
    <div className={`flex items-center overflow-hidden ${isFooter ? 'h-32' : 'h-28'} ${className ?? ''}`}>
      <Image
        src="/logo.png"
        alt="Rutha Credit Solutions"
        width={isFooter ? 360 : 320}
        height={isFooter ? 128 : 112}
        className={`w-auto object-contain ${isFooter ? 'h-32 max-h-32' : 'h-28 max-h-28'}`}
        priority
      />
    </div>
  )
}
