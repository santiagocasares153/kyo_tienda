export interface CategoryRow {
  id: string
  name: string
}

export interface ProductRow {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  active: boolean
  category_id: string
  created_at: string
  image_url: string | null
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  alt_text: string | null
  position: number
  url: string
}

export interface ProductFormData {
  name: string
  description: string
  price: string
  categoryId: string
  active: boolean
}

export interface AdminPanelProps {
  onBack: () => void
  onLogout: () => void
  initialProductId?: string | null
}

export type AdminScreen = 'home' | 'products' | 'form'

export const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  active: true,
}