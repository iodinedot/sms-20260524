// adminService.js
/*const SETTINGS_KEY = 'admin_settings';

const defaultSettings = {
  // 每個分類都有固定 ID
  courseCategories: [
    { id: 'cat_01', name: '學期課程' },
    { id: 'cat_02', name: '短期營隊' },
    { id: 'cat_03', name: '社團課' }
  ],
  // 每個老師都有固定 ID
  teachers: [
    { id: 't_001', name: 'Andy' },
    { id: 't_002', name: 'Amy' },
    { id: 't_003', name: 'Wang' }
  ],
  staffs: ['行政人員A', 'Rumi', 'Jessica'],
  // 核心改動：改為物件陣列
  feeItems: [
    { name: '早鳥優惠', defaultAmount: -1000 },
    { name: '教材費', defaultAmount: 0 },
    { name: '保險費', defaultAmount: 0 }
  ]
};
*/
import { db } from "../firebase/config";
import { 
  doc, 
  getDoc,
  setDoc 
} from "firebase/firestore";

// --- 統一的行政設定資料藍圖工廠 (Model Factory) ---
export const createAdminSettingsModel = (data = {}) => {
  return {
    courseCategories: data.courseCategories || [],
    teachers: data.teachers || [],
    feeItems: data.feeItems || [],
    campuses: data.campuses || [], // 校區管理陣列藍圖
    staffs: data.staffs || [],     // 行政人員設定陣列藍圖
  };
};

export const adminService = {
  // --- 行政設定 (Settings: 包含教師、繳費項目等) ---
  // 建議將所有設定存放在 settings 集合中的 'global' 文件
  async getSettings() {
    const docRef = doc(db, "settings", "global");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // 若資料庫是空的，回傳預設結構
      return createAdminSettingsModel(docSnap.data());
    }
  },

  async saveSettings(settingsData) {
    const docRef = doc(db, "settings", "global");
    const cleanedData = createAdminSettingsModel(settingsData);
    await setDoc(docRef, cleanedData);
  }
};