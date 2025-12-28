import { Routes, Route } from 'react-router-dom'

import { PrefectureBoard } from './PrefectureBoard'
import { PrefectureHome } from './PrefectureHome'
import { RegionBoard } from './RegionBoard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PrefectureHome />} />
      <Route path="/regions/:regionId" element={<RegionBoard />} />
      <Route path="/prefectures/:prefectureId" element={<PrefectureBoard />} />
    </Routes>
  )
}

export default App
