import logoImg from '../../assets/rexville-logo.png'

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <div className="logo-in flex items-center" aria-label="Rexville Solutions">
      <img
        src={logoImg}
        alt="Rexville Solutions"
        className="object-contain transition-transform hover:scale-105"
        style={{ height: size, width: 'auto' }}
      />
    </div>
  )
}
