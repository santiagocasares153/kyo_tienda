import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import { demoProducts } from './data/products'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import AdminPanel from './AdminPanel'
import type { CartItem, Category, Product } from './types'

const categories: Array<'Todo' | Category> = ['Todo', 'T-shirts', 'Hoodies', 'Chaquetas', 'Pantalones', 'Accesorios']
const money = (value: number) => `$${value.toFixed(2)}`

export default function App() {
  //const [products, setProducts] = useState<Product[]>(demoProducts)
  const [products, setProducts] = useState<Product[]>(
  isSupabaseConfigured ? [] : demoProducts
)
  const [adminOpen, setAdminOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
const [selectedAdminProductId, setSelectedAdminProductId] =
  useState<string | null>(null)
  const [category, setCategory] = useState<(typeof categories)[number]>('Todo')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
const [selectedImageIndex, setSelectedImageIndex] = useState(0)
const [selectedSize, setSelectedSize] = useState('')
const [selectedColor, setSelectedColor] = useState('')
const [cardImageIndexes, setCardImageIndexes] = useState<Record<string, number>>({})

  
  useEffect(() => {
    let alive = true

    async function loadProducts() {
      if (!supabase || !isSupabaseConfigured) {
        if (alive) setProducts(demoProducts)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          active,
          created_at,
          categories(name),
          product_variants(size, color, stock),
          product_images(storage_path, alt_text, position)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (!alive) return

      if (error) {
        console.error('Error cargando productos de Supabase:', error)
        setProducts([])
        return
      }

      const mappedProducts: Product[] = (data ?? []).map((row) => {
        const categoryRelation = row.categories
        const categoryData = Array.isArray(categoryRelation)
          ? categoryRelation[0]
          : categoryRelation

        const variants = row.product_variants ?? []

        const images = [...(row.product_images ?? [])].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0)
        )

       const productImages = images.map((image) => ({
          url: supabase!.storage
            .from('product-images')
            .getPublicUrl(image.storage_path).data.publicUrl,
          alt_text: image.alt_text,
          position: image.position,
        }))

        const imageUrl = productImages[0]?.url ?? ''

      return {
        id: row.id,
        name: row.name,
        category: categoryData?.name ?? 'Sin categoría',
        price: Number(row.price),
        image_url: imageUrl,
        images: productImages,
        description: row.description ?? '',
        sizes: [...new Set(
          variants.map((variant) => variant.size).filter(Boolean)
        )],
        colors: [...new Set(
          variants.map((variant) => variant.color).filter(Boolean)
        )],
        variants: variants.map((variant) => ({
          size: variant.size || 'Única',
          color: variant.color || 'Único',
          stock: Number(variant.stock ?? 0),
        })),
        active: row.active,
      }
      })

      setProducts(mappedProducts)
    }

    void loadProducts()

    return () => {
      alive = false
    }
  }, [])


  const visibleProducts = useMemo(
    () => products.filter((product) => product.active && (category === 'Todo' || product.category === category)),
    [products, category],
  )
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  function openProductDetail(product: Product) {
    const availableVariants = (product.variants ?? []).filter(
      (variant) => variant.stock > 0,
    )

    setSelectedProduct(product)
    setSelectedImageIndex(0)

    setSelectedSize(
      availableVariants[0]?.size ??
        product.sizes[0] ??
        'Única',
    )

    setSelectedColor(
      availableVariants[0]?.color ??
        product.colors[0] ??
        'Único',
    )

    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function addToCart(
    product: Product,
    size = product.sizes[0] ?? 'Única',
    color = product.colors[0] ?? 'Único',
  ) {
    const variant = product.variants?.find(
      (item) => item.size === size && item.color === color,
    )

    if (product.variants?.length && (!variant || variant.stock <= 0)) {
      setNotice('Esta combinación de talla y color no está disponible.')
      return
    }

    const existingItem = cart.find(
      (item) =>
        item.product.id === product.id &&
        item.size === size &&
        item.color === color,
    )

    if (
      variant &&
      existingItem &&
      existingItem.quantity >= variant.stock
    ) {
      setNotice('No hay más unidades disponibles de esta variante.')
      return
    }

    setCart((current) => {
      const found = current.find(
        (item) =>
          item.product.id === product.id &&
          item.size === size &&
          item.color === color,
      )

      if (found) {
        return current.map((item) =>
          item === found
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...current, { product, size, color, quantity: 1 }]
    })

    setSelectedProduct(null)
    setCartOpen(true)
    setNotice('')
  }

  function changeQuantity(index: number, delta: number) {
    setCart((current) => current.map((item, i) => i === index ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0))
  }

  function checkoutWhatsApp() {
    const number = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined
    if (!number || number === '584120000000') {
      setNotice('Configura VITE_WHATSAPP_NUMBER en tu archivo .env antes de recibir pedidos.')
      return
    }
    const lines = cart.map((item) => `• ${item.product.name} — ${item.size} / ${item.color} × ${item.quantity}: ${money(item.product.price * item.quantity)}`)
    const message = `¡Hola! Quiero hacer este pedido:\n\n${lines.join('\n')}\n\nTotal: ${money(total)}\n\n¿Me confirman disponibilidad y envío?`
    window.open(`https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }
// BORRAR PRODUCTO DEL CATALOGO (ADMIN)
 async function deleteProductFromStore(product: Product): Promise<boolean> {
  if (!isAdmin || !supabase) return false
  
  const confirmed = window.confirm(
    `¿Seguro que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
  )

  if (!confirmed) return false

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', product.id)

  if (error) {
    window.alert(`No se pudo eliminar el producto: ${error.message}`)
    return false
  }

  setProducts((current) =>
    current.filter((item) => item.id !== product.id),
  )

  setCart((current) =>
    current.filter((item) => item.product.id !== product.id),
  )
  return true
}


 
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault()
      setNotice('')

      if (!supabase) {
        setNotice('Supabase no está configurado.')
        return
      }

      setLoading(true)

      try {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (loginError) {
          setNotice('No se pudo iniciar sesión. Comprueba tus credenciales.')
          return
        }

        // Comprueba los permisos mediante la función SQL existente.
        const { data: isAdmin, error: permissionError } =
          await supabase.rpc('is_kyo_admin')

        if (permissionError) {
          await supabase.auth.signOut()
          setNotice(
            `No se pudieron verificar los permisos: ${permissionError.message}`
          )
          return
        }

        if (isAdmin !== true) {
          await supabase.auth.signOut()
          setNotice('Tu usuario no tiene permisos de administrador.')
          return
        }
        setLoginOpen(false)
        setPassword('')
        setNotice('')
        setSelectedAdminProductId(null)
        setIsAdmin(true)
        setAdminOpen(true)
      } catch {
        setNotice('Ocurrió un error al comprobar el acceso.')
      } finally {
        setLoading(false)
      }
    }

 if (adminOpen && isAdmin) {
  return (
    <AdminPanel
      initialProductId={selectedAdminProductId}
      onBack={() => {
        setAdminOpen(false)
        setSelectedAdminProductId(null)
      }}
      onLogout={() => {
        void (async () => {
          if (supabase) {
            await supabase.auth.signOut()
          }

          setIsAdmin(false)
          setAdminOpen(false)
          setSelectedAdminProductId(null)
          setNotice('')
        })()
      }}
    />
  )
}


  return (
    <div className="site-shell">
      <div className="announcement"><span>DROP 001</span> — ROPA PARA LOS QUE NO SIGUEN EL MOLDE <ArrowRight size={13} /></div>
      <header className="navbar">
        <button className="icon-button mobile-only" aria-label="Abrir menú" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21} /></button>
        <a className="wordmark" href="#inicio" aria-label="KYO inicio">KYO<span className="logo-flower">✳</span></a>
        <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'}>
          <a href="#catalogo" onClick={() => setMobileMenu(false)}>CATÁLOGO</a>
          <a href="#nosotros" onClick={() => setMobileMenu(false)}>MANIFIESTO</a>
          <a href="#footer" onClick={() => setMobileMenu(false)}>CONTACTO</a>
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button"
            aria-label={isAdmin ? 'Abrir administración' : 'Iniciar sesión'}
            title={isAdmin ? 'Administración' : 'Iniciar sesión'}
            onClick={() => {
              if (isAdmin) {
                setSelectedAdminProductId(null)
                setAdminOpen(true)
              } else {
                setLoginOpen(true)
                setNotice('')
              }
            }}
          >
            <UserRound size={19} />
          </button>
          <button className="cart-trigger" onClick={() => setCartOpen(true)} aria-label={`Carrito, ${totalItems} productos`}><ShoppingBag size={18} /><span>CARRITO ({totalItems})</span></button>
        </div>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="hero-topline"><span>EST. MMXXVI</span><span>CARACAS / EVERYWHERE</span></div>
          <div className="hero-copy">
            <p className="eyebrow"><span className="red-dot" /> STREETWEAR INDEPENDIENTE</p>
            <h1>NO VISTAS<br />PARA <span>ENCAJAR.</span></h1>
            <p className="hero-description">Piezas para construir tu propio lenguaje.<br />Sin permiso. Sin molde. Solo tú.</p>
            <a className="primary-button" href="#catalogo">EXPLORAR DROP 001 <ArrowDownRight size={17} /></a>
          </div>
          <div className="hero-stamp" aria-hidden="true"><span>KYO</span><span>NOT FOR EVERYONE</span><span className="stamp-flower">✳</span></div>
          <div className="hero-bottomline"><span>01 / IDENTIDAD PROPIA</span><span>DISEÑADO PARA DESTACAR ↗</span></div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="section-heading">
            <div><p className="eyebrow">ENCUENTRA TU FORMA</p><h2>EL CATÁLOGO<span className="red-dot" /></h2></div>
            <p className="section-note">DROP 001 <span>—</span> PIEZAS SELECCIONADAS</p>
          </div>
          <div className="category-row" aria-label="Filtrar por categoría">
            {categories.map((item) => <button key={item} className={category === item ? 'category-chip active' : 'category-chip'} onClick={() => setCategory(item)}>{item}<span>{item === 'Todo' ? products.length : products.filter((p) => p.category === item).length}</span></button>)}
          </div>
          {!isSupabaseConfigured && <div className="demo-banner"><span className="demo-indicator" /> MODO DEMO · Productos de ejemplo. Conecta Supabase para usar tu catálogo real.</div>}
          <div className="product-grid">
            {visibleProducts.map((product, index) => <article className="product-card" key={product.id}>
            <div className="product-card-visual">
                <button
                  type="button"
                  className="product-image-button"
                  onClick={() => openProductDetail(product)}
                  aria-label={`Ver detalles de ${product.name}`}
                >
                  <img
                    src={
                      (
                        product.images?.length
                          ? product.images
                          : [{ url: product.image_url }]
                      )[cardImageIndexes[product.id] ?? 0]?.url || product.image_url
                    }
                    alt={product.name}
                    loading={index > 2 ? 'lazy' : 'eager'}
                  />

                  <span className="product-number">
                    KYO — {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="quick-add">
                    VER PRENDA <ArrowRight size={15} />
                  </span>
                </button>

                {(product.images?.length ?? 0) > 1 && (
                  <>
                    <button
                      type="button"
                      className="card-gallery-arrow card-gallery-prev"
                      aria-label={`Foto anterior de ${product.name}`}
                      onClick={() =>
                        setCardImageIndexes((current) => ({
                          ...current,
                          [product.id]:
                            ((current[product.id] ?? 0) - 1 + product.images!.length) %
                            product.images!.length,
                        }))
                      }
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      type="button"
                      className="card-gallery-arrow card-gallery-next"
                      aria-label={`Foto siguiente de ${product.name}`}
                      onClick={() =>
                        setCardImageIndexes((current) => ({
                          ...current,
                          [product.id]:
                            ((current[product.id] ?? 0) + 1) % product.images!.length,
                        }))
                      }
                    >
                      <ChevronRight size={18} />
                    </button>

                    <span className="card-gallery-count">
                      {(cardImageIndexes[product.id] ?? 0) + 1}
                      {' / '}
                      {product.images!.length}
                    </span>
                  </>
                )}
              </div>
              <div className="product-info"><div><p className="product-category">{product.category}</p><h3>{product.name}</h3></div><span className="product-price">{money(product.price)}</span></div>
              <div className="product-meta"><span>{product.colors.join(' / ')}</span><span>{product.sizes.join(' · ')}</span></div>
              {isAdmin && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap',
                      marginTop: '14px',
                    }}
                  >
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setSelectedAdminProductId(product.id)
                        setAdminOpen(true)
                      }}
                    >
                      EDITAR PRODUCTO
                    </button>

                    <button
                      type="button"
                      className="text-button"
                      onClick={() => void deleteProductFromStore(product)}
                      style={{ color: '#c84b43' }}
                    >
                      ELIMINAR
                    </button>
                  </div>
                )}
            </article>)}
          </div>
          {visibleProducts.length === 0 && <p className="empty-state">No hay productos en esta categoría todavía.</p>}
        </section>

        <section className="manifesto" id="nosotros">
          <span className="manifesto-symbol">✳</span>
          <p className="eyebrow">NO ES SOLO LO QUE LLEVAS</p>
          <h2>EL ESTILO NO<br />PIDE <span>PERMISO.</span></h2>
          <p>Menos reglas. Más identidad. Viste como te dé la gana.</p>
          <a href="#catalogo">ENCUENTRA TU PIEZA <ArrowRight size={15} /></a>
        </section>
      </main>

      <footer id="footer" className="footer"><a className="wordmark" href="#inicio">KYO<span className="logo-flower">✳</span></a><p>NO ENCAJES. DESTACA.</p><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a><span className="copyright">© 2026 KYO STUDIO</span></footer>
      {selectedProduct && (
        <div className="product-detail-overlay">
          <section className="product-detail">
            <button
              type="button"
              className="product-detail-back"
              onClick={() => setSelectedProduct(null)}
            >
              <ArrowRight size={16} className="back-arrow" />
              VOLVER AL CATÁLOGO
            </button>

            <div className="product-detail-layout">
              <div className="product-gallery">
                <div className="product-main-image">
                  {(() => {
                    const gallery = selectedProduct.images?.length
                      ? selectedProduct.images
                      : [{ url: selectedProduct.image_url }]

                    const currentImage = gallery[selectedImageIndex] ?? gallery[0]

                    return (
                      <>
                        {currentImage?.url ? (
                          <img
                            src={currentImage.url}
                            alt={currentImage.alt_text || selectedProduct.name}
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            IMAGEN NO DISPONIBLE
                          </div>
                        )}

                        {gallery.length > 1 && (
                          <>
                            <button
                              type="button"
                              className="gallery-arrow gallery-prev"
                              aria-label="Foto anterior"
                              onClick={() =>
                                setSelectedImageIndex(
                                  (selectedImageIndex - 1 + gallery.length) %
                                    gallery.length,
                                )
                              }
                            >
                              <ChevronLeft size={22} />
                            </button>

                            <button
                              type="button"
                              className="gallery-arrow gallery-next"
                              aria-label="Foto siguiente"
                              onClick={() =>
                                setSelectedImageIndex(
                                  (selectedImageIndex + 1) % gallery.length,
                                )
                              }
                            >
                              <ChevronRight size={22} />
                            </button>

                            <span className="gallery-counter">
                              {selectedImageIndex + 1} / {gallery.length}
                            </span>
                          </>
                        )}
                      </>
                    )
                  })()}
                </div>

                {(selectedProduct.images?.length ?? 0) > 1 && (
                  <div className="product-thumbnails">
                    {selectedProduct.images!.map((image, index) => (
                      <button
                        type="button"
                        key={`${image.url}-${index}`}
                        className={
                          selectedImageIndex === index
                            ? 'product-thumbnail active'
                            : 'product-thumbnail'
                        }
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={`Ver foto ${index + 1}`}
                      >
                        <img
                          src={image.url}
                          alt={image.alt_text || `${selectedProduct.name} ${index + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="product-detail-info">
                <p className="product-category">{selectedProduct.category}</p>

                <h1>{selectedProduct.name}</h1>

                <p className="product-detail-price">
                  {money(selectedProduct.price)}
                </p>

                <div className="product-detail-divider" />

                <p className="product-detail-description">
                  {selectedProduct.description?.trim() ||
                    'Una pieza KYO diseñada para destacar. Sin molde. Solo tu estilo.'}
                </p>

                {selectedProduct.sizes.length > 0 && (
                  <div className="variant-section">
                    <div className="variant-heading">
                      <span>TALLA</span>
                      <span>{selectedSize}</span>
                    </div>

                    <div className="variant-options">
                      {selectedProduct.sizes.map((size) => {
                        const hasAvailableVariant =
                          !selectedProduct.variants?.length ||
                          selectedProduct.variants.some(
                            (variant) =>
                              variant.size === size &&
                              variant.color === selectedColor &&
                              variant.stock > 0,
                          )

                        return (
                          <button
                            type="button"
                            key={size}
                            disabled={!hasAvailableVariant}
                            className={[
                              'variant-option',
                              selectedSize === size ? 'active' : '',
                              !hasAvailableVariant ? 'unavailable' : '',
                            ].join(' ')}
                            onClick={() => setSelectedSize(size)}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedProduct.colors.length > 0 && (
                  <div className="variant-section">
                    <div className="variant-heading">
                      <span>COLOR</span>
                      <span>{selectedColor}</span>
                    </div>

                    <div className="variant-options">
                      {selectedProduct.colors.map((color) => {
                        const hasAvailableVariant =
                          !selectedProduct.variants?.length ||
                          selectedProduct.variants.some(
                            (variant) =>
                              variant.color === color &&
                              variant.size === selectedSize &&
                              variant.stock > 0,
                          )

                        return (
                          <button
                            type="button"
                            key={color}
                            disabled={!hasAvailableVariant}
                            className={[
                              'variant-option',
                              selectedColor === color ? 'active' : '',
                              !hasAvailableVariant ? 'unavailable' : '',
                            ].join(' ')}
                            onClick={() => setSelectedColor(color)}
                          >
                            {color}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {(() => {
                  const hasVariants = Boolean(selectedProduct.variants?.length)

                  const variant = selectedProduct.variants?.find(
                    (item) =>
                      item.size === selectedSize &&
                      item.color === selectedColor,
                  )

                  const outOfStock = hasVariants && (!variant || variant.stock <= 0)

                  return (
                    <>
                      {hasVariants && (
                        <p className={outOfStock ? 'stock-label out-of-stock' : 'stock-label'}>
                          {outOfStock
                            ? 'AGOTADO'
                            : variant!.stock <= 5
                              ? `ÚLTIMAS ${variant!.stock} UNIDADES`
                              : 'DISPONIBLE'}
                        </p>
                      )}

                     {isAdmin ? (
                      <div className="product-admin-actions">
                        <button
                          type="button"
                          className="primary-button product-add-button"
                          onClick={() => {
                            setSelectedAdminProductId(selectedProduct.id)
                            setSelectedProduct(null)
                            setAdminOpen(true)
                          }}
                        >
                          EDITAR PRODUCTO <ArrowRight size={17} />
                        </button>

                        <button
                          type="button"
                          className="product-delete-detail"
                          onClick={() => {
                            void (async () => {
                              const deleted = await deleteProductFromStore(selectedProduct)

                              if (deleted) {
                                setSelectedProduct(null)
                              }
                            })()
                          }}
                        >
                          ELIMINAR PRODUCTO
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="primary-button product-add-button"
                        disabled={(() => {
                          const variants = selectedProduct.variants ?? []

                          if (!variants.length) return false

                          return !variants.some(
                            (variant) =>
                              variant.size === selectedSize &&
                              variant.color === selectedColor &&
                              variant.stock > 0,
                          )
                        })()}
                        onClick={() =>
                          addToCart(selectedProduct, selectedSize, selectedColor)
                        }
                      >
                        AÑADIR AL CARRITO <ArrowRight size={17} />
                      </button>
                    )}
                    </>
                  )
                })()}

                <p className="product-detail-footnote">
                  PEDIDOS Y ENVÍOS CONFIRMADOS POR WHATSAPP.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
      {cartOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}>
        <aside className="side-drawer" aria-label="Carrito de compras">
          <div className="drawer-header"><div><p className="eyebrow">TU SELECCIÓN</p><h2>CARRITO <span>({totalItems})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X /></button></div>
          {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={34} /><h3>ESTÁ VACÍO.</h3><p>Tu próxima pieza está ahí fuera.</p><button className="primary-button" onClick={() => setCartOpen(false)}>SEGUIR EXPLORANDO <ArrowRight size={16} /></button></div> :
            <><div className="cart-items">{cart.map((item, index) => <div className="cart-item" key={`${item.product.id}-${item.size}-${item.color}`}>
              <img src={item.product.image_url} alt={item.product.name} /><div className="cart-item-info"><p className="product-category">{item.product.category}</p><h3>{item.product.name}</h3><p>{item.size} / {item.color}</p><div className="quantity-control"><button onClick={() => changeQuantity(index, -1)} aria-label="Restar uno"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(index, 1)} aria-label="Agregar uno"><Plus size={13} /></button></div></div><strong>{money(item.product.price * item.quantity)}</strong>
            </div>)}</div><div className="cart-summary"><div><span>SUBTOTAL</span><strong>{money(total)}</strong></div><p>El envío se confirma por WhatsApp.</p>{notice && <p className="notice">{notice}</p>}<button className="primary-button full-button" onClick={checkoutWhatsApp}>PEDIR POR WHATSAPP <ArrowRight size={17} /></button><button className="text-button" onClick={() => setCartOpen(false)}>SEGUIR COMPRANDO</button></div></>}
        </aside>
      </div>}

      {loginOpen && <div className="overlay modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false) }}>
        <section className="login-modal" aria-label="Iniciar sesión"><button className="icon-button modal-close" onClick={() => setLoginOpen(false)} aria-label="Cerrar"><X /></button><span className="stamp-flower">✳</span><p className="eyebrow">ACCESO PRIVADO</p><h2>QUÉ BUENO<br />TENERTE <span>DE VUELTA.</span></h2><form onSubmit={signIn}><label>EMAIL<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" /></label><label>CONTRASEÑA<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></label>{notice && <p className="notice">{notice}</p>}<button className="primary-button full-button" type="submit" disabled={loading}>{loading ? 'ENTRANDO...' : 'INICIAR SESIÓN'} <ArrowRight size={16} /></button></form><p className="login-footnote">Acceso exclusivo para administración.</p></section>
      </div>}
    </div>
  )
}