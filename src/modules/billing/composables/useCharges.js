import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  runTransaction
} from 'firebase/firestore'

import { db } from '@/firebase/config'

export function useCharges() {
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
      collection(db, 'charges'),
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
  // create
  // ========================

  async function createDraft({
    studentId,
    studentSnapshot,
    courses = [],
    items = [],
    dueDate = null,
    createdBy = ''
  }) {
    const id = `chg_${uuidv4()}`

    const total = items.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0
    )

    const charge = {
      studentId,

      studentSnapshot,

      courses,

      items,

      total,

      status: 'draft',

      dueDate,

      createdBy,

      createdAt: Date.now(),

      issuedAt: null,

      invoiceNo: null
    }

    await setDoc(
      doc(db, 'charges', id),
      charge
    )

    return {
      id,
      ...charge
    }
  }

  // ========================
  // update
  // ========================

  async function updateDraft(charge) {
    if (charge.status !== 'draft') {
      throw new Error('只有 draft 可修改')
    }

    const total = charge.items.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0
    )

    await setDoc(
      doc(db, 'charges', charge.id),
      {
        ...charge,
        total
      },
      { merge: true }
    )
  }

  // ========================
  // issue
  // ========================
 
  async function generateInvoiceNo() {
    const currentYear = new Date().getFullYear()
  
    const counterRef = doc(
      db,
      'counters',
      'invoice'
    )
  
    return await runTransaction(
      db,
      async transaction => {
        const counterDoc =
          await transaction.get(counterRef)
  
        const current =
          counterDoc.data()?.current || 0
  
        const next = current + 1
  
        transaction.update(counterRef, {
          current: next
        })
  
        return `${currentYear}-${String(next).padStart(
          4,
          '0'
        )}`
      }
    )
  }

  async function issueCharge(charge) {
    if (charge.status !== 'draft') {
      throw new Error('只有 draft 可開立')
    }
  
    const invoiceNo =
      await generateInvoiceNo()
  
    await setDoc(
      doc(db, 'charges', charge.id),
      {
        status: 'issued',
  
        invoiceNo,
  
        issuedAt: Date.now()
      },
      { merge: true }
    )
  
    return invoiceNo
  }

  async function replaceCharge(charge) {
    if (charge.status === 'draft') {
      throw new Error('draft 不需要 replace')
    }
  
    const newId = `chg_${uuidv4()}`
  
    const newCharge = {
      ...charge,
      invoiceNo: null,  
      status: 'draft',
      issuedAt: null,
      replaces: charge.id,
      replacedBy: null
    }
  
    delete newCharge.id
  
    await setDoc(
      doc(db, 'charges', newId),
      newCharge
    )
  
    await setDoc(
      doc(db, 'charges', charge.id),
      {
        status: 'replaced',
        replacedBy: newId
      },
      { merge: true }
    )
  
    return {
      id: newId,
      ...newCharge
    }
  }

  // ========================
  // get status
  // ========================
  function getStatus(charge) {
    if (charge.status === 'draft') {
      return 'draft'
    }
  
    const paidAmount = getPaidAmount(charge.id)
  
    if (paidAmount <= 0) {
      return 'issued'
    }
  
    if (paidAmount < charge.total) {
      return 'partial'
    }
  
    return 'paid'
  }

  function getPaidAmount(chargeId) {
    return payments.list.value
      .filter(
        p =>
          p.chargeId === chargeId &&
          p.status === 'active'
      )
      .reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      )
  }

  function getRemaining(charge) {
    return charge.total - getPaidAmount(charge.id)
  }

  // ========================
  // sync status
  // ========================
  async function syncStatus(charge) {
    const status = getStatus(charge)
  
    if (status === charge.status) {
      return
    }
  
    await setDoc(
      doc(db, 'charges', charge.id),
      {
        status
      },
      { merge: true }
    )
  }

  return {
    list,
  
    subscribe,
    stop,
  
    createDraft,
    updateDraft,
  
    generateInvoiceNo,
    issueCharge,
    replaceCharge,
  
    getPaidAmount,
    getRemaining,
    getStatus,
  
    syncStatus
  }
}