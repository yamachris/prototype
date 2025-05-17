'use client';

// Le plus simple possible - pas de React complexe, juste du JS pur
// Composant injecté directement dans le DOM

export function setupBasicChat(gameStore) {
  // S'assurer qu'on est côté client
  if (typeof window === 'undefined') return;
  
  // Créer les éléments de base
  const chatContainer = document.createElement('div');
  const chatBubble = document.createElement('div');
  const chatIcon = document.createElement('div');
  
  // Ajouter du texte initial à la bulle
  chatBubble.textContent = 'Double-cliquez pour déplacer';
  
  // Ajouter l'emoji au bouton
  chatIcon.textContent = '💬';
  
  // Définir les styles
  chatContainer.style.position = 'fixed';
  chatContainer.style.bottom = '100px';
  chatContainer.style.right = '20px';
  chatContainer.style.display = 'flex';
  chatContainer.style.alignItems = 'center';
  chatContainer.style.zIndex = '9999';
  
  chatBubble.style.backgroundColor = '#1e40af';
  chatBubble.style.color = 'white';
  chatBubble.style.padding = '10px 15px';
  chatBubble.style.borderRadius = '8px';
  chatBubble.style.marginRight = '10px';
  chatBubble.style.maxWidth = '250px';
  chatBubble.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  chatBubble.style.display = 'none';
  
  chatIcon.style.width = '50px';
  chatIcon.style.height = '50px';
  chatIcon.style.backgroundColor = '#1e40af';
  chatIcon.style.color = 'white';
  chatIcon.style.borderRadius = '50%';
  chatIcon.style.display = 'flex';
  chatIcon.style.justifyContent = 'center';
  chatIcon.style.alignItems = 'center';
  chatIcon.style.cursor = 'pointer';
  chatIcon.style.userSelect = 'none';
  chatIcon.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  chatIcon.style.border = '2px solid white';
  chatIcon.style.fontSize = '24px';
  
  // Centrer le texte dans l'icône
  chatIcon.style.display = 'flex';
  chatIcon.style.justifyContent = 'center';
  chatIcon.style.alignItems = 'center';
  
  // Ajouter les éléments au container
  chatContainer.appendChild(chatBubble);
  chatContainer.appendChild(chatIcon);
  
  // Ajouter le container au body
  document.body.appendChild(chatContainer);
  
  // Variables pour le drag & drop
  let isDragging = false;
  let isVisible = false;
  let offsetX = 0;
  let offsetY = 0;
  
  // Variables pour le double-clic
  let clickCount = 0;
  let singleClickTimer;
  
  // Gestionnaire de clic pour afficher/masquer la bulle
  chatIcon.addEventListener('click', () => {
    clickCount++;
    
    if (clickCount === 1) {
      singleClickTimer = setTimeout(() => {
        clickCount = 0;
        
        // Simple clic - toggle visibilité
        isVisible = !isVisible;
        chatBubble.style.display = isVisible ? 'block' : 'none';
      }, 300);
    } else if (clickCount === 2) {
      clearTimeout(singleClickTimer);
      clickCount = 0;
      
      // Double clic - prêt à déplacer
      chatContainer.style.cursor = 'grab';
    }
  });
  
  // Gestionnaire pour le déplacement
  chatContainer.addEventListener('mousedown', (e) => {
    if (e.target === chatIcon && e.button === 0) {
      e.preventDefault();
      
      // Calculer le décalage entre le clic et la position de l'élément
      const rect = chatContainer.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      isDragging = true;
      chatContainer.style.cursor = 'grabbing';
    }
  });
  
  // Gestionnaire pour suivre le mouvement
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Appliquer les nouvelles coordonnées
    chatContainer.style.left = x + 'px';
    chatContainer.style.right = 'auto';
    chatContainer.style.top = y + 'px';
    chatContainer.style.bottom = 'auto';
  });
  
  // Gestionnaire pour arrêter le déplacement
  document.addEventListener('mouseup', () => {
    isDragging = false;
    chatContainer.style.cursor = 'default';
  });
  
  // Suivre les messages du jeu
  let lastMessage = '';
  const unsubscribe = gameStore.subscribe(state => {
    if (state.message && state.message !== lastMessage) {
      lastMessage = state.message;
      chatBubble.textContent = lastMessage;
      
      // Afficher la bulle automatiquement sur nouveau message
      isVisible = true;
      chatBubble.style.display = 'block';
    }
  });
  
  // Nettoyer quand le composant est démonté
  return () => {
    unsubscribe();
    document.body.removeChild(chatContainer);
    document.removeEventListener('mousemove', null);
    document.removeEventListener('mouseup', null);
  };
}
