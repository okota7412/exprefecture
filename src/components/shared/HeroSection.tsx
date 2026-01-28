type HeroSectionProps = {
  title?: string
  description?: string
}

export const HeroSection = ({
  description = '47都道府県から、あなたの旅を管理',
  title = '旅の思い出を、ここから始める',
}: HeroSectionProps) => {
  // 数字を強調するためのヘルパー関数
  const formatDescription = (text: string) => {
    // 数字を強調して表示
    const parts = text.split(/(\d+)/)
    return parts.map((part, index) => {
      if (/^\d+$/.test(part)) {
        return (
          <span key={index} className="font-bold text-gray-900">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="text-center mb-4 md:mb-5">
      <h1 className="text-[28px] md:text-[32px] font-bold mb-2 md:mb-2.5 leading-tight text-gray-900">
        {title}
      </h1>
      {description && (
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto font-normal">
          {formatDescription(description)}
        </p>
      )}
    </div>
  )
}
