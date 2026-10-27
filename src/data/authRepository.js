import {
    GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
  } from 'firebase/auth'
  import {
    doc, getDoc, setDoc, serverTimestamp,
    collection, query, where, getDocs, writeBatch
  } from 'firebase/firestore'
  
  /**
   * Repository 介面：
   *   onAuthChanged(cb) → unsubscribe()
   *   signInWithGoogle() → Promise<User>
   *   signOut()
   *   syncUser(user)
   *   getUserOrganizationId(uid) → Promise<string|null>
   *   getOrg(orgId) → Promise<{id,...}|null>
   *   findPendingInvitation(email) → Promise<{id,...}|null>
   *   commitOnboarding({ uid, orgId, invitationId, orgData, campusId, campus })
   *
   * serverTimestamp 屬於 Firestore 細節，留在這一層。
   */
  export function createAuthRepository({ auth, db }) {
    const withId = (snap) => (snap.exists() ? { id: snap.id, ...snap.data() } : null)
  
    return {
      onAuthChanged: (cb) => onAuthStateChanged(auth, cb),
  
      async signInWithGoogle() {
        const result = await signInWithPopup(auth, new GoogleAuthProvider())
        return result.user
      },
  
      signOut: () => signOut(auth),
  
      async syncUser(user) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          lastLoginAt: serverTimestamp()
        }, { merge: true })
      },
  
      async getUserOrganizationId(uid) {
        const snap = await getDoc(doc(db, 'users', uid))
        return snap.exists() ? snap.data().organizationId ?? null : null
      },
  
      async getOrg(orgId) {
        return withId(await getDoc(doc(db, 'organizations', orgId)))
      },
  
      async findPendingInvitation(email) {
        const q = query(
          collection(db, 'invitations'),
          where('email', '==', email),
          where('status', '==', 'pending')
        )
        const snap = await getDocs(q)
        return snap.empty ? null : withId(snap.docs[0])
      },
  
      // 四個寫入在同一個 batch，維持原本的原子性
      async commitOnboarding({ uid, orgId, invitationId, orgData, campusId, campus }) {
        const batch = writeBatch(db)
  
        batch.set(doc(db, 'organizations', orgId), {
          ...orgData,
          isSetupComplete: true,
          updatedAt: serverTimestamp()
        }, { merge: true })
  
        batch.set(doc(db, 'users', uid), { organizationId: orgId }, { merge: true })
  
        if (invitationId) {
          batch.update(doc(db, 'invitations', invitationId), {
            status: 'accepted',
            acceptedAt: serverTimestamp()
          })
        }
  
        batch.set(doc(db, 'organizations', orgId, 'campuses', campusId), {
          ...campus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
  
        await batch.commit()
      }
    }
  }