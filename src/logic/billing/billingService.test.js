import { describe, it, expect } from 'vitest'
import { planPayment, planVoid, resolveBillingStatus, buildRequiredFeeItems } from './billingService'

const T = new Date('2026-10-21T00:00:00.000Z')

describe('planPayment', () => {
  const billing = { id: 'b1', billingStatus: 'issued', total: 1000, paidAmount: 0 }

  it('未付清 → partial', () => {
    const r = planPayment(billing, { amount: 400, method: 'cash' }, T)
    expect(r.billingStatus).toBe('partial')
    expect(r.paidAmount).toBe(400)
  })

  it('付清 → paid', () => {
    expect(planPayment(billing, { amount: 1000, method: 'cash' }, T).billingStatus).toBe('paid')
  })

  it('draft 不能收款', () => {
    expect(planPayment({ ...billing, billingStatus: 'draft' }, { amount: 1, method: 'x' }, T)).toBeNull()
  })
})

describe('planVoid', () => {
  it('已付清不可作廢', () => {
    expect(planVoid({ id: 'b', billingStatus: 'paid' })).toBeNull()
  })
})

describe('resolveBillingStatus', () => {
  it('同學生同期間 → duplicate', () => {
    const period = { start: '2026-10-01', end: '2026-10-31' }
    const billings = [{ id: 'b1', studentId: 's1', period }]
    expect(resolveBillingStatus(billings, { studentId: 's1', period }).status).toBe('duplicate')
    expect(resolveBillingStatus(billings, { studentId: 's2', period }).status).toBe('new')
  })
})

describe('buildRequiredFeeItems', () => {
  it('只取必收項目，金額轉數字', () => {
    const r = buildRequiredFeeItems([
      { id: 'f1', isRequired: true, defaultAmount: '200' },
      { id: 'f2', isRequired: false, defaultAmount: 50 }
    ])
    expect(r).toHaveLength(1)
    expect(r[0].subtotal).toBe(200)
  })
})