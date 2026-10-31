type Profile = { id: string; data: () => Record<string, any> | undefined };
type AuthAccount = { uid: string; email?: string; displayName?: string; disabled?: boolean; metadata?: { creationTime?: string } };
export const directoryText = (value: unknown) => typeof value === 'string' ? value : '';
export function mergeAccountDirectory(profiles: Profile[], authAccounts: AuthAccount[]) {
  const byId = new Map(profiles.map(s => [s.id, s.data() || {}]));
  const authenticated = new Set(authAccounts.map(a => a.uid));
  const allIds = new Set([...byId.keys(), ...authenticated]);
  const authById = new Map(authAccounts.map(a => [a.uid, a]));
  const accounts = [...allIds].map(uid => {
    const profile = byId.get(uid), account = authById.get(uid);
    const role = ['user', 'collaborator', 'admin', 'director', 'landlord'].includes(profile?.role) ? profile!.role : 'unclassified';
    return { uid, displayName: directoryText(profile?.displayName) || directoryText(account?.displayName) || 'Chưa đặt tên',
      ownerAdminId: directoryText(profile?.ownerAdminId),
      email: directoryText(profile?.email) || directoryText(account?.email), role,
      hasProfile: !!profile, hasAuth: !!account, disabled: account?.disabled === true,
      createdAt: profile?.createdAt?.seconds || (account?.metadata?.creationTime ? Math.floor(Date.parse(account.metadata.creationTime) / 1000) : 0) };
  });
  return { accounts, counts: { total: accounts.length, authentication: authAccounts.length, profiles: profiles.length,
    withoutProfile: accounts.filter(a => !a.hasProfile).length, withoutAuth: accounts.filter(a => !a.hasAuth).length,
    customers: accounts.filter(a => a.role === 'user').length, collaborators: accounts.filter(a => a.role === 'collaborator').length,
    admins: accounts.filter(a => a.role === 'admin').length, unclassified: accounts.filter(a => a.role === 'unclassified').length } };
}
