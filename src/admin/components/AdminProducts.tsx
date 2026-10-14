
import { ArrowLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { buttonStyle, eyebrowStyle, fieldStyle } from '../adminStyles'
import type { CategoryRow, ProductRow } from '../types'

interface Props {
  products: ProductRow[]
  categories: CategoryRow[]
  loading: boolean
  search: string
  onSearch: (value: string) => void
  onHome: () => void
  onAdd: () => void
  onEdit: (product: ProductRow) => void
  onDelete: (product: ProductRow) => void
}

export default function AdminProducts({
  products,
  categories,
  loading,
  search,
  onSearch,
  onHome,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.slug}`
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  )

  return (
    <section style={{ paddingTop: '42px' }}>
      <button
        type="button"
        onClick={onHome}
        style={{ ...buttonStyle, marginBottom: '25px' }}
      >
        <ArrowLeft size={16} /> Inicio
      </button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <p style={eyebrowStyle}>CATÁLOGO INTERNO</p>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>
            Administrar productos
          </h1>
        </div>

        <button
          type="button"
          onClick={onAdd}
          style={{
            ...buttonStyle,
            background: '#f1f0ed',
            color: '#111',
          }}
        >
          <Plus size={17} /> Nuevo producto
        </button>
      </div>

      <div style={{ position: 'relative', margin: '25px 0' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            top: '15px',
            left: '14px',
            color: '#888',
          }}
        />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Buscar por nombre..."
          aria-label="Buscar productos"
          style={{ ...fieldStyle, paddingLeft: '43px' }}
        />
      </div>

      {loading ? (
        <p style={{ color: '#aaa' }}>Cargando catálogo...</p>
      ) : filteredProducts.length === 0 ? (
        <p style={{ color: '#aaa' }}>No se encontraron productos.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '18px',
                border: '1px solid #2b2b2b',
                borderRadius: '6px',
                background: '#111',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '76px',
                  flexShrink: 0,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: '#222',
                  border: '1px solid #333',
                }}
              >
                <img
                  src={product.image_url || ''}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div style={{ flex: '1 1 220px' }}>
                <strong style={{ fontSize: '16px' }}>
                  {product.name}
                </strong>

                <p
                  style={{
                    margin: '7px 0',
                    color: '#aaa',
                    fontSize: '13px',
                  }}
                >
                  ${Number(product.price).toFixed(2)} ·{' '}
                  {categories.find(
                    (category) => category.id === product.category_id,
                  )?.name ?? 'Sin categoría'}
                </p>

                <span
                  style={{
                    color: product.active ? '#8fd8a5' : '#e6b978',
                    fontSize: '11px',
                    letterSpacing: '1px',
                  }}
                >
                  {product.active ? 'PUBLICADO' : 'BORRADOR / OCULTO'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  style={buttonStyle}
                >
                  <Pencil size={15} /> Editar
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  aria-label={`Eliminar ${product.name}`}
                  style={{
                    ...buttonStyle,
                    color: '#ff9b93',
                    borderColor: '#5c302d',
                  }}
                >
                  <Trash2 size={15} /> Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
