import { Routes, Route, BrowserRouter } from 'react-router-dom'

import { PrefectureHome } from './PrefectureHome'
import { RegionHome } from './RegionHome'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegionHome />} />
        <Route path="/regions/:regionId" element={<PrefectureHome />} />
        <Route
          path="/prefectures/:prefectureId"
          element={<div>Prefecture Detail (TODO)</div>}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
