import { supabase } from '../lib/supabase'
import type {
  CategoryRow,
  ProductFormData,
  ProductImage,
  ProductRow,
} from './types'

const BUCKET = 'product-images'

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado.')
  }

  return supabase
}

export async function getAdminData(): Promise<{
  categories: CategoryRow[]
  products: ProductRow[]
}> {
  const client = requireSupabase()

  const [categoryResult, productResult, imageResult] = await Promise.all([
    client
      .from('categories')
      .select('id, name')
      .order('name'),

    client
      .from('products')
      .select(
        'id, name, slug, description, price, active, category_id, created_at',
      )
      .order('created_at', { ascending: false }),

    client
      .from('product_images')
      .select('product_id, storage_path, position')
      .order('position', { ascending: true }),
  ])

  if (categoryResult.error) {
    throw new Error(
      `Error al cargar categorías: ${categoryResult.error.message}`,
    )
  }

  if (productResult.error) {
    throw new Error(
      `Error al cargar productos: ${productResult.error.message}`,
    )
  }

  if (imageResult.error) {
    throw new Error(
      `Error al cargar imágenes: ${imageResult.error.message}`,
    )
  }

  const firstImageByProduct = new Map<string, string>()

  for (const image of imageResult.data ?? []) {
    if (!firstImageByProduct.has(image.product_id)) {
      const imageUrl = client.storage
        .from(BUCKET)
        .getPublicUrl(image.storage_path).data.publicUrl

      firstImageByProduct.set(image.product_id, imageUrl)
    }
  }

  const products: ProductRow[] = (productResult.data ?? []).map(
    (product) => ({
      ...product,
      image_url: firstImageByProduct.get(product.id) ?? null,
    }),
  )

  return {
    categories: (categoryResult.data ?? []) as CategoryRow[],
    products,
  }
}


function makeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function saveProduct(
  form: ProductFormData,
  editingId: string | null,
): Promise<string> {
  const client = requireSupabase()

  const name = form.name.trim()
  const slug = makeSlug(name)
  const price = Number(form.price)

  if (!name || !slug) {
    throw new Error('Escribe un nombre válido para el producto.')
  }

  if (!form.categoryId) {
    throw new Error('Selecciona una categoría.')
  }

  if (
    !form.price.trim() ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error('Introduce un precio válido.')
  }

  const values = {
    name,
    slug,
    description: form.description.trim() || null,
    price,
    category_id: form.categoryId,
    active: form.active,
  }

  if (editingId) {
    const { data, error } = await client
      .from('products')
      .update(values)
      .eq('id', editingId)
      .select('id')
      .single()

    if (error) {
      throw new Error(`No se pudo actualizar el producto: ${error.message}`)
    }

    return data.id
  }

  const { data, error } = await client
    .from('products')
    .insert(values)
    .select('id')
    .single()

  if (error) {
    throw new Error(`No se pudo crear el producto: ${error.message}`)
  }

  return data.id
}

export async function getProductImages(
  productId: string,
): Promise<ProductImage[]> {
  const client = requireSupabase()

  const { data, error } = await client
    .from('product_images')
    .select('id, product_id, storage_path, alt_text, position')
    .eq('product_id', productId)
    .order('position', { ascending: true })

  if (error) {
    throw new Error(`No se pudieron cargar las imágenes: ${error.message}`)
  }

  return (data ?? []).map((image) => ({
    ...image,
    url: client.storage.from(BUCKET).getPublicUrl(image.storage_path)
      .data.publicUrl,
  })) as ProductImage[]
}

export async function uploadProductImages(
  productId: string,
  files: File[],
  startingPosition: number,
): Promise<ProductImage[]> {
  const client = requireSupabase()
  const uploadedPaths: string[] = []

  try {
    const records: {
      product_id: string
      storage_path: string
      alt_text: string
      position: number
    }[] = []

    for (let index = 0; index < files.length; index++) {
      const file = files[index]

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          `"${file.name}" tiene un formato no permitido. Usa JPG, PNG, WebP o AVIF.`,
        )
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`"${file.name}" supera el límite de 5 MB.`)
      }

      const safeName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')

      const path = `${productId}/${crypto.randomUUID()}-${safeName}`

      const { error: uploadError } = await client.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) {
        throw new Error(
          `No se pudo subir "${file.name}": ${uploadError.message}`,
        )
      }

      uploadedPaths.push(path)

      records.push({
        product_id: productId,
        storage_path: path,
        alt_text: file.name,
        position: startingPosition + index,
      })
    }

    if (records.length === 0) {
      return []
    }

    const { error: insertError } = await client
      .from('product_images')
      .insert(records)

    if (insertError) {
      throw new Error(
        `Las imágenes se subieron, pero no se pudieron registrar: ${insertError.message}`,
      )
    }

    return getProductImages(productId)
  } catch (error) {
    // Intenta retirar los archivos subidos si falla la operación.
    if (uploadedPaths.length > 0) {
      await client.storage.from(BUCKET).remove(uploadedPaths)
    }

    throw error
  }
}

export async function deleteProductImage(
  image: ProductImage,
): Promise<void> {
  const client = requireSupabase()

  // Primero se elimina el archivo del almacenamiento.
  const { error: storageError } = await client.storage
    .from(BUCKET)
    .remove([image.storage_path])

  if (storageError) {
    throw new Error(
      `No se pudo eliminar el archivo de imagen: ${storageError.message}`,
    )
  }

  const { error: databaseError } = await client
    .from('product_images')
    .delete()
    .eq('id', image.id)

  if (databaseError) {
    throw new Error(
      `Se eliminó el archivo, pero no su registro: ${databaseError.message}`,
    )
  }
}

export async function reorderProductImages(
  images: ProductImage[],
): Promise<void> {
  const client = requireSupabase()

  if (images.length === 0) return

  // Paso temporal para evitar colisiones con la restricción
  // UNIQUE(product_id, position) al intercambiar posiciones.
  for (let index = 0; index < images.length; index++) {
    const { error } = await client
      .from('product_images')
      .update({ position: -100000 - index })
      .eq('id', images[index].id)

    if (error) {
      throw new Error(`No se pudo preparar el orden: ${error.message}`)
    }
  }

  for (let index = 0; index < images.length; index++) {
    const { error } = await client
      .from('product_images')
      .update({ position: index })
      .eq('id', images[index].id)

    if (error) {
      throw new Error(`No se pudo guardar el orden: ${error.message}`)
    }
  }
}

export async function removeProduct(id: string): Promise<void> {
  const client = requireSupabase()

  // Limpiamos los archivos antes de eliminar el producto.
  const { data: images, error: imageError } = await client
    .from('product_images')
    .select('storage_path')
    .eq('product_id', id)

  if (imageError) {
    throw new Error(`No se pudieron consultar sus imágenes: ${imageError.message}`)
  }

  const paths = (images ?? []).map((image) => image.storage_path)

  if (paths.length > 0) {
    const { error: storageError } = await client.storage
      .from(BUCKET)
      .remove(paths)

    if (storageError) {
      throw new Error(
        `No se pudieron eliminar las imágenes del producto: ${storageError.message}`,
      )
    }
  }

  const { error } = await client
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`No se pudo eliminar el producto: ${error.message}`)
  }
}