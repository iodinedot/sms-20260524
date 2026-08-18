import { ref } from 'vue'
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from 'firebase/auth'

import { auth } from '@/firebase/config'
import { db } from '@/firebase/config'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { collection, query, where, getDocs } from 'firebase/firestore'

export function useAuth(router) {

  const user = ref(null)
  const isLoading = ref(true)
  const orgState = ref(null)

  let unsubscribe = null

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  const logout = () => signOut(auth)

  const syncUser = async (firebaseUser) => {
    const ref = doc(db, 'users', firebaseUser.uid)
    await setDoc(ref, {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      lastLoginAt: serverTimestamp()
    }, { merge: true })
  }

  const checkInvitation = async (email) => {
    const q = query(
      collection(db, 'invitations'),
      where('email', '==', email),
      where('status', '==', 'pending')
    )

    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return snapshot.docs[0].data()
  }

  const getOrg = async (orgId) => {
    const snap = await getDoc(doc(db, 'organizations', orgId))
    return snap.exists() ? snap.data() : null
  }

  const init = () => {
    console.log('[Auth] init called')
    unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      isLoading.value = false

      if (!firebaseUser) return

      await syncUser(firebaseUser)

      const invitation = await checkInvitation(firebaseUser.email)
      const org = invitation
        ? await getOrg(invitation.organizationId)
        : null

      orgState.value = { invitation, org }

      if (!invitation) {
        router.push('/login')
        return
      }

      if (!org || !org.isSetupComplete) {
        router.push('/onboarding')
        return
      }

      router.push('/app')
    })
  }

  const stop = () => {
    if (unsubscribe) unsubscribe()
  }

  return {
    user,
    isLoading,
    loginWithGoogle,
    logout,
    init,
    stop
  }
}