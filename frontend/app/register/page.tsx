import { redirect } from 'next/navigation'
import { PATHS } from '@/constants'

export default function LegacyRegisterPage() {
  redirect(PATHS.AUTH.REGISTER)
}

