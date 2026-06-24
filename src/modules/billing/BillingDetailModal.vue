<script setup>
import { computed } from 'vue'
import { getBillingTypeLabel } from '@/constants/options'

const props = defineProps({
  isOpen: Boolean,
  billing: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:isOpen'])

const statusMap = {
  draft: { label: '草稿', className: 'status-draft' },
  issued: { label: '已開單', className: 'status-issued' },
  partial: { label: '部分付款', className: 'status-partial' },
  paid: { label: '已繳清', className: 'status-paid' },
  unpaid: { label: '未繳費', className: 'status-unpaid' },
  void: { label: '作廢', className: 'status-void' }
}

const paymentMethodMap = {
  cash: '現金',
  transfer: '轉帳',
  credit_card: '信用卡'
}

const printCopies = [
  { key: 'student', label: '學生收執聯' },
  { key: 'school', label: '校方留存聯' }
]

const bill = computed(() => props.billing || {})

const courseRows = computed(() => {
  return (bill.value.courseItems || []).map((item) => ({
    ...item,
    rowType: 'course',
    amount: Number(item.subtotal ?? 0)
  }))
})

const feeRows = computed(() => {
  return (bill.value.feeItems || []).map((item) => ({
    ...item,
    rowType: 'fee',
    teacherName: '-',
    billingType: '-',
    lessonCount: '-',
    unitPrice: item.amount ?? item.unitPrice ?? 0,
    amount: Number(item.subtotal ?? item.amount ?? 0)
  }))
})

const payments = computed(() => bill.value.payments || [])
const total = computed(() => Number(bill.value.total || 0))
const paidAmount = computed(() => Number(bill.value.paidAmount || 0))
const balance = computed(() => total.value - paidAmount.value)

const statusDisplay = computed(() => {
  return statusMap[bill.value.status] || {
    label: bill.value.status || '未設定',
    className: 'status-default'
  }
})

const periodText = computed(() => {
  const period = bill.value.period || {}

  if (period.label) return period.label
  if (period.start && period.end) return `${formatDateOnly(period.start)} ~ ${formatDateOnly(period.end)}`
  return '-'
})

const academyInfo = computed(() => {
  return {
    name: bill.value.academyName || bill.value.schoolName || '補習班資訊',
    address: bill.value.academyAddress || bill.value.schoolAddress || '地址：',
    phone: bill.value.academyPhone || bill.value.schoolPhone || '電話：',
    taxId: bill.value.taxId || bill.value.uniformNumber || ''
  }
})

function closeModal() {
  emit('update:isOpen', false)
}

function printBill() {
  window.print()
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('zh-TW')}`
}

function formatDateTime(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

function formatDateOnly(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
}

function formatBillingType(value) {
  return getBillingTypeLabel(value) || value || '-'
}

function formatPaymentMethod(value) {
  return paymentMethodMap[value] || value || '-'
}

function toTaiwanDollarText(value) {
  const amount = Math.round(Math.abs(Number(value || 0)))
  if (amount === 0) return '新台幣 零元整'

  return `新台幣 ${convertIntegerToChinese(amount)}元整`
}

function convertIntegerToChinese(value) {
  const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟']
  const sectionUnits = ['', '萬', '億', '兆']
  const sections = []
  let number = value

  while (number > 0) {
    sections.push(number % 10000)
    number = Math.floor(number / 10000)
  }

  let result = ''

  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i]

    if (section === 0) {
      continue
    }

    if (result && section < 1000) {
      result += digits[0]
    }

    result += convertSection(section, digits, units) + sectionUnits[i]
  }

  return result.replace(/零+/g, '零').replace(/零$/g, '')
}

function convertSection(section, digits, units) {
  let result = ''
  let needZero = false

  for (let i = 3; i >= 0; i -= 1) {
    const unitValue = 10 ** i
    const digit = Math.floor(section / unitValue)
    section %= unitValue

    if (digit === 0) {
      needZero = result !== ''
      continue
    }

    if (needZero) {
      result += digits[0]
      needZero = false
    }

    result += digits[digit] + units[i]
  }

  return result
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <div class="modal-header no-print">
        <h3>帳單詳細</h3>
        <div class="modal-actions">
          <button type="button" class="print-button" @click="printBill">列印繳費單</button>
          <button type="button" class="close-x" aria-label="關閉" @click="closeModal">×</button>
        </div>
      </div>

      <div class="modal-body">
        <section class="print-sheet" aria-label="繳費單">
          <article v-for="copy in printCopies" :key="copy.key" class="bill-copy">
            <header class="bill-title-row">
              <div>
                <p class="bill-kicker">補習班繳費單</p>
                <h2>{{ academyInfo.name }}</h2>
              </div>
              <div class="copy-label">{{ copy.label }}</div>
            </header>

            <section class="bill-info-grid">
              <div>
                <span>收據編號</span>
                <strong>{{ bill.receiptNumber || '-' }}</strong>
              </div>
              <div>
                <span>學生姓名</span>
                <strong>{{ bill.studentName || '-' }}</strong>
              </div>
              <div>
                <span>計費期間</span>
                <strong>{{ periodText }}</strong>
              </div>
              <div>
                <span>發單日期</span>
                <strong>{{ formatDateTime(bill.issuedDate) }}</strong>
              </div>
              <div>
                <span>帳單狀態</span>
                <strong>
                  <span class="status-badge" :class="statusDisplay.className">
                    {{ statusDisplay.label }}
                  </span>
                </strong>
              </div>
            </section>

            <table class="items-table">
              <thead>
                <tr>
                  <th>項目名稱</th>
                  <th>授課老師</th>
                  <th>計費方式</th>
                  <th class="number-cell">數量/堂數</th>
                  <th class="number-cell">單價</th>
                  <th class="number-cell">小計</th>
                </tr>
              </thead>
              <tbody>
                <tr class="section-row">
                  <td colspan="6">課程費用</td>
                </tr>
                <template v-if="courseRows.length">
                  <template v-for="item in courseRows" :key="`course-${item.courseId || item.name}`">
                    <tr>
                      <td>
                        {{ item.name || '-' }}
                        <span v-if="item.isManuallyAdjusted" class="adjusted-tag">改</span>
                      </td>
                      <td>{{ item.teacherName || '-' }}</td>
                      <td>{{ formatBillingType(item.billingType) }}</td>
                      <td class="number-cell">{{ item.lessonCount ?? '-' }}</td>
                      <td class="number-cell">{{ formatCurrency(item.unitPrice) }}</td>
                      <td class="number-cell">{{ formatCurrency(item.subtotal) }}</td>
                    </tr>
                    <tr v-if="item.note" class="note-row">
                      <td colspan="6">備註：{{ item.note }}</td>
                    </tr>
                  </template>
                </template>
                <tr v-else class="empty-row">
                  <td colspan="6">無課程費用</td>
                </tr>

                <tr class="section-row">
                  <td colspan="6">其他費用</td>
                </tr>
                <template v-if="feeRows.length">
                  <template v-for="item in feeRows" :key="`fee-${item.feeItemId || item.name}`">
                    <tr>
                      <td>
                        {{ item.name || '-' }}
                        <span v-if="item.isManuallyAdjusted" class="adjusted-tag">改</span>
                      </td>
                      <td>-</td>
                      <td>-</td>
                      <td class="number-cell">-</td>
                      <td class="number-cell">{{ formatCurrency(item.unitPrice) }}</td>
                      <td class="number-cell">{{ formatCurrency(item.amount) }}</td>
                    </tr>
                    <tr v-if="item.note" class="note-row">
                      <td colspan="6">備註：{{ item.note }}</td>
                    </tr>
                  </template>
                </template>
                <tr v-else class="empty-row">
                  <td colspan="6">無其他費用</td>
                </tr>
              </tbody>
            </table>

            <section class="bill-bottom">
              <div class="payment-history">
                <h4>付款歷史</h4>
                <table>
                  <thead>
                    <tr>
                      <th>付款日期</th>
                      <th>付款方式</th>
                      <th class="number-cell">實收金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(payment, index) in payments" :key="`payment-${index}`">
                      <td>{{ formatDateTime(payment.date) }}</td>
                      <td>{{ formatPaymentMethod(payment.method) }}</td>
                      <td class="number-cell">{{ formatCurrency(payment.amount) }}</td>
                    </tr>
                    <tr v-if="!payments.length" class="empty-row">
                      <td colspan="3">尚無付款紀錄</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <dl class="summary-list">
                <div>
                  <dt>應收總金額</dt>
                  <dd>{{ formatCurrency(total) }}</dd>
                </div>
                <div>
                  <dt>實收總金額</dt>
                  <dd>{{ formatCurrency(paidAmount) }}</dd>
                </div>
                <div>
                  <dt>本期尾款餘額</dt>
                  <dd>{{ formatCurrency(balance) }}</dd>
                </div>
                <div class="uppercase-amount">
                  <dt>實收金額大寫</dt>
                  <dd>{{ toTaiwanDollarText(paidAmount) }}</dd>
                </div>
              </dl>
            </section>

            <p v-if="bill.note" class="bill-note">帳單備註：{{ bill.note }}</p>

            <footer class="academy-footer">
              <span>{{ academyInfo.name }}</span>
              <span>{{ academyInfo.address }}</span>
              <span>{{ academyInfo.phone }}</span>
              <span v-if="academyInfo.taxId">統編：{{ academyInfo.taxId }}</span>
            </footer>
          </article>
        </section>
      </div>

      <div class="modal-footer no-print">
        <button type="button" @click="closeModal">關閉</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay,
.modal-overlay * {
  box-sizing: border-box;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(20, 24, 33, 0.58);
}

.modal {
  width: min(1040px, 100%);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f6f7f9;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.24);
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: #ffffff;
  border-bottom: 1px solid #d9dde5;
}

.modal-footer {
  justify-content: flex-end;
  border-top: 1px solid #d9dde5;
  border-bottom: 0;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-button,
.modal-footer button,
.close-x {
  min-height: 36px;
  border: 1px solid #b8c1d1;
  border-radius: 6px;
  background: #ffffff;
  color: #1f2937;
  font: inherit;
  cursor: pointer;
}

.print-button {
  padding: 0 14px;
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  font-weight: 700;
}

.close-x {
  width: 36px;
  font-size: 22px;
  line-height: 1;
}

.modal-footer button {
  padding: 0 16px;
}

.modal-body {
  overflow: auto;
  padding: 18px;
}

.print-sheet {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 10mm;
  background: #ffffff;
  color: #111827;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
}

.bill-copy {
  height: calc((297mm - 20mm) / 2);
  display: flex;
  flex-direction: column;
  padding: 5mm 0;
  border-bottom: 1px dashed #9ca3af;
  overflow: hidden;
}

.bill-copy:last-child {
  border-bottom: 0;
}

.bill-title-row,
.bill-bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.bill-title-row {
  align-items: flex-start;
  margin-bottom: 8px;
}

.bill-kicker {
  margin: 0 0 2px;
  color: #4b5563;
  font-size: 12px;
}

.bill-title-row h2 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  letter-spacing: 0;
}

.copy-label {
  padding: 4px 10px;
  border: 1px solid #111827;
  border-radius: 4px;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.bill-info-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
}

.bill-info-grid div {
  min-width: 0;
}

.bill-info-grid span {
  display: block;
  margin-bottom: 2px;
  color: #6b7280;
  font-size: 11px;
}

.bill-info-grid strong {
  display: block;
  color: #111827;
  font-size: 12px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-paid {
  background: #dcfce7;
  color: #166534;
}

.status-unpaid,
.status-void {
  background: #fee2e2;
  color: #991b1b;
}

.status-partial,
.status-issued {
  background: #fef3c7;
  color: #92400e;
}

.status-draft,
.status-default {
  background: #e5e7eb;
  color: #374151;
}

.items-table,
.payment-history table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 11px;
}

.items-table th,
.items-table td,
.payment-history th,
.payment-history td {
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.items-table th,
.payment-history th {
  background: #eef2f7;
  color: #1f2937;
  font-weight: 700;
  text-align: left;
}

.items-table th:nth-child(1) {
  width: 28%;
}

.items-table th:nth-child(2) {
  width: 14%;
}

.items-table th:nth-child(3) {
  width: 17%;
}

.items-table th:nth-child(4) {
  width: 13%;
}

.items-table th:nth-child(5),
.items-table th:nth-child(6) {
  width: 14%;
}

.section-row td {
  background: #e8edf5;
  color: #111827;
  font-weight: 700;
}

.note-row td,
.empty-row td {
  color: #4b5563;
  background: #fbfdff;
}

.adjusted-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  min-height: 18px;
  margin-left: 4px;
  border-radius: 50%;
  background: #f97316;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

.number-cell {
  text-align: right;
  white-space: nowrap;
}

.bill-bottom {
  align-items: flex-start;
  margin-top: 8px;
}

.payment-history {
  flex: 1 1 auto;
  min-width: 0;
}

.payment-history h4 {
  margin: 0 0 4px;
  color: #111827;
  font-size: 12px;
}

.summary-list {
  width: 250px;
  flex: 0 0 250px;
  margin: 0;
  border: 1px solid #d1d5db;
  font-size: 12px;
}

.summary-list div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 5px 8px;
  border-bottom: 1px solid #d1d5db;
}

.summary-list div:last-child {
  border-bottom: 0;
}

.summary-list dt,
.summary-list dd {
  margin: 0;
}

.summary-list dt {
  color: #4b5563;
}

.summary-list dd {
  color: #111827;
  font-weight: 700;
  text-align: right;
}

.summary-list .uppercase-amount {
  display: block;
  background: #f9fafb;
}

.summary-list .uppercase-amount dd {
  margin-top: 3px;
  text-align: left;
}

.bill-note {
  margin: 6px 0 0;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 11px;
}

.academy-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: auto;
  padding-top: 6px;
  color: #4b5563;
  font-size: 10px;
}

@media (max-width: 860px) {
  .modal-overlay {
    align-items: flex-start;
    padding: 0;
  }

  .modal {
    min-height: 100vh;
    border-radius: 0;
  }

  .print-sheet {
    width: 100%;
    min-height: auto;
    padding: 12px;
  }

  .bill-copy {
    height: auto;
    min-height: 0;
  }

  .bill-info-grid,
  .bill-bottom {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .summary-list {
    width: 100%;
    flex-basis: auto;
  }
}

@page {
  size: A4 portrait;
  margin: 10mm;
}

@media print {
  :global(body) {
    margin: 0;
    background: #ffffff;
  }

  :global(body *) {
    visibility: hidden;
  }

  .modal-overlay,
  .modal-overlay * {
    visibility: visible;
  }

  .no-print {
    display: none !important;
  }

  .modal-overlay {
    position: absolute;
    inset: 0;
    display: block;
    padding: 0;
    background: transparent;
  }

  .modal {
    width: auto;
    max-height: none;
    display: block;
    overflow: visible;
    border-radius: 0;
    box-shadow: none;
    background: #ffffff;
  }

  .modal-body {
    overflow: visible;
    padding: 0;
  }

  .print-sheet {
    width: auto;
    min-height: auto;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .bill-copy {
    height: calc((297mm - 20mm) / 2);
    padding: 0 0 5mm;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .bill-copy + .bill-copy {
    padding-top: 5mm;
  }
}
</style>
