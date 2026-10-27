export const filterByKeyword = (list, keyword, getText) => {
  const kw = keyword?.toLowerCase() || ''
  const items = list || []
  if (!kw) return items
  return items.filter((item) =>
    String(getText(item) || '').toLowerCase().includes(kw)
  )
}