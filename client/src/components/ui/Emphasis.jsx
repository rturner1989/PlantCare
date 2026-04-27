const VARIANTS = {
  // Green axis (forest → emerald → leaf). Default — used inside headings
  // on light surfaces (auth-body card, future page hero).
  brand: 'bg-[image:var(--gradient-display)]',
  // Cream → sunshine. For headings on dark backdrops where the green
  // gradient lacks contrast (e.g. forest marketing column).
  sunshine: 'bg-[image:var(--gradient-sunshine)]',
}

export default function Emphasis({ variant = 'brand', className = '', children }) {
  const variantClasses = VARIANTS[variant] ?? VARIANTS.brand
  return (
    <em className={`font-display italic bg-clip-text text-transparent ${variantClasses} ${className}`}>{children}</em>
  )
}
