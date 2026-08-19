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
const orgState = ref(undefined) // undefined=查詢中, null=沒邀請, {organizationId, org, invitation?}=有結果

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

// ⭐ 核心：先看「會員證」，沒有才看「邀請卡」
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
    orgState.value = null // no-invitation
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

export function useAuth() {
  const init = () => {
    if (initialized) return
    initialized = true

    unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] state changed:', firebaseUser?.email || null)
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

      console.log('[Auth] status:', status.value)
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

  // ⭐ 發會員證 + 邀請卡作廢 + org 標記完成，一次做完，確保不會半途而廢
  const completeOnboarding = async (formData) => {
    const firebaseUser = user.value
    if (!firebaseUser || !orgState.value) return

    const orgId = orgState.value.organizationId
    const invitation = orgState.value.invitation

    const batch = writeBatch(db)

    batch.set(doc(db, 'organizations', orgId), {
      ...formData,
      isSetupComplete: true,
      updatedAt: serverTimestamp()
    }, { merge: true })

    // ⭐ 發會員證：寫回 users/{uid}
    batch.set(doc(db, 'users', firebaseUser.uid), {
      organizationId: orgId
    }, { merge: true })

    // ⭐ 邀請卡作廢
    if (invitation) {
      batch.update(doc(db, 'invitations', invitation.id), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })
    }

    await batch.commit()
    await loadOrgState(firebaseUser) // 重新查一次，status 會變成 ready
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