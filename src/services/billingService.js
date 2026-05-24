// src/services/billingService.js
import { db } from "../firebase/config";
import { collection, doc, setDoc, updateDoc, getDocs, writeBatch, query, orderBy } from 'firebase/firestore';

const COLLECTION_NAME = 'bills';

/**
 * 🎯 核心防線：全專案唯一的帳單資料藍圖 (Schema Model)
 */
 const createBillModel = (data = {}) => {
  return {
    id: data.id || '',
    studentId: data.studentId || '',
    studentChName: data.studentChName || '',
    studentEnName: data.studentEnName || '',
    parentPhone: data.parentPhone || '',
    periodType: data.periodType || 'month',
    billingPeriod: data.billingPeriod || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    items: Array.isArray(data.items) ? data.items : [],
    adjustments: Array.isArray(data.adjustments) ? data.adjustments : [],
    totalAmount: Number(data.totalAmount) || 0,
    status: data.status || 0,
    paymentMethod: data.paymentMethod || '未提供',
    paymentStatus: data.paymentStatus || 0, // 未繳費
    createdAt: data.createdAt || new Date().toISOString(),
    createdById: data.createdById || 'adm_mock_01',
    createdByName: data.createdByName || '系統管理員',
    updatedAt: data.updatedAt || new Date().toISOString(),
    updatedById: data.updatedById || 'adm_mock_01',
    updatedByName: data.updatedByName || '系統管理員'
  };
};

export const billingService = {
  /**
   * 1. 批次產生繳費單 (Batch Create)
   * @param {Object} params
   * @param {Array} params.students - 被勾選的學生完整資料清單
   * @param {Array} params.allCourses - 系統內的課程總表（用來比對選課並快照金額）
   * @param {String} params.periodType - 週期類型 ('month' | 'semester')
   * @param {String} params.billingPeriod - 期別名稱 (例如 '2026-05' 或 '2026-Spring')
   * @param {String} params.startDate - 計費起日 (例如 '2026-05-01')
   * @param {String} params.endDate - 計費迄日 (例如 '2026-05-31')
   */
  async createBatchBills({ students, allCourses, periodType, billingPeriod, startDate, endDate }) {
    try {
      // 建立 Firestore 的批次寫入器
      const batch = writeBatch(db);
      const timestamp = Date.now();
      
      // 前端先模擬一個固定的行政人員，未來可從 Auth/Session 替換
      const currentAdmin = {
        id: 'adm_mock_01',
        name: '系統管理員'
      };

      // 針對每一位被勾選的學生建立帳單
      students.forEach((student, index) => {
        // 生成唯一的繳費單 ID (加入 index 確保批次內時間戳記不重複)
        const billId = `b_${timestamp}_${index}`;
        
        // 找出該學生選修課程的詳細資料，用來建立費用清單快照
        const billItems = [];
        let subtotal = 0;

        if (student.courseIds && student.courseIds.length > 0) {
          student.courseIds.forEach(courseId => {
            const matchedCourse = allCourses.find(c => c.id === courseId);
            if (matchedCourse) {
              let originalAmount = 0;
              if (matchedCourse.billingType === 'fixed-semester' || matchedCourse.isCalculatedByTotal) {
                originalAmount = Number(matchedCourse.fixedTotalAmount) || 0;
              } else {
                originalAmount = Number(matchedCourse.unitPrice) || 0;
              }
              
              subtotal += originalAmount;
        
              billItems.push({
                courseId: matchedCourse.id,
                courseName: matchedCourse.name,
                billingType: matchedCourse.billingType || 'fixed-weekly',
                originalAmount: originalAmount
              });
            }
          });
        }

        // 不再手動刻完整物件，直接 reuse createBillModel 進行清洗與欄位同步
        const cleanBillData = createBillModel({
          id: billId,
          studentId: student.id,
          studentChName: student.chName,
          studentEnName: student.enName,
          parentPhone: student.parentPhone,
          periodType,
          billingPeriod,
          startDate,
          endDate,
          items: billItems,
          totalAmount: subtotal,
        });

        // 將這筆帳單放入批次作業中
        const docRef = doc(db, COLLECTION_NAME, billId);
        batch.set(docRef, cleanBillData);
      });

      // 正式一口氣提交到 Firebase 雲端資料庫
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Firebase 批次產生繳費單失敗:', error);
      throw error;
    }
  },

  /**
   * 2. 取得所有繳費單 (可用於 BillingView 呈現)
   */
  async getBills() {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        // ✨ 精準修改：每一筆帳單都經過 Model 補齊欄位預設值，防止歷史資料遺失欄位
        return createBillModel({
          id: doc.id,
          ...doc.data(),
        });
      });
    } catch (error) {
      console.error('Firebase 取得繳費單失敗:', error);
      throw error;
    }
  },

  /**
   * 4. 局部更新單一帳單資料
   */
  async updateBillFields(billId, updateFields) {
    try {
      if (!billId) return;
      const docRef = doc(db, COLLECTION_NAME, billId);
      
      const finalFields = {
        ...updateFields,
        updatedAt: new Date().toISOString(),
        updatedById: 'adm_mock_01',
        updatedByName: '系統管理員'
      };

      await updateDoc(docRef, finalFields);
    } catch (error) {
      console.error('Firebase 更新繳費單特定欄位失敗:', error);
      throw error;
    }
  },

  /**
   * 5. 刪除單一帳單 (配合專案規範實作軟刪除機制)
   * 說明：將 isValid 設為 false，並加上更新時間戳記，不直接實體抹除資料庫數據
   */
   async deleteBill(billId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, billId);
      const deleteFields = {
        isValid: false, // 導入系統統一的軟刪除防線
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, deleteFields, { merge: true });
      return true;
    } catch (error) {
      console.error(`Firebase 軟刪除帳單 ${billId} 失敗:`, error);
      throw error;
    }
  }
};