import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AliFloatingCharacter from '@/components/layout/AliFloatingCharacter'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
            <Footer />

            {/* Ali 3D Floating Character & WhatsApp Interactive Widget */}
            <AliFloatingCharacter />
        </>
    )
}
