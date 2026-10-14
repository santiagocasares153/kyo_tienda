import { useEffect, useState, type FormEvent } from 'react'

import { supabase } from './lib/supabase'
import {
  deleteProductImage,
  getAdminData,
  getProductImages,
  removeProduct,
  reorderProductImages,
  saveProduct,
  uploadProductImages,
} from './admin/adminService'
import { containerStyle, pageStyle } from './admin/adminStyles'
import {
  emptyForm,
  type AdminPanelProps,
  type AdminScreen,
  type ProductFormData,
  type ProductImage,
  type ProductRow,
} from './admin/types'

import AdminHeader from './admin/components/AdminHeader'
import AdminHome from './admin/components/AdminHome'
import AdminProducts from './admin/components/AdminProducts'
import ProductForm from './admin/components/ProductForm'

export default function AdminPanel({
  onBack,
  onLogout,
  initialProductId,
}: AdminPanelProps) {
  const [screen, setScreen] = useState<AdminScreen>('home')
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof getAdminData>>['categories']
  >([])
  const [products, setProducts] = useState<ProductRow[]>([])

  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [images, setImages] = useState<ProductImage[]>([])
  const [originalImages, setOriginalImages] = useState<ProductImage[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const editing = editingId !== null

  async function loadData() {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await getAdminData()

      setCategories(data.categories)
      setProducts(data.products)

      if (initialProductId) {
        const product = data.products.find(
          (item) => item.id === initialProductId,
        )

        if (product) {
          setEditingId(product.id)
          setForm({
            name: product.name,
            description: product.description ?? '',
            price: String(product.price),
            categoryId: product.category_id,
            active: product.active,
          })

          const productImages = await getProductImages(product.id)
          setImages(productImages)
          setOriginalImages(productImages)
          setNewFiles([])
          setScreen('form')
        } else {
          setScreen('products')
          setErrorMessage('No se encontró ese producto.')
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al cargar los datos.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [initialProductId])

  function openNewProduct() {
    setEditingId(null)
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? '',
    })
    setImages([])
    setOriginalImages([])
    setNewFiles([])
    setMessage('')
    setErrorMessage('')
    setScreen('form')
  }

  async function openEditProduct(product: ProductRow) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      categoryId: product.category_id,
      active: product.active,
    })
    setImages([])
    setOriginalImages([])
    setNewFiles([])
    setMessage('')
    setErrorMessage('')
    setLoading(true)
    setScreen('form')

    try {
      const productImages = await getProductImages(product.id)
      setImages(productImages)
      setOriginalImages(productImages)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las imágenes.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    setSaving(true)

    try {
      // 1. Guardar el producto y obtener su ID.
      const productId = await saveProduct(form, editingId)

      // 2. Eliminar del almacenamiento las fotos que el usuario quitó.
      const imagesToDelete = originalImages.filter(
        (original) => !images.some((current) => current.id === original.id),
      )

      for (const image of imagesToDelete) {
        await deleteProductImage(image)
      }

      // 3. Subir las nuevas imágenes al bucket.
      const uploadedImages = await uploadProductImages(
        productId,
        newFiles,
        images.length,
      )

      // 4. Guardar el orden final. La primera foto queda en posición 0.
      const finalImages = [...images, ...uploadedImages]
      await reorderProductImages(finalImages)

      // 5. Actualizar los datos que muestra el panel.
      const data = await getAdminData()
      setCategories(data.categories)
      setProducts(data.products)

      const refreshedImages = await getProductImages(productId)
      setImages(refreshedImages)
      setOriginalImages(refreshedImages)
      setNewFiles([])
      setEditingId(productId)

      setMessage(
        editing
          ? 'Producto e imágenes actualizados correctamente.'
          : 'Producto creado e imágenes guardadas correctamente.',
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar el producto o sus imágenes.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product: ProductRow) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
    )

    if (!confirmed || !supabase) return

    setMessage('')
    setErrorMessage('')

    try {
      await removeProduct(product.id)

      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      )

      if (editingId === product.id) {
        setEditingId(null)
        setForm(emptyForm)
        setImages([])
        setOriginalImages([])
        setNewFiles([])
        setScreen('products')
      }

      setMessage(`"${product.name}" se eliminó correctamente.`)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el producto.',
      )
    }
  }

  function goToProducts() {
    setMessage('')
    setErrorMessage('')
    setScreen('products')
  }

  function cancelForm() {
    setMessage('')
    setErrorMessage('')
    setScreen(editing ? 'products' : 'home')
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AdminHeader
          onHome={() => setScreen('home')}
          onBack={onBack}
          onLogout={onLogout}
        />

        {screen === 'home' && (
          <AdminHome
            productCount={products.length}
            onAdd={openNewProduct}
            onManage={goToProducts}
          />
        )}

        {screen === 'products' && (
          <AdminProducts
            products={products}
            categories={categories}
            loading={loading}
            search={search}
            onSearch={setSearch}
            onHome={() => setScreen('home')}
            onAdd={openNewProduct}
            onEdit={(product) => void openEditProduct(product)}
            onDelete={(product) => void handleDelete(product)}
          />
        )}

        {screen === 'form' && (
          <ProductForm
            editing={editing}
            form={form}
            categories={categories}
            images={images}
            newFiles={newFiles}
            loading={loading}
            saving={saving}
            message={message}
            errorMessage={errorMessage}
            onChange={setForm}
            onNewFilesChange={setNewFiles}
            onImagesChange={setImages}
            onSubmit={handleSave}
            onCancel={cancelForm}
          />
        )}

        {screen !== 'form' && errorMessage && (
          <p
            role="alert"
            style={{
              color: '#ff9b93',
              marginTop: '20px',
              overflowWrap: 'anywhere',
            }}
          >
            {errorMessage}
          </p>
        )}

        {screen !== 'form' && message && (
          <p style={{ color: '#8fd8a5', marginTop: '20px' }}>
            {message}
          </p>
        )}
      </div>
    </main>
  )
}