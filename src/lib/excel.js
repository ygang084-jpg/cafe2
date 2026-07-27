import * as XLSX from 'xlsx'

// 엑셀 → 카페 배열.
// 첫 줄이 제목(이름 / 주소 / 카테고리)이라는 전제.
// 이름·주소가 비어 있는 행은 건너뛴다.
export async function parseCafeExcel(file) {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  return rows
    .map((row, i) => ({
      id: i + 1,
      name: String(row['이름'] ?? '').trim(),
      address: String(row['주소'] ?? '').trim(),
      category: String(row['카테고리'] ?? '').trim(),
    }))
    .filter((cafe) => cafe.name && cafe.address)
}
