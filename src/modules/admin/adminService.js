// adminService.js
import { db } from "@/firebase/config";
import { 
  doc, 
  getDoc,
  setDoc 
} from "firebase/firestore";

// --- 統一的行政設定資料藍圖工廠 (Model Factory) ---
/*
export const createAdminSettingsModel = (data = {}) => {
  return {
    courseCategories: data.courseCategories || [],
    teachers: data.teachers || [],
    feeItems: data.feeItems || [],
    campuses: data.campuses || [], // 校區管理陣列藍圖
    staffs: data.staffs || [],     // 行政人員設定陣列藍圖
  };
};*/

export const adminService = {

  async getSettings() {
    const docRef = doc(db, "settings", "global");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return createAdminSettingsModel({});
    }
  },

  async saveSettings(settingsData) {
    const docRef = doc(db, "settings", "global");
    const cleanedData = createAdminSettingsModel(settingsData);
    await setDoc(docRef, cleanedData);
  },
};