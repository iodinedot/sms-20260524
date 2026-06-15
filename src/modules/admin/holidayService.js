export async function importHolidays({ existingData, year }) {
  const targetYear = year || new Date().getFullYear()

  const url =
  'https://api.allorigins.win/raw?url=' +
  encodeURIComponent(
    'https://data.ntpc.gov.tw/api/datasets/308dcd75-6434-45bc-a95f-584da4fed251/csv?page=0&size=2000'
  )
  
  let text = ''

  try {
    const res = await fetch(url)
    text = await res.text()
  } catch (e) {
    // 🔥 fallback（用 proxy）
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      url
    )}`

    const res = await fetch(proxy)
    text = await res.text()
  }

  const rows = parseCSV(text)

  const converted = rows
    .filter(r => r.year === String(targetYear))
    .filter(r => r.isholiday === '是')
    .filter(r => r.holidaycategory !== '星期六、星期日')
    .map(r => ({
      name: r.name || r.holidaycategory,
      date: formatDate(r.date),
      type: mapType(r.holidaycategory)
    }))

  const existingDates = new Set(
    existingData.map(h => h.date)
  )

  return converted.filter(h => !existingDates.has(h.date))
}



// ===== helpers =====

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].replace(/"/g, '').split(',')

  return lines.slice(1).map(line => {
    const values =
      line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v =>
        v.replace(/"/g, '')
      ) || []

    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = values[i] || ''
    })

    return obj
  })
}

function formatDate(str) {
  return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
}

function mapType(category) {
  if (category === '補假') return 'makeup'
  if (category === '放假之紀念日及節日') return 'national'
  return 'other'
}