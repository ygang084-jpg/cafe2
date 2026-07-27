// 실제 연동(엑셀 파싱 + 지오코딩) 전 임시 가짜 데이터.
// 나중에 handleExcelUpload → geocodeAddress 결과 배열로 교체된다.
// lat/lng는 지금은 하드코딩이지만, 실제로는 주소를 좌표로 변환해 채운다.

export const SEOUL_CITY_HALL = { lat: 37.5663, lng: 126.9779 }

export const MOCK_CAFES = [
  {
    id: 1,
    name: '시청 앞 로스터스',
    address: '서울 중구 세종대로 110',
    category: '로스터리',
    lat: 37.5658,
    lng: 126.9766,
    visited: true,
    memo: '핸드드립이 훌륭했음. 자리도 넓다.',
  },
  {
    id: 2,
    name: '덕수궁 돌담 카페',
    address: '서울 중구 세종대로19길 24',
    category: '디저트',
    lat: 37.5651,
    lng: 126.9749,
    visited: false,
    memo: '',
  },
  {
    id: 3,
    name: '무교동 북카페',
    address: '서울 중구 무교로 6',
    category: '북카페',
    lat: 37.5688,
    lng: 126.9781,
    visited: true,
    memo: '조용해서 작업하기 좋음.',
  },
  {
    id: 4,
    name: '을지로 골목 커피',
    address: '서울 중구 을지로 19',
    category: '에스프레소바',
    lat: 37.5664,
    lng: 126.9832,
    visited: false,
    memo: '',
  },
]
