// Global state
let allData = null;
let currentBrand = null;
let filteredModels = [];
let searchQuery = '';
let sortOrder = 'default';
let currentSlide = 0;
let sliderInterval = null;

// Utility functions
function q(sel, ctx = document) {
  return ctx.querySelector(sel);
}

function qAll(sel, ctx = document) {
  return Array.from(ctx.querySelectorAll(sel));
}

// Fetch data
async function fetchData() {
  const res = await fetch('data.json');
  if (!res.ok) throw new Error('data.json not found');
  return await res.json();
}

// Update statistics
function updateStats(brands) {
  const totalBrands = brands.length;
  const totalModels = brands.reduce((sum, b) => sum + (b.models || []).length, 0);
  
  q('#totalBrands').textContent = totalBrands;
  q('#totalModels').textContent = totalModels;
}

// Render brands
function renderBrands(brands) {
  const container = q('#brandList');
  container.innerHTML = '';
  
  // Sort brands alphabetically
  const sortedBrands = [...brands].sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
  
  sortedBrands.forEach(brand => {
    const brandEl = document.createElement('div');
    brandEl.className = 'brand';
    brandEl.dataset.name = brand.name;
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'brand-icon';
    
    if (brand.brand_icon) {
      const img = document.createElement('img');
      img.src = brand.brand_icon;
      img.alt = `${brand.name} logo`;
      img.style.width = '32px';
      img.style.height = '32px';
      img.style.objectFit = 'contain';
      iconContainer.appendChild(img);
    } else {
      iconContainer.textContent = brand.name.substring(0, 2).toUpperCase();
    }
    
    const nameEl = document.createElement('div');
    nameEl.className = 'brand-name';
    nameEl.textContent = brand.name;
    
    const countEl = document.createElement('div');
    countEl.className = 'brand-count';
    countEl.textContent = `${(brand.models || []).length} моделей`;
    
    brandEl.appendChild(iconContainer);
    brandEl.appendChild(nameEl);
    brandEl.appendChild(countEl);
    
    brandEl.addEventListener('click', () => selectBrand(brand));
    
    container.appendChild(brandEl);
  });
  
  // Populate footer brands
  const footerBrands = q('#footerBrands');
  footerBrands.innerHTML = '';
  sortedBrands.slice(0, 4).forEach(brand => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = brand.name;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      selectBrand(brand);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    li.appendChild(a);
    footerBrands.appendChild(li);
  });
}

// Select brand
function selectBrand(brand) {
  currentBrand = brand;
  
  // Update active state
  qAll('.brand').forEach(el => el.classList.remove('active'));
  const brandEl = q(`.brand[data-name="${brand.name}"]`);
  if (brandEl) brandEl.classList.add('active');
  
  // Update title
  q('#resultsTitle').textContent = brand.name;
  
  // Apply filters
  applyFilters();
}

// Apply filters and search
function applyFilters() {
  if (!currentBrand) {
    showAllModels();
    return;
  }
  
  let models = [...(currentBrand.models || [])];
  
  // Apply search
  if (searchQuery) {
    models = models.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply sorting
  switch (sortOrder) {
    case 'price-asc':
      models.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-desc':
      models.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'name-asc':
      models.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      break;
    case 'name-desc':
      models.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
      break;
    default:
      // Keep original order
      break;
  }
  
  filteredModels = models;
  renderModels(models);
}

// Show all models from all brands
function showAllModels() {
  if (!allData) return;
  
  let allModels = [];
  allData.brands.forEach(brand => {
    (brand.models || []).forEach(model => {
      allModels.push({ ...model, brandName: brand.name });
    });
  });
  
  // Apply search
  if (searchQuery) {
    allModels = allModels.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.brandName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply sorting
  switch (sortOrder) {
    case 'price-asc':
      allModels.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-desc':
      allModels.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'name-asc':
      allModels.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      break;
    case 'name-desc':
      allModels.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
      break;
  }
  
  q('#resultsTitle').textContent = searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Все модели';
  filteredModels = allModels;
  renderModels(allModels);
}

// Render models
function renderModels(models) {
  const grid = q('#modelGrid');
  const noResults = q('#noResults');
  const resultsCount = q('#resultsCount');
  
  resultsCount.textContent = `${models.length} ${getModelWord(models.length)}`;
  
  if (models.length === 0) {
    grid.style.display = 'none';
    noResults.style.display = 'flex';
    return;
  }
  
  grid.style.display = 'grid';
  noResults.style.display = 'none';
  grid.innerHTML = '';
  
  models.forEach((model, idx) => {
    const card = document.createElement('article');
    card.className = 'model';
    card.style.animation = `fadeIn 0.5s ease-out ${idx * 0.05}s both`;
    
    // Image
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'model-image';
    
    if (model.image) {
      const img = document.createElement('img');
      img.src = model.image;
      img.alt = model.name;
      img.loading = 'lazy';
      imageWrapper.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'placeholder';
      placeholder.textContent = '📷';
      imageWrapper.appendChild(placeholder);
    }
    
    // Info
    const info = document.createElement('div');
    info.className = 'model-info';
    
    if (model.brandName) {
      const brandLabel = document.createElement('div');
      brandLabel.className = 'model-brand';
      brandLabel.textContent = model.brandName;
      brandLabel.style.fontSize = '0.75rem';
      brandLabel.style.color = 'var(--text-accent)';
      brandLabel.style.fontWeight = '600';
      brandLabel.style.textTransform = 'uppercase';
      brandLabel.style.letterSpacing = '1px';
      brandLabel.style.marginBottom = '0.5rem';
      info.appendChild(brandLabel);
    }
    
    const name = document.createElement('h3');
    name.className = 'model-name';
    name.textContent = model.name.replace(/_/g, ' ');
    
    const price = document.createElement('div');
    price.className = 'model-price';
    price.textContent = model.price ? 
      (model.price_estimated ? `≈ $${model.price}` : `$${model.price}`) : 
      'Узнать цену';
    
    const sizes = document.createElement('div');
    sizes.className = 'model-sizes';
    sizes.textContent = model.sizes && model.sizes.length ? 
      `Размеры: ${model.sizes.join(', ')}` : '';
    
    const desc = document.createElement('p');
    desc.className = 'model-description';
    desc.textContent = model.description || '';
    
    info.appendChild(name);
    info.appendChild(price);
    if (sizes.textContent) info.appendChild(sizes);
    if (desc.textContent) info.appendChild(desc);
    
    card.appendChild(imageWrapper);
    card.appendChild(info);
    
    card.addEventListener('click', () => openModal(model));
    
    grid.appendChild(card);
  });
}

// Get correct word form for model count
function getModelWord(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'моделей';
  }
  
  if (lastDigit === 1) return 'модель';
  if (lastDigit >= 2 && lastDigit <= 4) return 'модели';
  return 'моделей';
}

// Modal functions
function openModal(model) {
  const modal = q('#modal');
  
  q('#modalTitle').textContent = model.name.replace(/_/g, ' ');
  q('#modalPrice').textContent = model.price ? 
    (model.price_estimated ? `≈ $${model.price}` : `$${model.price}`) : 
    'Уточнить цену';
  q('#modalDescription').textContent = model.description || 'Описание отсутствует';
  
  const modalImg = q('#modalImg');
  const modalPlaceholder = q('#modalPlaceholder');
  
  if (model.image) {
    modalImg.src = model.image;
    modalImg.style.display = 'block';
    modalPlaceholder.style.display = 'none';
  } else {
    modalImg.style.display = 'none';
    modalPlaceholder.style.display = 'flex';
  }
  
  const sizesContainer = q('#modalSizes');
  sizesContainer.innerHTML = '';
  
  if (model.sizes && model.sizes.length) {
    model.sizes.forEach(size => {
      const badge = document.createElement('span');
      badge.className = 'size-badge';
      badge.textContent = size;
      sizesContainer.appendChild(badge);
    });
  }
  
  modal.classList.add('active');
  document.body.style.overflow = '';
}

// Hero Slider
function initHeroSlider() {
  const slides = qAll('.hero-slide');
  const dots = qAll('.hero-dot');
  
  if (slides.length === 0) return;
  
  function showSlide(index) {
    currentSlide = index;
    
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }
  
  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }
  
  // Dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      resetSliderInterval();
    });
  });
  
  // Auto-advance slider
  function resetSliderInterval() {
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(nextSlide, 5000);
  }
  
  resetSliderInterval();
}

// Reviews Slideshow
function initReviews() {
  const avatars = qAll('.review-avatar');
  const reviews = qAll('.review-content');
  
  if (avatars.length === 0 || reviews.length === 0) return;
  
  avatars.forEach(avatar => {
    avatar.addEventListener('click', () => {
      const reviewId = avatar.dataset.review;
      
      // Remove active from all
      avatars.forEach(av => av.classList.remove('active'));
      reviews.forEach(rev => rev.classList.remove('active'));
      
      // Add active to clicked
      avatar.classList.add('active');
      const targetReview = q(`#${reviewId}`);
      if (targetReview) {
        targetReview.classList.add('active');
      }
    });
  });
}

// FAQ Modal
function initFAQModal() {
  const faqBtn = q('#faqIconBtn');
  const faqModal = q('#faqModal');
  const faqClose = q('#faqModalClose');
  
  if (!faqBtn || !faqModal) return;
  
  // Open FAQ modal
  faqBtn.addEventListener('click', () => {
    faqModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Initialize accordion after modal opens
    setTimeout(() => {
      initFAQAccordion();
    }, 50);
  });
  
  // Close FAQ modal
  if (faqClose) {
    faqClose.addEventListener('click', closeFAQModal);
  }
  
  faqModal.addEventListener('click', (e) => {
    if (e.target === faqModal) {
      closeFAQModal();
    }
  });
}

// FAQ Accordion - separate function
function initFAQAccordion() {
  const faqItems = qAll('#faqModal .faq-item');
  
  if (faqItems.length === 0) {
    return;
  }
  
  faqItems.forEach((item, index) => {
    const question = item.querySelector('.faq-question');
    
    if (question) {
      // Remove old listeners by cloning
      const newQuestion = question.cloneNode(true);
      question.parentNode.replaceChild(newQuestion, question);
      
      newQuestion.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isActive = item.classList.contains('active');
        
        // Close all items
        faqItems.forEach(faqItem => {
          faqItem.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

function closeFAQModal() {
  const faqModal = q('#faqModal');
  if (faqModal) {
    faqModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// FAQ Accordion (deprecated - kept for compatibility)
function initFAQ() {
  const faqItems = qAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all items
      faqItems.forEach(faqItem => faqItem.classList.remove('active'));
      
      // Open clicked item if it wasn't active
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// Contact Form
function initContactForm() {
  const form = q('#contactForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('.form-submit');
    const submitText = form.querySelector('.submit-text');
    const submitLoader = form.querySelector('.submit-loader');
    const messageEl = q('#formMessage');
    
    // Get form data
    const formData = {
      name: q('#contactName').value.trim(),
      phone: q('#contactPhone').value.trim(),
      to: q('#contactEmail').value.trim(),
      comment: q('#contactComment').value.trim()
    };
    
    // Validate
    if (!formData.name || !formData.phone || !formData.to) {
      showFormMessage('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.to)) {
      showFormMessage('Пожалуйста, введите корректный email адрес', 'error');
      return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoader.style.display = 'inline';
    messageEl.style.display = 'none';
    
    try {
      const response = await fetch('https://webdev-api.loftschool.com/sendmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.status === 'success' || response.ok) {
        showFormMessage('Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
        form.reset();
      } else {
        showFormMessage(result.message || 'Произошла ошибка при отправке. Попробуйте позже.', 'error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showFormMessage('Произошла ошибка при отправке. Проверьте подключение к интернету.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitText.style.display = 'inline';
      submitLoader.style.display = 'none';
    }
  });
}

function showFormMessage(message, type) {
  const messageEl = q('#formMessage');
  messageEl.textContent = message;
  messageEl.className = `form-message ${type}`;
  messageEl.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 5000);
}

// Mobile Menu
function initMobileMenu() {
  const burgerMenu = q('#burgerMenu');
  const mobileMenu = q('#mobileMenu');
  const mobileMenuClose = q('#mobileMenuClose');
  const mobileLinks = qAll('.mobile-menu-link');
  
  if (!burgerMenu || !mobileMenu) return;
  
  function openMobileMenu() {
    mobileMenu.classList.add('active');
    burgerMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    burgerMenu.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  burgerMenu.addEventListener('click', () => {
    if (mobileMenu.classList.contains('active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
  
  mobileMenuClose.addEventListener('click', closeMobileMenu);
  
  // Close on link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      closeMobileMenu();
      
      // Smooth scroll to section
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = q(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
  
  // Close on outside click
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      closeMobileMenu();
    }
  });
}

// Helper function to select brand by name
window.selectBrandByName = function(brandName) {
  if (!allData) return;
  
  const brand = allData.brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  if (brand) {
    selectBrand(brand);
    
    // Scroll to models section
    const searchSection = q('.search-section');
    if (searchSection) {
      setTimeout(() => {
        searchSection.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
};

function closeModal() {
  const modal = q('#modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Video player
function initVideoPlayer() {
  const videoOverlay = q('.video-overlay');
  const playBtn = q('.video-play-btn');
  const videoFrame = q('.video-player iframe');
  
  if (!videoOverlay || !playBtn || !videoFrame) return;
  
  // Load YouTube iframe API
  let player;
  let isAPIReady = false;
  
  // Create script tag for YouTube API
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
  
  // API ready callback
  window.onYouTubeIframeAPIReady = function() {
    isAPIReady = true;
    player = new YT.Player(videoFrame, {
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
  };
  
  // Player state change handler
  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      videoOverlay.classList.add('hidden');
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
      videoOverlay.classList.remove('hidden');
    }
  }
  
  // Play button click handler
  playBtn.addEventListener('click', () => {
    if (isAPIReady && player && player.playVideo) {
      player.playVideo();
      videoOverlay.classList.add('hidden');
    } else {
      // Fallback: try to play via iframe src manipulation
      const currentSrc = videoFrame.src;
      if (!currentSrc.includes('autoplay=1')) {
        videoFrame.src = currentSrc + '&autoplay=1';
        videoOverlay.classList.add('hidden');
      }
    }
  });
  
  // Overlay click handler
  videoOverlay.addEventListener('click', (e) => {
    if (e.target === videoOverlay || e.target.closest('.video-play-btn')) {
      playBtn.click();
    }
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  try {
    allData = await fetchData();
    const brands = allData.brands || [];
    
    updateStats(brands);
    renderBrands(brands);
    
    // Auto-select first brand
    if (brands.length > 0) {
      setTimeout(() => selectBrand(brands[0]), 100);
    }
    
    // Search input
    const searchInput = q('#searchInput');
    const searchClear = q('#searchClear');
    
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      searchClear.style.display = searchQuery ? 'flex' : 'none';
      
      if (searchQuery) {
        currentBrand = null;
        qAll('.brand').forEach(el => el.classList.remove('active'));
        showAllModels();
      } else if (currentBrand) {
        applyFilters();
      } else {
        // Show first brand if nothing selected
        if (brands.length > 0) {
          selectBrand(brands[0]);
        }
      }
    });
    
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClear.style.display = 'none';
      if (brands.length > 0) {
        selectBrand(brands[0]);
      }
    });
    
    // Sort select
    q('#sortSelect').addEventListener('change', (e) => {
      sortOrder = e.target.value;
      if (currentBrand) {
        applyFilters();
      } else {
        showAllModels();
      }
    });
    
    // Reset filter
    q('#resetFilter').addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClear.style.display = 'none';
      q('#sortSelect').value = 'default';
      sortOrder = 'default';
      
      if (brands.length > 0) {
        selectBrand(brands[0]);
      }
    });
    
    // Modal close events
    q('#modalClose').addEventListener('click', closeModal);
    q('#modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') {
        closeModal();
      }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (q('#modal').classList.contains('active')) {
          closeModal();
        }
        if (q('#faqModal') && q('#faqModal').classList.contains('active')) {
          closeFAQModal();
        }
      }
    });
    
    // Initialize new features
    initHeroSlider();
    initFAQ();
    initFAQModal();
    initReviews();
    initContactForm();
    initMobileMenu();
    initVideoPlayer();
    
  } catch (err) {
    document.body.innerHTML = '<div style="padding:2rem;color:#f56565;text-align:center;font-size:1.2rem">⚠️ Ошибка загрузки данных. Проверьте data.json</div>';
    console.error(err);
  }
});

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
