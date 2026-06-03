// services/enrollmentService.js
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  setDoc,
  query,
  where,
  updateDoc,
  doc,
  writeBatch
} from "firebase/firestore";

const COLLECTION = "enrollments";

const createEnrollment = (data = {}) => {
  const now = new Date().toISOString()

  return {
    studentId: data.studentId ?? null,
    courseId: data.courseId ?? null,
    status: data.status ?? "active",
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now
  }
}

export const enrollmentService = {
  getEmptyEnrollment() {
    return createEnrollment()
  },

  // 🔥 取得某課程所有 enrollment
  async getByCourse(courseId) {
    const q = query(
      collection(db, COLLECTION),
      where('courseId', '==', courseId),
      where('status', '==', 'active')
    )

    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  // 🔥 取得某學生所有 enrollment
  async getByStudent(studentId) {
    const q = query(
      collection(db, COLLECTION),
      where('studentId', '==', studentId),
      where('status', '==', 'active')
    )

    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  // 🔥 更新「課程 → 學生」
  async updateCourseStudents(courseId, studentIds) {
    const current = await this.getByCourse(courseId)
    const currentSet = new Set(current.map(e => e.studentId))
    const newSet = new Set(studentIds)

    const batch = writeBatch(db)

    // ➖ 移除
    current.forEach(e => {
      if (!newSet.has(e.studentId)) {
        if (!e.id) return  // 🔥 防爆
    
        batch.delete(doc(db, COLLECTION, e.id))
      }
    })

    // ➕ 新增
    studentIds.forEach(studentId => {
      if (!currentSet.has(studentId)) {
        const ref = doc(collection(db, COLLECTION))
        const e = createEnrollment({
          studentId,
          courseId
        })

        batch.set(ref, e)
      }
    })

    await batch.commit()
  },

  // 🔥 更新「學生 → 課程」
  async updateStudentCourses(studentId, courseIds) {
    const current = await this.getByStudent(studentId)
    const currentSet = new Set(current.map(e => e.courseId))
    const newSet = new Set(courseIds)

    const batch = writeBatch(db)

    // ➖ 移除
    current.forEach(e => {
      current.forEach(e => {
        if (!newSet.has(e.studentId)) {
          if (!e.id) return  // 🔥 防爆
      
          batch.delete(doc(db, COLLECTION, e.id))
        }
      })
    })

    // ➕ 新增
    courseIds.forEach(courseId => {
      if (!currentSet.has(courseId)) {
        const ref = doc(collection(db, COLLECTION))
        const e = createEnrollment({
          studentId,
          courseId
        })

        batch.set(ref, e)
      }
    })

    await batch.commit()
  },

  async getStudentCourseCountMap(studentIds) {
    const map = {}
  
    // 🔥 初始化（避免 undefined）
    for (const id of studentIds) {
      map[id] = 0
    }
  
    // 🔥 一次抓全部 enrollment
    const snapshot = await getDocs(
      collection(db, COLLECTION)
    )
  
    snapshot.forEach(docSnap => {
      const e = docSnap.data()
  
      // 🔥 只算 active
      if (e.status !== "active") return
  
      const sid = String(e.studentId)
  
      // 🔥 只統計目前畫面的學生
      if (map[sid] !== undefined) {
        map[sid]++
      }
    })
  
    return map
  }
};