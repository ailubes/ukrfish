import 'next-auth'
import 'next-auth/jwt'

type AppUserRole = 'USER' | 'ADMIN' | 'SUPERADMIN'

declare module 'next-auth' {
  interface User {
    role?: AppUserRole
  }

  interface Session {
    user?: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: AppUserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: AppUserRole
  }
}
