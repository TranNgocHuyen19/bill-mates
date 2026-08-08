import { redirect } from 'next/navigation'
import { PATHS } from '@/constants'

export default function LegacyLoginPage() {
  redirect(PATHS.AUTH.LOGIN)
}

