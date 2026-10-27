/**
 * 純邏輯：不 import vue、不 import firebase。
 */

// 登入狀態機：輸入三個值，輸出畫面該顯示哪一種狀態
export function computeStatus({ isReady, user, orgState }) {
    if (!isReady) return 'loading'
    if (!user) return 'unauthenticated'
    if (orgState === undefined) return 'loading'
    if (orgState === null) return 'no-invitation'
    if (!orgState.org?.isSetupComplete) return 'onboarding'
    return 'ready'
  }
  
  export function createAuthService({
    repo,
    now = () => Date.now(),
    random = () => Math.random()
  }) {
    // 跟 schema idPrefix 慣例一致的 ID（camp_xxxxxxxx）
    const generateId = (prefix) =>
      `${prefix}${now().toString(36)}${random().toString(36).slice(2, 10)}`
  
    // 回傳 { organizationId, org, invitation? } 或 null（沒有邀請）
    const loadOrgState = async (user) => {
      const existingOrgId = await repo.getUserOrganizationId(user.uid)
      if (existingOrgId) {
        return { organizationId: existingOrgId, org: await repo.getOrg(existingOrgId) }
      }
  
      const invitation = await repo.findPendingInvitation(user.email)
      if (!invitation) return null
  
      const org = await repo.getOrg(invitation.organizationId)
      return { organizationId: invitation.organizationId, org, invitation }
    }
  
    const buildFirstCampus = (formData) => ({
      name: formData.name,
      address: formData.address || '',
      phone: formData.phone || '',
      isMain: true,
      dataStatus: 'active'
    })
  
    const completeOnboarding = async ({ user, orgState, formData }) => {
      await repo.commitOnboarding({
        uid: user.uid,
        orgId: orgState.organizationId,
        invitationId: orgState.invitation?.id ?? null,
        orgData: formData,
        campusId: generateId('camp_'),
        campus: buildFirstCampus(formData)
      })
      return loadOrgState(user)
    }
  
    return {
      generateId, loadOrgState, buildFirstCampus, completeOnboarding,
      syncUser: repo.syncUser,
      signInWithGoogle: repo.signInWithGoogle,
      signOut: repo.signOut,
      onAuthChanged: repo.onAuthChanged
    }
  }