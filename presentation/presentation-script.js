// Apresentação Picking System v2.0 - Script de Navegação

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const slideIndicator = document.getElementById('slide-indicator');

// Cria os indicadores de slide
function createIndicators() {
  slideIndicator.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    slideIndicator.appendChild(dot);
  }
}

// Atualiza os indicadores
function updateIndicators() {
  const dots = slideIndicator.querySelectorAll('.dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

// Atualiza os botões
function updateButtons() {
  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === totalSlides - 1;
}

// Mostra o slide
function showSlide(index) {
  // Remove a classe active de todos os slides
  slides.forEach(slide => {
    slide.classList.remove('active', 'prev');
    
    // Pausa qualquer vídeo que esteja tocando
    const video = slide.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 0; // Reinicia o vídeo
    }
  });

  // Adiciona a classe active ao slide atual
  slides[index].classList.add('active');
  
  // Inicia o vídeo do slide atual se houver
  const currentVideo = slides[index].querySelector('video');
  if (currentVideo) {
    // Espera um pouco para garantir que o slide está visível
    setTimeout(() => {
      currentVideo.play().catch(err => {
        console.log('Autoplay bloqueado, adicionando controles:', err);
        currentVideo.controls = true;
      });
    }, 100);
  }

  // Atualiza os controles
  updateIndicators();
  updateButtons();
}

// Vai para um slide específico
function goToSlide(index) {
  if (index >= 0 && index < totalSlides) {
    currentSlide = index;
    showSlide(currentSlide);
  }
}

// Próximo slide
function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    currentSlide++;
    showSlide(currentSlide);
  }
}

// Slide anterior
function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    showSlide(currentSlide);
  }
}

// Event listeners
prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

// Navegação por teclado
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowRight':
    case 'PageDown':
    case ' ': // Espaço
      e.preventDefault();
      nextSlide();
      break;
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault();
      prevSlide();
      break;
    case 'Home':
      e.preventDefault();
      goToSlide(0);
      break;
    case 'End':
      e.preventDefault();
      goToSlide(totalSlides - 1);
      break;
  }
});

// Navegação por touch (swipe em dispositivos móveis)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - próximo slide
      nextSlide();
    } else {
      // Swipe right - slide anterior
      prevSlide();
    }
  }
}

// Inicialização
createIndicators();
showSlide(0);

// Modo apresentação (fullscreen)
document.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }
});

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Impedir zoom acidental
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

// Log de inicialização
console.log('📊 Apresentação Picking System v2.0 carregada');
console.log(`Total de slides: ${totalSlides}`);
console.log('Controles:');
console.log('  - Setas ←/→ para navegar');
console.log('  - Home/End para ir ao início/fim');
console.log('  - Espaço para avançar');
console.log('  - F11 para fullscreen');

// ========== CARROSSEL DE IMAGENS ==========

let carouselIntervals = {};

function initCarousels() {
  // Encontra todos os carrosséis na apresentação
  const carousels = document.querySelectorAll('.image-carousel');
  
  carousels.forEach((carousel, carouselIndex) => {
    const images = carousel.querySelectorAll('.carousel-image');
    const indicators = carousel.querySelectorAll('.indicator');
    const placeholder = carousel.querySelector('.carousel-placeholder');
    
    // Verifica se há imagens carregadas
    let hasImages = false;
    images.forEach(img => {
      if (img.complete && img.naturalHeight !== 0) {
        hasImages = true;
      }
    });
    
    // Mostra placeholder se não houver imagens
    if (!hasImages && placeholder) {
      placeholder.style.display = 'flex';
      return;
    } else if (placeholder) {
      placeholder.style.display = 'none';
    }
    
    if (images.length <= 1) return; // Não precisa de carrossel para uma imagem
    
    let currentIndex = 0;
    
    // Função para mostrar imagem específica
    function showImage(index) {
      images.forEach((img, i) => {
        img.classList.toggle('active', i === index);
      });
      indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === index);
      });
    }
    
    // Função para próxima imagem
    function nextImage() {
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    }
    
    // Clique nos indicadores
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        currentIndex = index;
        showImage(currentIndex);
        // Reinicia o intervalo
        clearInterval(carouselIntervals[carouselIndex]);
        carouselIntervals[carouselIndex] = setInterval(nextImage, 4000);
      });
    });
    
    // Inicia o carrossel automático (troca a cada 4 segundos)
    carouselIntervals[carouselIndex] = setInterval(nextImage, 4000);
  });
}

// Pausa carrosséis quando muda de slide
function pauseCarousels() {
  Object.values(carouselIntervals).forEach(interval => {
    clearInterval(interval);
  });
  carouselIntervals = {};
}

// Reinicia carrosséis no slide atual
function resumeCarousels() {
  const activeSlide = document.querySelector('.slide.active');
  if (activeSlide) {
    const carousel = activeSlide.querySelector('.image-carousel');
    if (carousel) {
      initCarousels();
    }
  }
}

// Modifica a função showSlide para gerenciar carrosséis
const originalShowSlide = showSlide;
showSlide = function(index) {
  pauseCarousels();
  originalShowSlide(index);
  setTimeout(resumeCarousels, 500);
};

// Inicializa a apresentação
createIndicators();
showSlide(0);
initCarousels();

// Tenta iniciar o vídeo do formulário após carregamento
setTimeout(() => {
  const formularioVideo = document.getElementById('formulario-video');
  if (formularioVideo && currentSlide === 0) {
    formularioVideo.play().catch(err => {
      console.log('Autoplay bloqueado, adicionando controles:', err);
      formularioVideo.controls = true;
    });
  }
}, 1000);
