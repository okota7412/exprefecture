import { Routes, Route, BrowserRouter } from 'react-router-dom'

import { LoginPage } from './auth/LoginPage'
import { SignupPage } from './auth/SignupPage'
import { PrefectureHome } from './PrefectureHome'
import { RegionHome } from './RegionHome'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 認証ページ */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* 既存のページ */}
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
