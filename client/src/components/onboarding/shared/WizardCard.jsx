import Card from '../../ui/Card'

const SHELL =
  'flex flex-col gap-4 p-6 w-full max-w-md sm:max-w-[820px] mx-auto rounded-md shadow-warm-md flex-1 min-h-0 sm:flex-none sm:h-[600px] h-[540px] text-center'

export default function WizardCard({ children }) {
  return <Card className={SHELL}>{children}</Card>
}
