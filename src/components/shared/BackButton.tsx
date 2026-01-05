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
      className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4 md:mb-5 w-fit"
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
      <span className="text-sm md:text-base font-medium">{label}</span>
    </Link>
  )
}
