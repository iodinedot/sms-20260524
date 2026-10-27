import { describe, it, expect } from 'vitest'
import { validateBySchema } from './validation'

describe('validateBySchema', () => {
  it('必填欄位為空 → 報錯', () => {
    const fields = { name: { label: '姓名', required: true } }
    expect(validateBySchema({ name: '' }, fields).name).toBe('姓名為必填')
    expect(validateBySchema({ name: 'A' }, fields)).toEqual({})
  })

  it('number 檢查範圍', () => {
    const fields = { age: { label: '年齡', type: 'number', min: 3, max: 18 } }
    expect(validateBySchema({ age: 1 }, fields).age).toBe('年齡需 ≥ 3')
    expect(validateBySchema({ age: 20 }, fields).age).toBe('年齡需 ≤ 18')
    expect(validateBySchema({ age: 'abc' }, fields).age).toBe('年齡需為數字')
    expect(validateBySchema({ age: 10 }, fields)).toEqual({})
  })

  it('period 開始不可晚於結束', () => {
    const fields = { p: { label: '期間', type: 'period' } }
    expect(validateBySchema({ p: { start: '2026-02-01', end: '2026-01-01' } }, fields).p)
      .toBe('期間 開始不可晚於結束')
    expect(validateBySchema({ p: { start: '2026-01-01' } }, fields).p)
      .toBe('期間 需完整填寫')
  })

  it('自訂 rules 的 min', () => {
    const fields = { qty: { label: '數量', rules: [{ type: 'min', value: 1, message: '至少 1' }] } }
    expect(validateBySchema({ qty: 0 }, fields).qty).toBe('至少 1')
  })
})