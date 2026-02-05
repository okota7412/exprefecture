/**
 * Google Maps Platform を使った住所・施設検索
 * - Places API (New) Text Search: 飲食店・公園・施設名などで検索
 * - Geocoding API: 住所や地名のフォールバック
 * https://developers.google.com/maps/documentation/places/web-service/text-search
 * https://developers.google.com/maps/documentation/geocoding
 */

import { prefectures } from '@/data/prefectures'

export type AddressCandidate = {
  displayName: string
  prefectureId: number | undefined
  cityName: string | undefined
  lat: string
  lon: string
}

// --- Places API (New) 用の型 ---
type PlacesAddressComponent = {
  longText?: string
  shortText?: string
  long_name?: string
  short_name?: string
  types?: string[]
}

type PlacesLocation = {
  latitude?: number
  longitude?: number
  lat?: number
  lng?: number
}

type PlacesDisplayName = {
  text?: string
}

type PlacesPlace = {
  displayName?: PlacesDisplayName | string
  formattedAddress?: string
  location?: PlacesLocation
  addressComponents?: PlacesAddressComponent[]
}

type PlacesSearchResponse = {
  places?: PlacesPlace[]
}

// --- Geocoding API 用の型（フォールバック）---
type GoogleAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GoogleGeocodeResult = {
  formatted_address: string
  address_components: GoogleAddressComponent[]
  geometry: {
    location: { lat: number; lng: number }
  }
}

type GoogleGeocodeResponse = {
  results?: GoogleGeocodeResult[]
  status: string
  error_message?: string
}

const DEBOUNCE_MS = 300
const PLACES_FIELD_MASK =
  'places.displayName,places.formattedAddress,places.location,places.addressComponents'

function getApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key || typeof key !== 'string') {
    throw new Error(
      'VITE_GOOGLE_MAPS_API_KEY is not set. Add it to your .env file.'
    )
  }
  return key
}

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
 * address_components から type に合う long 名を取得（Geocoding 用）
 */
function getGeocodingComponent(
  components: GoogleAddressComponent[],
  type: string
): string | undefined {
  const c = components.find(co => co.types.includes(type))
  return c?.long_name?.trim() || undefined
}

/**
 * address_components から type に合う long 名を取得（Places 用・longText/long_name 両対応）
 */
function getPlacesComponent(
  components: PlacesAddressComponent[] | undefined,
  type: string
): string | undefined {
  if (!components) return undefined
  const c = components.find(co => co.types?.includes(type))
  if (!c) return undefined
  const name = c.longText ?? c.long_name
  return typeof name === 'string' ? name.trim() : undefined
}

function getPlacesComponentShort(
  components: PlacesAddressComponent[] | undefined,
  type: string
): string | undefined {
  if (!components) return undefined
  const c = components.find(co => co.types?.includes(type))
  if (!c) return undefined
  const name = c.shortText ?? c.short_name
  return typeof name === 'string' ? name.trim() : undefined
}

/**
 * Geocoding の address_components から都道府県IDと市区町村名を取得
 */
function parseGeocodingAddress(components: GoogleAddressComponent[]): {
  prefectureId: number | undefined
  cityName: string | undefined
} {
  const prefectureName =
    getGeocodingComponent(components, 'administrative_area_level_1') ??
    getGeocodingComponent(components, 'administrative_area_level_2')
  const prefectureId = findPrefectureId(prefectureName)
  const cityName =
    getGeocodingComponent(components, 'locality') ??
    getGeocodingComponent(components, 'sublocality_level_1') ??
    getGeocodingComponent(components, 'sublocality') ??
    getGeocodingComponent(components, 'administrative_area_level_2')
  return { prefectureId, cityName: cityName || undefined }
}

/**
 * Places の addressComponents から都道府県IDと市区町村名を取得
 */
function parsePlacesAddress(components: PlacesAddressComponent[] | undefined): {
  prefectureId: number | undefined
  cityName: string | undefined
} {
  if (!components) return { prefectureId: undefined, cityName: undefined }
  const prefectureName =
    getPlacesComponent(components, 'administrative_area_level_1') ??
    getPlacesComponent(components, 'administrative_area_level_2')
  const prefectureId = findPrefectureId(prefectureName)
  const cityName =
    getPlacesComponent(components, 'locality') ??
    getPlacesComponent(components, 'sublocality_level_1') ??
    getPlacesComponent(components, 'sublocality') ??
    getPlacesComponent(components, 'administrative_area_level_2')
  return { prefectureId, cityName: cityName || undefined }
}

/**
 * Geocoding: address_components が日本かどうか
 */
function isGeocodingInJapan(components: GoogleAddressComponent[]): boolean {
  const countryComp = components.find(c => c.types.includes('country'))
  if (!countryComp) return true
  return countryComp.short_name === 'JP'
}

/**
 * Places: addressComponents が日本かどうか
 */
function isPlacesInJapan(
  components: PlacesAddressComponent[] | undefined
): boolean {
  if (!components) return true
  const short = getPlacesComponentShort(components, 'country')
  return short === 'JP'
}

/**
 * Places API (New) Text Search で施設・店舗・住所を検索
 */
async function searchPlaces(query: string): Promise<AddressCandidate[]> {
  const apiKey = getApiKey()
  const res = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': PLACES_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${query.trim()} 日本`,
        languageCode: 'ja',
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    console.warn('[Places] HTTP error:', res.status, errText.slice(0, 200))
    return []
  }

  const data = (await res.json()) as PlacesSearchResponse
  const places = data.places ?? []
  const japanPlaces = places.filter(p => isPlacesInJapan(p.addressComponents))
  if (japanPlaces.length === 0) return []

  return japanPlaces.slice(0, 8).map(p => {
    const { cityName, prefectureId } = parsePlacesAddress(p.addressComponents)
    const loc = p.location
    const lat = loc?.latitude ?? loc?.lat ?? 0
    const lon = loc?.longitude ?? loc?.lng ?? 0
    const displayName =
      typeof p.displayName === 'string'
        ? p.displayName
        : (p.displayName?.text ?? p.formattedAddress ?? '')
    return {
      displayName: displayName || p.formattedAddress || '',
      prefectureId,
      cityName,
      lat: String(lat),
      lon: String(lon),
    }
  })
}

/**
 * Geocoding API で住所・地名を検索（フォールバック）
 */
async function searchGeocoding(query: string): Promise<AddressCandidate[]> {
  const apiKey = getApiKey()
  const params = new URLSearchParams({
    address: query.trim(),
    region: 'jp',
    language: 'ja',
    key: apiKey,
  })

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
  )
  if (!res.ok) return []

  const data = (await res.json()) as GoogleGeocodeResponse
  if (data.status !== 'OK') return []
  const results = data.results ?? []
  const japanResults = results.filter(item =>
    isGeocodingInJapan(item.address_components)
  )
  if (japanResults.length === 0) return []

  return japanResults.slice(0, 8).map(item => {
    const { cityName, prefectureId } = parseGeocodingAddress(
      item.address_components
    )
    const loc = item.geometry.location
    return {
      displayName: item.formatted_address,
      prefectureId,
      cityName,
      lat: String(loc.lat),
      lon: String(loc.lng),
    }
  })
}

/**
 * クエリで住所・施設候補を検索
 * まず Places API（飲食店・公園・施設名に強い）で検索し、結果が少なければ Geocoding で補う
 */
export async function searchAddressCandidates(
  query: string
): Promise<AddressCandidate[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const placesResults = await searchPlaces(trimmed)
  if (placesResults.length >= 5) return placesResults

  const geocodeResults = await searchGeocoding(trimmed)
  const seen = new Set(placesResults.map(p => `${p.lat},${p.lon}`))
  const merged = [...placesResults]
  for (const g of geocodeResults) {
    if (merged.length >= 8) break
    const key = `${g.lat},${g.lon}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(g)
    }
  }
  return merged
}

export { DEBOUNCE_MS }
