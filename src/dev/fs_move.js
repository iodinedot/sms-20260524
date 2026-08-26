import { collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

const ORG_ID = 'HAfhVOsXK9p1J9MZJiFg'
const TARGET_CAMPUS_ID = 'camp_mszprbrxol4e8bdx' // ← 改這個

export async function migrateCampus() {
  console.log('🚀 Start migrating enrollments...')

  // 1️⃣ 讀舊資料
  const oldRef = collection(db, 'organizations', ORG_ID, 'enrollments')
  const snapshot = await getDocs(oldRef)

  console.log(`Found ${snapshot.size} enrollments`)

  // 2️⃣ 寫到新位置
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data()
    const id = docSnap.id

    const newRef = doc(
      db,
      'organizations',
      ORG_ID,
      'campuses',
      TARGET_CAMPUS_ID,
      'enrollments',
      id
    )

    await setDoc(newRef, {
      ...data,
      campusId: TARGET_CAMPUS_ID // 👉 強制補上
    })

    console.log(`✅ migrated: ${id}`)
  }

  console.log('🎉 Migration done')
}