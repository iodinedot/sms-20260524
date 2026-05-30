import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

import {
  collection,
  doc,
  onSnapshot,
  setDoc
} from 'firebase/firestore'

import { db } from '@/firebase/config'

export function usePayments() {
  const list = ref([])

  let unsubscribe = null

  // ========================
  // realtime
  // ========================

  function subscribe() {
    if (unsubscribe) {
      unsubscribe()
    }

    unsubscribe = onSnapshot(
      collection(db, 'payments'),
      snapshot => {
        list.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
    )
  }

  function stop() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // ========================
  // query
  // ========================

  function getPaymentsByCharge(chargeId) {
    return list.value.filter(
      payment =>
        payment.chargeId === chargeId &&
        payment.status === 'active'
    )
  }

  function getPaymentSummary(charge) {
    const payments = getPaymentsByCharge(charge.id)

    const paidAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    )

    const remaining = charge.total - paidAmount

    return {
      payments,
      paidAmount,
      remaining
    }
  }

  // ========================
  // mutation
  // ========================

  async function createPayment({
    charge,
    amount,
    method,
    note = ''
  }) {
    const summary = getPaymentSummary(charge)

    if (amount <= 0) {
      throw new Error('付款金額必須大於 0')
    }

    if (amount > summary.remaining) {
      throw new Error('付款金額超過未繳金額')
    }

    const id = `pay_${uuidv4()}`

    const payment = {
      chargeId: charge.id,
      amount: Number(amount),
      method,
      note,
      status: 'active',
      createdAt: Date.now()
    }

    await setDoc(
      doc(db, 'payments', id),
      payment
    )

    return {
      id,
      ...payment
    }
  }

  async function voidPayment(payment) {
    await setDoc(
      doc(db, 'payments', payment.id),
      {
        status: 'void'
      },
      { merge: true }
    )
  }

  return {
    list,

    subscribe,
    stop,

    getPaymentsByCharge,
    getPaymentSummary,

    createPayment,
    voidPayment
  }
}