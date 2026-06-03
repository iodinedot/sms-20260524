// ====== 💡 步驟 3：新建 studentService.js ======
import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
const COLLECTION_NAME = 'students';

/**
 * 全專案唯一的學生資料藍圖 (Schema Model)
 * 核心功能：
 * 1. 確保所有欄位都有安全的預設值，避免前端讀取到 undefined 噴錯。
 * 2. 未來若要擴充欄位（例如：生日、備註），只需在這裡加一行，全專案自動防呆。
 */
 const createStudentModel = (data = {}) => {
  return {
    chName: data.chName || '',
    enName: data.enName || '',
    campusId: data.campusId || '',
    parentName: data.parentName || '',
    parentPhone: data.parentPhone || '',
    siblingIds: Array.isArray(data.siblingIds) ? data.siblingIds : [],
  };
};

export const studentService = {
  /**
   * 1. 取得所有學生清單
   */
  async getStudents() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  
      return querySnapshot.docs.map((doc) => {
        return createStudentModel({
          id: doc.id,
          ...doc.data(),
        });
      });
    } catch (error) {
      console.error('Firebase 取得學生失敗:', error);
      throw error;
    }
  },

  /**
   * 2. 儲存學生資料 (同時支援新增與修改)
   */
  async saveStudent(studentData) {
    try {
      const cleanData = createStudentModel(studentData);
      
      // 安全機制：若沒有 id，代表是「新增學生」，在這裡生成專屬識別碼
      if (!cleanData.id) {
        cleanData.id = 's_' + Date.now().toString();
      }

      // 嚴謹防呆：確保陣列欄位存入雲端時絕對是陣列型態
      cleanData.siblingIds = Array.isArray(cleanData.siblingIds)
        ? cleanData.siblingIds
        : [];

      // 取得特定文件的參照並寫入 Firebase
      const docRef = doc(db, COLLECTION_NAME, cleanData.id);
      await setDoc(docRef, cleanData, { merge: true });

      return cleanData; // 回傳清洗後且帶有 ID 的資料
    } catch (error) {
      console.error('Firebase 儲存學生失敗:', error);
      throw error;
    }
  },

  /**
   * 3. 提供全新、乾淨的學生空物件 (提供給前端新增時初始化防呆)
   */
  getEmptyStudent() {
    return createStudentModel({
      id: ''
    });
  },

  /**
   * 3. 刪除單一學生
   */
  async deleteStudent(id) {
    try {
      if (!id) return;
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Firebase 刪除學生失敗:', error);
      throw error;
    }
  },

  /**
   * 🔥 依分校取得學生
   */
  async getStudentsByCampus(campusId) {
    if (!campusId) return [];

    const q = query(
      collection(db, 'students'),
      where('campusId', '==', campusId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};
