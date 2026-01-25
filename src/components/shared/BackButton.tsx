import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

type BackButtonProps = {
  to: string
  label: string
}

export const BackButton = ({ label, to }: BackButtonProps) => {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-gray-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 mb-4 md:mb-5 w-fit border border-transparent hover:border-teal-200"
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
      <span className="text-sm md:text-base font-medium">{label}</span>
    </Link>
  )
}
