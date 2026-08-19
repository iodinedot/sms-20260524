import { ref, computed, watch } from 'vue'
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from 'firebase/auth'
import { auth, db } from '@/firebase/config'
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, query, where, getDocs,
  writeBatch
} from 'firebase/firestore'

// ⭐ 模組層級 singleton，全 app 共用同一份
const user = ref(null)
const isReady = ref(false)
const orgState = ref(undefined)

let unsubscribe = null
let initialized = false

const status = computed(() => {
  if (!isReady.value) return 'loading'
  if (!user.value) return 'unauthenticated'
  if (orgState.value === undefined) return 'loading'
  if (orgState.value === null) return 'no-invitation'
  if (!orgState.value.org?.isSetupComplete) return 'onboarding'
  return 'ready'
})

async function syncUser(firebaseUser) {
  await setDoc(doc(db, 'users', firebaseUser.uid), {
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    lastLoginAt: serverTimestamp()
  }, { merge: true })
}

async function getOrg(orgId) {
  const snap = await getDoc(doc(db, 'organizations', orgId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

async function checkInvitation(email) {
  const q = query(
    collection(db, 'invitations'),
    where('email', '==', email),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

async function loadOrgState(firebaseUser) {
  const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
  const existingOrgId = userSnap.exists() ? userSnap.data().organizationId : null

  if (existingOrgId) {
    const org = await getOrg(existingOrgId)
    orgState.value = { organizationId: existingOrgId, org }
    return
  }

  const invitation = await checkInvitation(firebaseUser.email)
  if (!invitation) {
    orgState.value = null
    return
  }

  const org = await getOrg(invitation.organizationId)
  orgState.value = { organizationId: invitation.organizationId, org, invitation }
}

function waitUntilResolved() {
  return new Promise((resolve) => {
    if (status.value !== 'loading') {
      resolve()
      return
    }
    const stop = watch(status, (val) => {
      if (val !== 'loading') {
        stop()
        resolve()
      }
    })
  })
}

// ⭐ 產生跟 schema idPrefix 慣例一致的 ID（camp_xxxxxxxx）
function generateId(prefix) {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}${Date.now().toString(36)}${random}`
}

export function useAuth() {
  const init = () => {
    if (initialized) return
    initialized = true

    unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser

      if (!firebaseUser) {
        orgState.value = undefined
        isReady.value = true
        return
      }

      orgState.value = undefined
      await syncUser(firebaseUser)
      await loadOrgState(firebaseUser)
      isReady.value = true
    })
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  const logout = async () => {
    await signOut(auth)
  }

  // ⭐ 發會員證 + 邀請卡作廢 + org 標記完成 + 建立第一個（主）校區
  const completeOnboarding = async (formData) => {
    const firebaseUser = user.value
    if (!firebaseUser || !orgState.value) return

    const orgId = orgState.value.organizationId
    const invitation = orgState.value.invitation

    const batch = writeBatch(db)

    // 1. org 標記完成
    batch.set(doc(db, 'organizations', orgId), {
      ...formData,
      isSetupComplete: true,
      updatedAt: serverTimestamp()
    }, { merge: true })

    // 2. 發會員證
    batch.set(doc(db, 'users', firebaseUser.uid), {
      organizationId: orgId
    }, { merge: true })

    // 3. 邀請卡作廢
    if (invitation) {
      batch.update(doc(db, 'invitations', invitation.id), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })
    }

    // 4. ⭐ 建立第一個校區，並設為主校區
    const campusId = generateId('camp_')
    batch.set(doc(db, 'organizations', orgId, 'campuses', campusId), {
      name: formData.name,
      address: formData.address || '',
      phone: formData.phone || '',
      isMain: true,
      dataStatus: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    await batch.commit()
    await loadOrgState(firebaseUser)
  }

  const stop = () => {
    if (unsubscribe) unsubscribe()
    initialized = false
  }

  return {
    user,
    orgState,
    isReady,
    status,
    init,
    stop,
    loginWithGoogle,
    logout,
    completeOnboarding,
    waitUntilResolved
  }
}