
import { ArrowRight, LogOut } from 'lucide-react'
import { buttonStyle } from '../adminStyles'

interface Props {
  onHome: () => void
  onBack: () => void
  onLogout: () => void
}

export default function AdminHeader({
  onHome,
  onBack,
  onLogout,
}: Props) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '18px',
        flexWrap: 'wrap',
        paddingBottom: '24px',
        borderBottom: '1px solid #292929',
      }}
    >
      <button
        type="button"
        onClick={onHome}
        style={{
          border: 0,
          padding: 0,
          background: 'none',
          color: '#fff',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: '27px',
            fontWeight: 900,
            letterSpacing: '-2px',
          }}
        >
          KYO<span style={{ color: '#e24b40' }}>✳</span>
        </span>
        <span
          style={{
            display: 'block',
            marginTop: '5px',
            color: '#888',
            fontSize: '10px',
            letterSpacing: '3px',
          }}
        >
          STUDIO / ADMIN
        </span>
      </button>

      <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
        <button type="button" onClick={onBack} style={buttonStyle}>
          Volver a la tienda <ArrowRight size={16} />
        </button>
        <button type="button" onClick={onLogout} style={buttonStyle}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </header>
  )
}
