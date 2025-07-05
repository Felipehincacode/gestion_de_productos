/*
  script.js
  Sistema de gestión de inventario para Mercados La Convención
  Este archivo contiene toda la lógica de interacción con la API (JSON Server) y la interfaz de usuario.
  Todas las funciones y variables están comentadas para facilitar la comprensión y el mantenimiento.
*/

// Variables globales para el estado de la aplicación
let products = []            // Lista de productos obtenidos del servidor
let editingProductId = null  // ID del producto que se está editando actualmente
let productToDelete = null   // ID del producto que se va a eliminar

// Elementos del DOM utilizados en la interfaz
const productForm = document.getElementById("product-form")
const formTitle = document.getElementById("form-title")
const submitBtn = document.getElementById("submit-btn")
const cancelBtn = document.getElementById("cancel-btn")
const productsContainer = document.getElementById("products-container")
const productsCount = document.getElementById("products-count")
const searchInput = document.getElementById("search-input")
const categoryFilter = document.getElementById("category-filter")
const resetFiltersBtn = document.getElementById("reset-filters")
const deleteModal = document.getElementById("delete-modal")
const addModal = document.getElementById("product-modal")
const openAddModalBtn = document.getElementById("open-add-modal")

// URL base de la API (JSON Server)
const API_URL = "http://localhost:3001/products"

// Colores personalizados para cada categoría
const CATEGORY_COLORS = {
  "Abarrotes": "#fbbf24",
  "Lácteos": "#60a5fa",
  "Carnes": "#f87171",
  "Bebidas": "#34d399",
  "Limpieza": "#a78bfa",
  "Otros": "#f472b6"
}

// Inicialización de la aplicación al cargar el DOM
// Obtiene los productos y configura los eventos
//
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts()
  setupEventListeners()
})

// Obtiene todos los productos desde la API y los muestra en pantalla
async function fetchProducts() {
  try {
    const res = await fetch(API_URL)
    products = await res.json()
    renderProducts()
  } catch (err) {
    showNotification("No se pudo cargar el inventario. ¿Está corriendo el servidor?", "error")
  }
}

// Envía un nuevo producto a la API para crearlo
async function createProduct(productData) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
    if (!res.ok) throw new Error()
    await fetchProducts()
    showNotification("¡Producto agregado!", "success")
    closeAddModal()
  } catch {
    showNotification("Error al agregar producto", "error")
  }
}

// Actualiza un producto existente en la API
async function updateProduct(id, productData) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
    if (!res.ok) throw new Error()
    await fetchProducts()
    showNotification("¡Producto actualizado!", "success")
    closeAddModal()
  } catch {
    showNotification("Error al actualizar producto", "error")
  }
}

// Elimina un producto de la API
async function deleteProduct(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error()
    await fetchProducts()
    showNotification("¡Producto eliminado!", "success")
  } catch {
    showNotification("Error al eliminar producto", "error")
  }
}

// Configura todos los eventos de la interfaz
function setupEventListeners() {
  productForm.addEventListener("submit", handleFormSubmit)
  cancelBtn.addEventListener("click", () => {
    cancelEdit()
    closeAddModal()
  })
  searchInput.addEventListener("input", renderProducts)
  categoryFilter.addEventListener("change", renderProducts)
  resetFiltersBtn.addEventListener("click", () => {
    searchInput.value = ""
    categoryFilter.value = ""
    renderProducts()
  })
  document.getElementById("confirm-delete").addEventListener("click", confirmDelete)
  document.getElementById("cancel-delete").addEventListener("click", closeDeleteModal)
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) closeDeleteModal()
  })
  openAddModalBtn.addEventListener("click", () => {
    resetForm()
    openAddModal()
  })
  addModal.addEventListener("click", (e) => {
    if (e.target === addModal) closeAddModal()
  })
}

// Abre el modal de agregar/editar producto
function openAddModal() {
  addModal.classList.add("show")
  document.body.style.overflow = "hidden"
}

// Cierra el modal de agregar/editar producto
function closeAddModal() {
  addModal.classList.remove("show")
  document.body.style.overflow = "auto"
}

// Maneja el envío del formulario para crear o editar productos
function handleFormSubmit(e) {
  e.preventDefault()
  const formData = {
    name: document.getElementById("product-name").value.trim(),
    price: Number.parseFloat(document.getElementById("product-price").value),
    category: document.getElementById("product-category").value,
    description: document.getElementById("product-description").value.trim(),
  }
  if (editingProductId) {
    updateProduct(editingProductId, formData)
  } else {
    createProduct(formData)
  }
  resetForm()
}

// Muestra los productos en la interfaz, aplicando filtros de búsqueda y categoría
function renderProducts() {
  const search = searchInput.value.toLowerCase()
  const category = categoryFilter.value
  let filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
    const matchesCategory = !category || p.category === category
    return matchesSearch && matchesCategory
  })
  productsCount.textContent = `${filtered.length} producto${filtered.length !== 1 ? "s" : ""}`
  if (filtered.length === 0) {
    productsContainer.innerHTML = `<div class=\"empty-state\"><h3>No se encontraron productos</h3><p>¡Agrega el primero!</p></div>`
    return
  }
  productsContainer.innerHTML = filtered.map(product => `
    <div class=\"product-card cute-card\" style=\"align-items:center;\">
      <div class=\"product-header\" style=\"justify-content:center;\">
        <h3 class=\"product-name\">${escapeHtml(product.name)}</h3>
      </div>
      <div class=\"product-category\" style=\"background:${CATEGORY_COLORS[product.category]||'#2563eb'};color:#fff;\">${escapeHtml(product.category)}</div>
      <span class=\"product-price\">$${product.price.toFixed(2)}</span>
      <div class=\"product-description-hover\">
        <p class=\"product-description\">${escapeHtml(product.description)}</p>
      </div>
      <div class=\"product-actions\">
        <button class=\"btn-edit\" onclick=\"window.editProduct(${product.id})\">Editar</button>
        <button class=\"btn-delete\" onclick=\"window.showDeleteModal(${product.id})\">Eliminar</button>
      </div>
    </div>
  `).join("")
}

// Permite editar un producto, llenando el formulario con sus datos y abriendo el modal
window.editProduct = function(id) {
  const product = products.find((p) => p.id === id)
  if (!product) return
  editingProductId = id
  document.getElementById("product-id").value = product.id
  document.getElementById("product-name").value = product.name
  document.getElementById("product-price").value = product.price
  document.getElementById("product-category").value = product.category
  document.getElementById("product-description").value = product.description
  formTitle.textContent = "Editar Producto"
  submitBtn.textContent = "Actualizar Producto"
  cancelBtn.style.display = "inline-block"
  openAddModal()
}

// Cancela la edición y limpia el formulario
function cancelEdit() {
  resetForm()
}

// Limpia el formulario y restablece el estado de edición
function resetForm() {
  productForm.reset()
  editingProductId = null
  formTitle.textContent = "Agregar Producto"
  submitBtn.textContent = "Agregar Producto"
  cancelBtn.style.display = "none"
}

// Muestra el modal de confirmación para eliminar un producto
window.showDeleteModal = function(id) {
  productToDelete = id
  deleteModal.style.display = "block"
}

// Cierra el modal de eliminación
function closeDeleteModal() {
  deleteModal.style.display = "none"
  productToDelete = null
}

// Confirma la eliminación del producto seleccionado
function confirmDelete() {
  if (productToDelete) {
    deleteProduct(productToDelete)
    closeDeleteModal()
  }
}

// Escapa caracteres especiales para evitar problemas de seguridad (XSS)
function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }
  return text.replace(/[&<>\"]/g, (m) => map[m])
}

// Muestra notificaciones flotantes en la interfaz
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "18px 28px",
    borderRadius: "16px",
    color: "white",
    fontWeight: "600",
    zIndex: "9999",
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
    fontSize: "1.1rem"
  })
  const colors = { success: "#34d399", error: "#ef4444", info: "#2563eb" }
  notification.style.backgroundColor = colors[type] || colors.info
  document.body.appendChild(notification)
  setTimeout(() => { notification.style.transform = "translateX(0)" }, 100)
  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => { document.body.removeChild(notification) }, 300)
  }, 3000)
}
