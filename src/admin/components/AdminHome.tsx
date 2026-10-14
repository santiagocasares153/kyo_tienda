
import { LayoutGrid, PackagePlus } from 'lucide-react'
import { buttonStyle, eyebrowStyle } from '../adminStyles'

interface Props {
  productCount: number
  onAdd: () => void
  onManage: () => void
}

export default function AdminHome({
  productCount,
  onAdd,
  onManage,
}: Props) {
  return (
    <section style={{ paddingTop: '58px' }}>
      <p style={eyebrowStyle}>ESPACIO PRIVADO / KYO</p>

      <h1
        style={{
          maxWidth: '700px',
          margin: '15px 0',
          fontSize: 'clamp(35px, 7vw, 64px)',
          lineHeight: 1.02,
          letterSpacing: '-2.5px',
        }}
      >
        ¡Bienvenido de nuevo!
      </h1>

      <p
        style={{
          maxWidth: '540px',
          color: '#aaa',
          fontSize: '17px',
          lineHeight: 1.7,
        }}
      >
        ¿Qué quieres hacer hoy? Administra las piezas de KYO
        desde un solo lugar.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginTop: '38px',
        }}
      >
        <button
          type="button"
          onClick={onAdd}
          style={{
            ...buttonStyle,
            minHeight: '175px',
            padding: '25px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            background: '#f1f0ed',
            color: '#111',
            borderColor: '#f1f0ed',
            textAlign: 'left',
          }}
        >
          <PackagePlus size={25} />
          <strong style={{ marginTop: '10px', fontSize: '20px' }}>
            Agregar producto
          </strong>
          <span style={{ fontSize: '13px', lineHeight: 1.6 }}>
            Registrar una nueva pieza en el catálogo.
          </span>
        </button>

        <button
          type="button"
          onClick={onManage}
          style={{
            ...buttonStyle,
            minHeight: '175px',
            padding: '25px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
          }}
        >
          <LayoutGrid size={25} />
          <strong style={{ marginTop: '10px', fontSize: '20px' }}>
            Administrar productos
          </strong>
          <span style={{ color: '#aaa', fontSize: '13px', lineHeight: 1.6 }}>
            Consultar, editar o eliminar productos.
          </span>
        </button>
      </div>

      <div
        style={{
          marginTop: '28px',
          padding: '20px',
          border: '1px solid #292929',
          borderRadius: '6px',
          color: '#aaa',
        }}
      >
        <span style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>
          {productCount}
        </span>
        <span style={{ marginLeft: '12px' }}>
          productos registrados
        </span>
      </div>
    </section>
  )
}
