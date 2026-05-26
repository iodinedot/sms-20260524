// src/services/courseService.js
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment, // 🔥 新增
  query,
  where,
} from 'firebase/firestore';

/**
 * 🎯 核心防線：全專案唯一的課程資料藍圖 (Schema Model)
 * 核心功能：
 * 1. 確保所有欄位都有安全的預設值，避免前端讀取到 undefined。
 * 2. 以後要新增、刪除或修改欄位，「只需要在這裡改一行」，全專案自動同步。
 */
const createCourseModel = (data = {}) => {
  return {
    id: data.id || '',
    name: data.name || '',
    campusId: data.campusId || '',
    billingType: data.billingType || 'fixed-weekly',
    description: data.description || '',
    maxStudents: Number(data.maxStudents) || 10,
    teacherId: data.teacherId || '',
    unitPrice: Number(data.unitPrice) || 0,
    isCalculatedByTotal: !!data.isCalculatedByTotal,
    fixedTotalAmount: Number(data.fixedTotalAmount) || 0,
    schedules: Array.isArray(data.schedules) ? data.schedules : [],
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    weeklyRates: Array.isArray(data.weeklyRates) ? data.weeklyRates : [],
    isValid: data.isValid !== false,
  };
};

export const courseService = {
  /**
   * 💡 取得空白課程物件
   * 現在直接呼叫藍圖，完全不重複撰寫欄位
   */
  getEmptyCourse() {
    return createCourseModel();
  },

  /**
   * 1. 讀取管線 (Fetch)
   */
  async getCourses() {
    try {
      const querySnapshot = await getDocs(collection(db, 'courses'));

      const allCourses = querySnapshot.docs.map((doc) => {
        // 將 Firestore 的資料帶入藍圖，自動補齊所有預設值與 isValid: true
        return createCourseModel({
          id: doc.id,
          ...doc.data(),
        });
      });

      // 🔥 關鍵過濾：回傳時只給前端「有效的」課程
      return allCourses.filter((course) => course.isValid);
    } catch (error) {
      console.error('courseService.getCourses 發生錯誤:', error);
      throw error;
    }
  },

  /**
   * 1b. 讀取所有課程（包含已軟刪除的歷史紀錄）
   * 專門提供給學生管理、帳單管理比對歷史資料使用
   */
   async getAllCoursesWithDeleted() {
    try {
      const querySnapshot = await getDocs(collection(db, 'courses'));
      return querySnapshot.docs.map((doc) => {
        return createCourseModel({
          id: doc.id,
          ...doc.data(),
        });
      });
      // 💡 這裡「不」進行 .filter(course.isValid) 過濾，保留完整歷史
    } catch (error) {
      console.error('courseService.getAllCoursesWithDeleted 發生錯誤:', error);
      throw error;
    }
  },

  /** * 2. 刪除管線 (Delete)
   * 不直接從 Firebase 移除文件，而是將 isValid 設為 false
   */
  async deleteCourse(courseId) {
    if (!courseId) throw new Error('刪除失敗：未提供課程識別碼(courseId)');
    try {
      const docRef = doc(db, 'courses', courseId);
      await updateDoc(docRef, {
        isValid: false,
      });
      console.log(`課程 ${courseId} 已軟刪除`);
    } catch (error) {
      console.error('courseService.deleteCourse 發生錯誤:', error);
      throw error;
    }
  },

  /**
   * 3. 新增與修改管線 (Save/Update)
   */
  async saveCourse(courseData) {
    try {
      // 透過藍圖過濾與補齊欄位，確保存入雲端的資料結構絕對乾淨
      const cleanData = createCourseModel(courseData);

      // 安全機制：若沒有 id，代表是「新增課程」，在前端這裡生成專屬識別碼
      if (
        !cleanData.id ||
        cleanData.id === 'undefined' ||
        String(cleanData.id).trim() === ''
      ) {
        cleanData.id = 'c_' + Date.now().toString();
      }

      // 取得特定文件的參照並寫入 Firebase
      const docRef = doc(db, 'courses', cleanData.id);
      await setDoc(docRef, cleanData, { merge: true });

      return cleanData;
    } catch (error) {
      console.error('courseService.saveCourse 發生錯誤:', error);
      throw error;
    }
  },
  
  async getCoursesByCampus(campusId) {
    const courses = await this.getCourses()
  
    // 🔥 防呆（很重要）
    if (!campusId) {
      console.warn('getCoursesByCampus: campusId is missing')
      return courses // fallback（避免畫面空白）
    }
  
    return courses.filter(c => c.campusId === campusId)
  }
};
