import { Inter } from 'next/font/google'
import styles from './Cintillo.module.css'

// Misma tipografía que el cintillo de finncapitel.com: Inter 700.
const inter = Inter({ subsets: ['latin'], weight: '700', display: 'swap' })

const FRASES = [
    'Crédito directo',
    'Sin importar tu DICOM',
    'Sin evaluación bancaria',
    'Cuotas fijas',
    'Pie desde $5.500.000',
    'Terrenos desde 200 m²',
    'A minutos de la playa',
    'Terrenos en El Tabo',
    'Invierte en el Litoral Central',
    'Simula tu crédito',
    'Agenda tu reunión',
    'Agenda tu visita',
    'Tu terreno, tu futuro.',
]

function Grupo({ oculto = false }: { oculto?: boolean }) {
    return (
        <div className={styles.grupo} aria-hidden={oculto || undefined}>
            {FRASES.map((frase) => (
                <span key={frase} className={styles.item}>
                    <span>{frase}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element -- icono decorativo de 7 KB */}
                    <img
                        src="/assets/homepage-v2/icono-alimin-blanco.png"
                        alt=""
                        aria-hidden="true"
                        width={28}
                        height={28}
                        className={styles.icono}
                    />
                </span>
            ))}
        </div>
    )
}

// Franja con frases en desplazamiento continuo. El grupo se repite dos veces
// para que el loop no tenga corte (la animación avanza exactamente un grupo).
export default function Cintillo() {
    return (
        <div className={`${styles.cintillo} ${inter.className}`}>
            <div className={styles.pista}>
                <Grupo />
                <Grupo oculto />
            </div>
        </div>
    )
}
