export type UserRole = 'guest' | 'host' | 'technician' | 'admin'

export interface AppUser {
  uid: string
  email: string
  displayName: string | null
  photoUrl: string | null
  role: UserRole
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}
