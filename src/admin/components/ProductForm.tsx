import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  ImagePlus,
  Trash2,
  X,
} from 'lucide-react'

import { buttonStyle, eyebrowStyle, fieldStyle } from '../adminStyles'
import type {
  CategoryRow,
  ProductFormData,
  ProductImage,
} from '../types'

interface Props {
  editing: boolean
  form: ProductFormData
  categories: CategoryRow[]
  images: ProductImage[]
  newFiles: File[]
  loading: boolean
  saving: boolean
  message: string
  errorMessage: string
  onChange: (form: ProductFormData) => void
  onNewFilesChange: (files: File[]) => void
  onImagesChange: (images: ProductImage[]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export default function ProductForm({
  editing,
  form,
  categories,
  images,
  newFiles,
  loading,
  saving,
  message,
  errorMessage,
  onChange,
  onNewFilesChange,
  onImagesChange,
  onSubmit,
  onCancel,
}: Props) {
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const urls = newFiles.map((file) => URL.createObjectURL(file))
    setPreviews(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [newFiles])

  function update<K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) {
    onChange({ ...form, [key]: value })
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return

    onNewFilesChange([
      ...newFiles,
      ...Array.from(fileList),
    ])
  }

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction

    if (nextIndex < 0 || nextIndex >= images.length) return

    const next = [...images]
    const [image] = next.splice(index, 1)
    next.splice(nextIndex, 0, image)

    onImagesChange(next)
  }

  return (
    <section style={{ paddingTop: '42px', maxWidth: '760px' }}>
      <button
        type="button"
        onClick={onCancel}
        style={{ ...buttonStyle, marginBottom: '25px' }}
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <p style={eyebrowStyle}>
        {editing ? 'EDITAR PIEZA' : 'NUEVA PIEZA'}
      </p>

      <h1 style={{ margin: '12px 0', fontSize: 'clamp(30px, 5vw, 44px)' }}>
        {editing ? 'Editar producto' : 'Agregar producto'}
      </h1>

      <p style={{ color: '#aaa', lineHeight: 1.7 }}>
        Completa los datos y administra las fotografías de esta pieza.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: '28px',
          padding: 'clamp(18px, 4vw, 30px)',
          border: '1px solid #2b2b2b',
          borderRadius: '8px',
          background: '#111',
        }}
      >
        <label style={{ display: 'block', marginBottom: '23px', fontSize: '13px' }}>
          Nombre del producto
          <input
            style={fieldStyle}
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            maxLength={120}
            required
            placeholder="Ej. Oversized Graphic Tee"
          />
        </label>

        <label style={{ display: 'block', marginBottom: '23px', fontSize: '13px' }}>
          Descripción
          <textarea
            style={{
              ...fieldStyle,
              minHeight: '125px',
              resize: 'vertical',
            }}
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Materiales, corte, estilo y detalles de la pieza..."
          />
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '18px',
          }}
        >
          <label style={{ display: 'block', marginBottom: '23px', fontSize: '13px' }}>
            Precio (USD)
            <input
              style={fieldStyle}
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => update('price', event.target.value)}
              required
              placeholder="29.99"
            />
          </label>

          <label style={{ display: 'block', marginBottom: '23px', fontSize: '13px' }}>
            Categoría
            <select
              style={fieldStyle}
              value={form.categoryId}
              onChange={(event) => update('categoryId', event.target.value)}
              disabled={loading || categories.length === 0}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            border: '1px solid #303030',
            borderRadius: '6px',
            color: '#ddd',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => update('active', event.target.checked)}
            style={{ marginTop: '3px' }}
          />
          <span>
            <strong style={{ display: 'block', color: '#fff' }}>
              Publicar producto
            </strong>
            Si está activado, el producto podrá mostrarse en la tienda.
          </span>
        </label>

        <div style={{ marginTop: '34px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>
            Fotografías
          </h2>

          <p style={{ color: '#aaa', fontSize: '13px', lineHeight: 1.7 }}>
            La primera imagen de la lista será la principal. Puedes cambiar
            el orden usando las flechas.
          </p>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '30px 16px',
              marginTop: '18px',
              border: '1px dashed #555',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: '#ddd',
            }}
          >
            <ImagePlus size={28} />
            <strong>Seleccionar fotografías</strong>
            <span style={{ color: '#999', fontSize: '12px' }}>
              JPG, PNG, WebP o AVIF · Máximo 5 MB por imagen
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={saving}
              onChange={(event) => {
                addFiles(event.target.files)
                event.target.value = ''
              }}
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                opacity: 0,
                overflow: 'hidden',
              }}
            />
          </label>

          {images.length + newFiles.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px', marginTop: '16px' }}>
              Todavía no hay fotografías para este producto.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                gap: '12px',
                marginTop: '20px',
              }}
            >
              {images.map((image, index) => (
                <article
                  key={image.id}
                  style={{
                    minWidth: 0,
                    padding: '8px',
                    border: '1px solid #333',
                    borderRadius: '7px',
                    background: '#181818',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={image.url}
                      alt={image.alt_text ?? 'Fotografía del producto'}
                      style={{
                        display: 'block',
                        width: '100%',
                        aspectRatio: '3 / 4',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />

                    {index === 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          left: '5px',
                          top: '5px',
                          padding: '5px 7px',
                          borderRadius: '3px',
                          background: '#f1f0ed',
                          color: '#111',
                          fontSize: '10px',
                        }}
                      >
                        PRINCIPAL
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '4px',
                      marginTop: '9px',
                    }}
                  >
                    <button
                      type="button"
                      disabled={saving || index === 0}
                      aria-label="Mover imagen hacia arriba"
                      onClick={() => moveImage(index, -1)}
                      style={smallButtonStyle}
                    >
                      <ArrowUp size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={saving || index === images.length - 1}
                      aria-label="Mover imagen hacia abajo"
                      onClick={() => moveImage(index, 1)}
                      style={smallButtonStyle}
                    >
                      <ArrowDown size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      aria-label="Quitar imagen"
                      onClick={() =>
                        onImagesChange(images.filter((item) => item.id !== image.id))
                      }
                      style={{
                        ...smallButtonStyle,
                        color: '#ff9b93',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}

              {newFiles.map((file, index) => (
                <article
                  key={`${file.name}-${file.size}-${index}`}
                  style={{
                    minWidth: 0,
                    padding: '8px',
                    border: '1px solid #333',
                    borderRadius: '7px',
                    background: '#181818',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={previews[index]}
                      alt={file.name}
                      style={{
                        display: 'block',
                        width: '100%',
                        aspectRatio: '3 / 4',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: '5px',
                        top: '5px',
                        padding: '5px 7px',
                        borderRadius: '3px',
                        background: '#333',
                        color: '#fff',
                        fontSize: '10px',
                      }}
                    >
                      NUEVA
                    </span>
                  </div>

                  <p
                    title={file.name}
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#aaa',
                      fontSize: '11px',
                    }}
                  >
                    {file.name}
                  </p>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      onNewFilesChange(newFiles.filter((_, i) => i !== index))
                    }
                    style={{
                      ...smallButtonStyle,
                      width: '100%',
                      color: '#ff9b93',
                    }}
                  >
                    <X size={14} /> Quitar
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        {message && (
          <p style={{ color: '#8fd8a5', lineHeight: 1.6 }}>
            <CheckCircle size={17} style={{ verticalAlign: 'middle' }} />{' '}
            {message}
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            style={{
              color: '#ff9b93',
              lineHeight: 1.6,
              overflowWrap: 'anywhere',
            }}
          >
            {errorMessage}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginTop: '24px',
          }}
        >
          <button
            type="submit"
            disabled={saving || loading || categories.length === 0}
            style={{
              ...buttonStyle,
              minWidth: '190px',
              background: '#f1f0ed',
              color: '#111',
              borderColor: '#f1f0ed',
              opacity: saving || loading ? 0.6 : 1,
            }}
          >
            {saving
              ? 'GUARDANDO...'
              : editing
                ? 'GUARDAR CAMBIOS'
                : 'CREAR PRODUCTO'}
            <ArrowRight size={16} />
          </button>

          <button type="button" onClick={onCancel} style={buttonStyle}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}

const smallButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  minWidth: '30px',
  padding: '7px',
  border: '1px solid #383838',
  borderRadius: '4px',
  background: '#222',
  color: '#fff',
  cursor: 'pointer',
}