import useAuthStore from '../store/auth.store'
import StaffLayout from './StaffLayout'
import PatientLayout from './PatientLayout'

export default function Layout({ children }) {
    const { user, isLoading } = useAuthStore()

    if (isLoading) return null

    if (user?.role === 'patient') {
        return <PatientLayout>{children}</PatientLayout>
    }

    return <StaffLayout>{children}</StaffLayout>
}