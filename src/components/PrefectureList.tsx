import { prefectures, type Prefecture } from '@/data/prefectures'

export const PrefectureList = () => {
  return (
    <div>
      {prefectures.map((prefecture: Prefecture) => (
        <div key={prefecture.id}>
          {prefecture.name}
          {prefecture.region}
        </div>
      ))}
    </div>
  )
}
