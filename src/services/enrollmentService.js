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
  doc
} from "firebase/firestore";

const COLLECTION = "enrollments";

const createEnrollment = (data = {}) => {
  return {
    id: null,
    studentId: null,
    courseId: null,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const enrollmentService = {
  getEmptyEnrollment() {
    return createEnrollment({
      id: ''
    });
  },

  // 🔍 依學生查
  async getByStudent(studentId) {
    const q = query(
      collection(db, COLLECTION),
      where("studentId", "==", studentId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  },

  // 🔍 依課程查
  async getByCourse(courseId) {
    const q = query(
      collection(db, COLLECTION),
      where("courseId", "==", courseId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  },

  // ➕ 新增或恢復
  async create(studentId, courseId) {
    const id = `e_${studentId}_${courseId}`;
    const ref = doc(db, "enrollments", id);
  
    await setDoc(ref, {
      studentId,
      courseId,
      status: "active",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });
  
    return { id, studentId, courseId };
  },

  // ❌ 軟刪
  async remove(studentId, courseId) {
    const id = `e_${studentId}_${courseId}`;
    const ref = doc(db, "enrollments", id);
  
    await setDoc(ref, {
      status: "inactive",
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  // 🔄 課程 → 學生
  async updateCourseStudents(courseId, studentIds) {
    const current = (await this.getByCourse(courseId))
      .filter(e => e.status === "active");

    const currentSet = new Set(
      current.map(e => String(e.studentId))
    );

    const newSet = new Set(
      studentIds.map(String)
    );

    // ➕ 新增
    for (const studentId of newSet) {
      if (!currentSet.has(studentId)) {
        await this.create(studentId, courseId);
      }
    }

    // ❌ 移除
    for (const studentId of currentSet) {
      if (!newSet.has(studentId)) {
        await this.remove(studentId, courseId);
      }
    }
  },

  // 🔄 學生 → 課程（🔥 你現在用這個）
  async updateStudentCourses(studentId, courseIds) {
    const current = (await this.getByStudent(studentId))
      .filter(e => e.status === "active");

    const currentSet = new Set(
      current.map(e => String(e.courseId))
    );

    const newSet = new Set(
      courseIds.map(String)
    );

    // ➕ 新增
    for (const courseId of newSet) {
      if (!currentSet.has(courseId)) {
        await this.create(studentId, courseId);
      }
    }

    // ❌ 移除
    for (const courseId of currentSet) {
      if (!newSet.has(courseId)) {
        await this.remove(studentId, courseId);
      }
    }
  },

  async getStudentCourseCountMap(studentIds) {
    const map = {}
  
    // 🔥 初始化（避免 undefined）
    for (const id of studentIds) {
      map[id] = 0
    }
  
    // 🔥 一次抓全部 enrollment
    const snapshot = await getDocs(
      collection(db, "enrollments")
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