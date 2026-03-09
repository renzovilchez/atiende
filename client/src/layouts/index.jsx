import useAuthStore from '../store/auth.store'
import StaffLayout from './StaffLayout'
import PatientLayout from './PatientLayout'

export default function Layout({ children }) {
    const { user } = useAuthStore()

    if (user?.role === 'patient') {
        return <PatientLayout>{children}</PatientLayout>
    }

    return <StaffLayout>{children}</StaffLayout>
}