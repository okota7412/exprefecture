/**
 * OpenStreetMap Nominatim を使った住所検索
 * 利用規約: https://operations.osmfoundation.org/policies/nominatim/
 */

import { prefectures } from '@/data/prefectures'

export type AddressCandidate = {
  displayName: string
  prefectureId: number | undefined
  cityName: string | undefined
  lat: string
  lon: string
}

type NominatimAddress = {
  state?: string
  prefecture?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  country?: string
}

type NominatimResult = {
  place_id: number
  display_name: string
  address?: NominatimAddress
  lat: string
  lon: string
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const DEBOUNCE_MS = 300

/**
 * 都道府県名から prefectureId を取得（部分一致で検索）
 */
function findPrefectureId(
  stateOrPrefecture: string | undefined
): number | undefined {
  if (!stateOrPrefecture) return undefined
  const normalized = stateOrPrefecture.trim()
  const found = prefectures.find(
    p =>
      p.name === normalized ||
      p.name.includes(normalized) ||
      normalized.includes(p.name)
  )
  return found?.id
}

/**
 * 住所部品から市区町村名を組み立て（city > town > village > municipality）
 */
function getCityName(addr: NominatimAddress | undefined): string | undefined {
  if (!addr) return undefined
  const part =
    addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county
  return part?.trim() || undefined
}

/**
 * Nominatim の address から都道府県IDと市区町村名を取得
 */
function parseAddress(address: NominatimAddress | undefined): {
  prefectureId: number | undefined
  cityName: string | undefined
} {
  if (!address) {
    return { prefectureId: undefined, cityName: undefined }
  }
  const state = address.state ?? address.prefecture
  const prefectureId = findPrefectureId(state)
  const cityName = getCityName(address)
  return { prefectureId, cityName }
}

/**
 * クエリで住所候補を検索（日本に絞るため country=Japan を付与）
 */
export async function searchAddressCandidates(
  query: string
): Promise<AddressCandidate[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const params = new URLSearchParams({
    q: `${trimmed} Japan`,
    format: 'json',
    addressdetails: '1',
    limit: '8',
  })

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'ja',
      'User-Agent': 'ExPrefecture/1.0 (Place want-to-visit registration)',
    },
  })

  if (!res.ok) return []

  const data = (await res.json()) as NominatimResult[]
  if (!Array.isArray(data)) return []

  return data.map(item => {
    const { cityName, prefectureId } = parseAddress(item.address)
    return {
      displayName: item.display_name,
      prefectureId,
      cityName,
      lat: item.lat,
      lon: item.lon,
    }
  })
}

export { DEBOUNCE_MS }
