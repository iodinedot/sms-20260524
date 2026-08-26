// adminService.js
import { db } from "@/firebase/config";
import { 
  doc, 
  getDoc,
  setDoc 
} from "firebase/firestore";

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
    console.log("[adminService] saveSettings")
    const docRef = doc(db, "settings", "global");
    const cleanedData = createAdminSettingsModel(settingsData);
    await setDoc(docRef, cleanedData);
  },
};