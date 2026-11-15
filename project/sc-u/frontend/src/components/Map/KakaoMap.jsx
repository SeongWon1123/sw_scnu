import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import FacilityPopup from './FacilityPopup'

export default function KakaoMap({ filter }) {
  const mapRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    const init = () => {
      if (!window.kakao || !window.kakao.maps) {
        setError('카카오 맵 라이브러리를 찾을 수 없습니다. (HTML 확인)')
        return
      }

      window.kakao.maps.load(() => {
        if (mapInstance.current) return
        
        try {
          const options = {
            center: new window.kakao.maps.LatLng(34.9676, 127.4797),
            level: 3
          }
          const map = new window.kakao.maps.Map(mapRef.current, options)
          mapInstance.current = map
          setIsLoaded(true)
          loadMarkers(map)
        } catch (e) {
          console.error(e)
          setError('지도 초기화 중 오류가 발생했습니다.')
        }
      })
    }

    // index.html에서 로드된 kakao 객체가 있는지 확인
    const checkKakao = setInterval(() => {
      console.log('KakaoMap: Checking window.kakao...', !!window.kakao, !!(window.kakao && window.kakao.maps));
      if (window.kakao && window.kakao.maps) {
        console.log('KakaoMap: kakao object found! Initializing...');
        clearInterval(checkKakao)
        init()
      }
    }, 500)

    // 10초 동안 로드 안 되면 에러 처리 (시간을 조금 더 늘렸습니다)
    setTimeout(() => {
      if (!isLoaded && !error) {
        console.error('KakaoMap: Load timeout reached.');
        setError('카카오 맵 로드 시간 초과 (인터넷 연결이나 키 설정을 확인하세요)')
        clearInterval(checkKakao)
      }
    }, 10000)

    return () => clearInterval(checkKakao)
  }, [])

  useEffect(() => {
    if (mapInstance.current && isLoaded) {
      loadMarkers(mapInstance.current)
    }
  }, [filter, isLoaded])

  const loadMarkers = async (map) => {
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/facilities`, {
        params: filter
      })
      res.data.forEach(f => {
        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(f.latitude, f.longitude),
          title: f.name
        })
        window.kakao.maps.event.addListener(marker, 'click', () => setSelected(f))
        markersRef.current.push(marker)
      })
    } catch (err) {
      console.error('Failed to load facilities:', err)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#f5f5f5' }}>
      {!isLoaded && !error && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
          지도를 불러오는 중...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, color: 'red', textAlign: 'center' }}>
          <strong>오류 발생</strong><br/>{error}
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', display: error ? 'none' : 'block' }} />
      {selected && <FacilityPopup facility={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
