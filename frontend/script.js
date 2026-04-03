// API Configuration
const API_URL = '/api';

// Auth functions
function setAuthToken(token) {
  localStorage.setItem('token', token);
}

function getAuthToken() {
  return localStorage.getItem('token');
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
  return !!getAuthToken();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// API calls
async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  
  return data;
}

// Redirect based on role
function redirectToDashboard() {
  const user = getUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  
  switch(user.role) {
    case 'admin':
      window.location.href = '/admin-dashboard.html';
      break;
    case 'affiliate':
      window.location.href = '/affiliate-dashboard.html';
      break;
    case 'seller':
      window.location.href = '/seller-dashboard.html';
      break;
    default:
      window.location.href = '/login.html';
  }
}

// Load products
async function loadProducts(containerId, limit = null) {
  try {
    const products = await apiCall('/data/products');
    let displayProducts = products;
    if (limit) displayProducts = products.slice(0, limit);
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = displayProducts.map(product => `
      <div class="product-card">
        <img src="${product.imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'">
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-description">${product.description || 'Curso completo e atualizado'}</p>
          <p class="product-price">R$ ${product.price.toFixed(2)}</p>
          <button onclick="buyProduct('${product.id}')" class="btn" style="width: 100%;">
            Comprar Agora
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<p style="text-align:center;">Erro ao carregar produtos. Tente novamente.</p>';
    }
  }
}

// Buy product
async function buyProduct(productId) {
  if (!isAuthenticated()) {
    if (confirm('Você precisa estar logado para comprar. Deseja fazer login?')) {
      window.location.href = '/login.html';
    }
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const affiliateCode = urlParams.get('ref');
  
  try {
    await apiCall('/data/sales', {
      method: 'POST',
      body: JSON.stringify({ productId, affiliateCode })
    });
    
    alert('✅ Compra realizada com sucesso!');
    window.location.reload();
  } catch (error) {
    alert('❌ Erro ao realizar compra: ' + error.message);
  }
}

// Show message
function showMessage(message, type = 'success') {
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.className = `alert alert-${type}`;
    messageDiv.innerHTML = message;
    messageDiv.style.display = 'block';
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }
}

// Export functions
window.buyProduct = buyProduct;
window.logout = logout;
window.showMessage = showMessage;
