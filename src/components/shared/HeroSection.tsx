type HeroSectionProps = {
  title?: string
  description?: string
}

export const HeroSection = ({
  description = '47都道府県から、あなたの旅を管理',
  title = '旅の思い出を、ここから始める',
}: HeroSectionProps) => {
  return (
    <div className="text-center mb-4 md:mb-5">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-1.5 md:mb-2 leading-tight bg-gradient-to-r from-gray-900 via-teal-800 to-gray-900 bg-clip-text text-transparent">
        {title}
      </h1>
      {description && (
        <p className="text-xs md:text-sm text-gray-600 max-w-2xl mx-auto font-normal">
          {description}
        </p>
      )}
    </div>
  )
}
