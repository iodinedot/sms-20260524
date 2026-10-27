import { db, auth } from '@/firebase/config'
import { ORGANIZATION_ID } from '@/config/organization'
import { createFirestoreRepository } from './firestoreRepository'
import { createAuthRepository } from './authRepository'

export const repository = createFirestoreRepository({ db, organizationId: ORGANIZATION_ID })
export const authRepository = createAuthRepository({ auth, db })