export type Category = 'T-shirts' | 'Hoodies' | 'Chaquetas' | 'Pantalones' | 'Accesorios'

export interface CartItem {
  product: Product
  size: string
  color: string
  quantity: number
}
export interface ProductImage {
  url: string
  alt_text?: string | null
  position?: number
}

export interface ProductVariant {
  size: string
  color: string
  stock: number
}

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  image_url: string
  description?: string
  sizes: string[]
  colors: string[]
  active: boolean
  images?: ProductImage[]
  variants?: ProductVariant[]
}