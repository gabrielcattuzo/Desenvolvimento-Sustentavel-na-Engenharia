/**
 * Site de Divulgação Científica - Desenvolvimento Sustentável
 * JavaScript para interatividade e navegação do site
 */

// ===== CONFIGURAÇÕES E CONSTANTES =====
const CONFIG = {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 150,
    FOCUS_TRAP_ENABLED: true,
    KEYBOARD_NAVIGATION: true,
    AUTO_CLOSE_DELAY: 5000
};

// ===== ELEMENTOS DO DOM =====
const elements = {
    menuToggle: document.getElementById('menuToggle'),
    navigationDrawer: document.getElementById('navigationDrawer'),
    drawerOverlay: document.getElementById('drawerOverlay'),
    navItems: document.querySelectorAll('.nav-item'),
    contentPages: document.querySelectorAll('.content-page'),
    pageTitle: document.getElementById('pageTitle'),
    pageDescription: document.getElementById('pageDescription'),
    contentArea: document.getElementById('contentArea'),
    mainContent: document.getElementById('main-content'),
    container: document.querySelector('.container')
};

// ===== DADOS DAS PÁGINAS =====
const pageData = {
    energia: {
        title: 'Energia Limpa',
        description: 'Entenda as principais fontes de energia renovável e como elas ajudam a reduzir emissões de gases do efeito estufa.',
        keywords: ['solar', 'eólica', 'hidrogênio', 'biomassa', 'renovável']
    },
    agua: {
        title: 'Gestão da Água',
        description: 'Gestão, saneamento e tecnologias de reuso para garantir acesso universal à água potável.',
        keywords: ['bacias', 'dessalinização', 'saneamento', 'purificação']
    },
    biodiversidade: {
        title: 'Biodiversidade',
        description: 'Conservação de espécies e habitats para manter o equilíbrio dos ecossistemas.',
        keywords: ['habitats', 'espécies', 'conservação', 'polinizadores']
    },
    agricultura: {
        title: 'Agricultura Sustentável',
        description: 'Agroecologia, solo e sistemas resilientes para produção de alimentos sustentável.',
        keywords: ['agroecologia', 'agrofloresta', 'solo', 'precisão']
    },
    residuos: {
        title: 'Gestão de Resíduos',
        description: 'Reduzir, reciclar e economia circular para minimizar impactos ambientais.',
        keywords: ['redução', 'circular', 'reciclagem', 'logística']
    },
    cidades: {
        title: 'Cidades e Mobilidade',
        description: 'Urbanismo, transporte e infraestrutura verde para cidades mais sustentáveis.',
        keywords: ['mobilidade', 'infraestrutura', 'transporte', 'inteligentes']
    },
    educacao: {
        title: 'Educação Ambiental',
        description: 'Comunicação científica e engajamento para formar cidadãos conscientes.',
        keywords: ['comunicação', 'escolar', 'engajamento', 'mídia']
    },
    politicas: {
        title: 'Políticas e Economia',
        description: 'Governança, incentivos e instrumentos econômicos para desenvolvimento sustentável.',
        keywords: ['instrumentos', 'governança', 'parcerias', 'financiamento']
    }
};

// ===== ESTADO DA APLICAÇÃO =====
const appState = {
    currentPage: 'energia',
    isDrawerOpen: false,
    isAnimating: false,
    focusedElement: null,
    lastInteraction: Date.now()
};

// ===== UTILITÁRIOS =====
const utils = {
    /**
     * Debounce function para otimizar performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Verifica se um elemento está visível na viewport
     */
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.right <= window.innerWidth;
    },

    /**
     * Smooth scroll para elemento
     */
    smoothScrollTo(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    },

    /**
     * Gera ID único
     */
    generateId() {
        return `id_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Sanitiza string para uso em URLs
     */
    sanitizeForUrl(str) {
        return str.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
};

// ===== GERENCIAMENTO DE FOCO =====
const focusManager = {
    focusableElements: [
        'button',
        '[href]',
        'input',
        'select',
        'textarea',
        '[tabindex]:not([tabindex="-1"])'
    ],

    /**
     * Obtém elementos focáveis dentro de um container
     */
    getFocusableElements(container) {
        return container.querySelectorAll(this.focusableElements.join(','));
    },

    /**
     * Configura trap de foco para modal/drawer
     */
    trapFocus(container) {
        const focusableElements = this.getFocusableElements(container);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        
        // Foca no primeiro elemento
        if (firstElement) {
            firstElement.focus();
        }

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    },

    /**
     * Restaura foco para elemento anterior
     */
    restoreFocus() {
        if (appState.focusedElement) {
            appState.focusedElement.focus();
            appState.focusedElement = null;
        }
    }
};

// ===== GERENCIAMENTO DE NAVEGAÇÃO =====
const navigationManager = {
    /**
     * Abre o drawer de navegação
     */
    openDrawer() {
        if (appState.isAnimating) return;
        
        appState.isAnimating = true;
        appState.isDrawerOpen = true;
        appState.focusedElement = document.activeElement;

        // Atualiza classes e atributos
        elements.navigationDrawer.classList.add('open');
        elements.menuToggle.classList.add('active');
        elements.menuToggle.setAttribute('aria-expanded', 'true');
        elements.navigationDrawer.setAttribute('aria-hidden', 'false');

        // Aplica efeito de desfoque no conteúdo principal
        if (elements.mainContent) {
            elements.mainContent.classList.add('blur-background');
        }

        // Previne scroll do body
        document.body.style.overflow = 'hidden';

        // Configura trap de foco
        if (CONFIG.FOCUS_TRAP_ENABLED) {
            this.removeFocusTrap = focusManager.trapFocus(elements.navigationDrawer);
        }

        // Anuncia mudança para screen readers
        this.announceToScreenReader('Menu aberto');

        setTimeout(() => {
            appState.isAnimating = false;
        }, CONFIG.ANIMATION_DURATION);
    },

    /**
     * Fecha o drawer de navegação
     */
    closeDrawer() {
        if (appState.isAnimating) return;
        
        appState.isAnimating = true;
        appState.isDrawerOpen = false;

        // Atualiza classes e atributos
        elements.navigationDrawer.classList.remove('open');
        elements.menuToggle.classList.remove('active');
        elements.menuToggle.setAttribute('aria-expanded', 'false');
        elements.navigationDrawer.setAttribute('aria-hidden', 'true');

        // Remove efeito de desfoque do conteúdo principal
        if (elements.mainContent) {
            elements.mainContent.classList.remove('blur-background');
        }

        // Restaura scroll do body
        document.body.style.overflow = '';

        // Remove trap de foco
        if (this.removeFocusTrap) {
            this.removeFocusTrap();
            this.removeFocusTrap = null;
        }

        // Restaura foco
        focusManager.restoreFocus();

        // Anuncia mudança para screen readers
        this.announceToScreenReader('Menu fechado');

        setTimeout(() => {
            appState.isAnimating = false;
        }, CONFIG.ANIMATION_DURATION);
    },

    /**
     * Alterna estado do drawer
     */
    toggleDrawer() {
        if (appState.isDrawerOpen) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    },

    /**
     * Anuncia mensagem para screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
};

// ===== GERENCIAMENTO DE PÁGINAS =====
const pageManager = {
    /**
     * Muda para uma página específica
     */
    changePage(targetPageId, updateHistory = true) {
        if (appState.isAnimating || targetPageId === appState.currentPage) return;
        
        const targetPage = document.getElementById(targetPageId);
        const pageInfo = pageData[targetPageId];
        
        if (!targetPage || !pageInfo) {
            console.warn(`Página não encontrada: ${targetPageId}`);
            return;
        }

        appState.isAnimating = true;

        // Atualiza página ativa
        elements.contentPages.forEach(page => {
            page.classList.remove('active');
        });

        // Atualiza navegação ativa
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === targetPageId);
            item.setAttribute('tabindex', item.dataset.target === targetPageId ? '0' : '-1');
        });

        // Animação de saída
        setTimeout(() => {
            // Atualiza conteúdo do hero
            elements.pageTitle.textContent = pageInfo.title;
            elements.pageDescription.textContent = pageInfo.description;

            // Mostra nova página
            targetPage.classList.add('active');

            // Atualiza estado
            appState.currentPage = targetPageId;

            // Atualiza URL
            if (updateHistory) {
                this.updateUrl(targetPageId);
            }

            // Anuncia mudança
            navigationManager.announceToScreenReader(`Página alterada para ${pageInfo.title}`);

            // Scroll para o topo do conteúdo
            utils.smoothScrollTo(elements.contentArea, 100);

            setTimeout(() => {
                appState.isAnimating = false;
            }, CONFIG.ANIMATION_DURATION);

        }, CONFIG.ANIMATION_DURATION / 2);

        // Fecha drawer em dispositivos móveis
        if (appState.isDrawerOpen) {
            setTimeout(() => {
                navigationManager.closeDrawer();
            }, 200);
        }
    },

    /**
     * Atualiza URL sem recarregar página
     */
    updateUrl(pageId) {
        const newUrl = `${window.location.pathname}#${pageId}`;
        history.pushState({ page: pageId }, '', newUrl);
    },

    /**
     * Carrega página baseada na URL atual
     */
    loadPageFromUrl() {
        const hash = window.location.hash.replace('#', '') || 'energia';
        if (pageData[hash]) {
            this.changePage(hash, false);
        }
    }
};

// ===== GERENCIAMENTO DE EVENTOS =====
const eventManager = {
    /**
     * Configura todos os event listeners
     */
    setupEventListeners() {
        // Menu toggle
        elements.menuToggle.addEventListener('click', () => {
            navigationManager.toggleDrawer();
        });

        // Navegação por teclado no menu toggle
        elements.menuToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigationManager.toggleDrawer();
            }
        });

        // Overlay do drawer
        elements.drawerOverlay.addEventListener('click', () => {
            navigationManager.closeDrawer();
        });

        // Items de navegação
        elements.navItems.forEach(item => {
            // Click
            item.addEventListener('click', () => {
                const targetPage = item.dataset.target;
                if (targetPage) {
                    pageManager.changePage(targetPage);
                }
            });

            // Navegação por teclado
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const targetPage = item.dataset.target;
                    if (targetPage) {
                        pageManager.changePage(targetPage);
                    }
                }
            });
        });

        // Navegação por setas no drawer
        this.setupArrowNavigation();

        // Escape para fechar drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && appState.isDrawerOpen) {
                navigationManager.closeDrawer();
            }
        });

        // Navegação do browser (back/forward)
        window.addEventListener('popstate', (e) => {
            const pageId = e.state?.page || window.location.hash.replace('#', '') || 'energia';
            if (pageData[pageId]) {
                pageManager.changePage(pageId, false);
            }
        });

        // Resize da janela
        window.addEventListener('resize', utils.debounce(() => {
            if (window.innerWidth > 768 && appState.isDrawerOpen) {
                navigationManager.closeDrawer();
            }
        }, CONFIG.DEBOUNCE_DELAY));

        // Detecção de inatividade
        this.setupInactivityDetection();
    },

    /**
     * Configura navegação por setas no drawer
     */
    setupArrowNavigation() {
        elements.navigationDrawer.addEventListener('keydown', (e) => {
            if (!CONFIG.KEYBOARD_NAVIGATION) return;

            const currentFocus = document.activeElement;
            const navItemsArray = Array.from(elements.navItems);
            const currentIndex = navItemsArray.indexOf(currentFocus);

            if (currentIndex === -1) return;

            let nextIndex;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % navItemsArray.length;
                    navItemsArray[nextIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = currentIndex === 0 ? navItemsArray.length - 1 : currentIndex - 1;
                    navItemsArray[nextIndex].focus();
                    break;
                case 'Home':
                    e.preventDefault();
                    navItemsArray[0].focus();
                    break;
                case 'End':
                    e.preventDefault();
                    navItemsArray[navItemsArray.length - 1].focus();
                    break;
            }
        });
    },

    /**
     * Configura detecção de inatividade
     */
    setupInactivityDetection() {
        const updateLastInteraction = () => {
            appState.lastInteraction = Date.now();
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateLastInteraction, { passive: true });
        });
    }
};

// ===== ANALYTICS E PERFORMANCE =====
const analytics = {
    /**
     * Registra evento de navegação
     */
    trackPageView(pageId) {
        // Aqui você pode integrar com Google Analytics, Mixpanel, etc.
        console.log(`Page view: ${pageId}`, {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });
    },

    /**
     * Registra interação do usuário
     */
    trackInteraction(action, element) {
        console.log(`User interaction: ${action}`, {
            element: element.tagName,
            timestamp: new Date().toISOString()
        });
    }
};

// ===== ACESSIBILIDADE =====
const accessibility = {
    /**
     * Configura melhorias de acessibilidade
     */
    setup() {
        // Adiciona skip links dinâmicos
        this.addSkipLinks();
        
        // Configura anúncios para mudanças de página
        this.setupPageChangeAnnouncements();
        
        // Melhora contraste em modo de alto contraste
        this.setupHighContrastMode();
    },

    /**
     * Adiciona skip links dinâmicos
     */
    addSkipLinks() {
        const skipToContent = document.querySelector('.skip-link');
        if (skipToContent) {
            skipToContent.addEventListener('click', (e) => {
                e.preventDefault();
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.focus();
                    mainContent.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    },

    /**
     * Configura anúncios para mudanças de página
     */
    setupPageChangeAnnouncements() {
        // Cria região live para anúncios
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    },

    /**
     * Configura modo de alto contraste
     */
    setupHighContrastMode() {
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
    }
};

// ===== INICIALIZAÇÃO =====
const app = {
    /**
     * Inicializa a aplicação
     */
    init() {
        // Verifica se todos os elementos necessários existem
        if (!this.validateElements()) {
            console.error('Elementos essenciais não encontrados no DOM');
            return;
        }

        // Configura acessibilidade
        accessibility.setup();

        // Configura event listeners
        eventManager.setupEventListeners();

        // Carrega página inicial baseada na URL
        pageManager.loadPageFromUrl();

        // Registra inicialização
        analytics.trackPageView(appState.currentPage);

        // Anuncia que a aplicação está pronta
        setTimeout(() => {
            navigationManager.announceToScreenReader('Site carregado e pronto para navegação');
        }, 1000);

        console.log('🌱 Site de Divulgação Científica inicializado com sucesso!');
    },

    /**
     * Valida se elementos essenciais existem
     */
    validateElements() {
        const requiredElements = [
            'menuToggle',
            'navigationDrawer',
            'drawerOverlay',
            'pageTitle',
            'pageDescription'
        ];

        return requiredElements.every(elementKey => {
            const element = elements[elementKey];
            if (!element) {
                console.error(`Elemento não encontrado: ${elementKey}`);
                return false;
            }
            return true;
        });
    }
};

// ===== SERVICE WORKER (OPCIONAL) =====
const serviceWorker = {
    /**
     * Registra service worker para cache offline
     */
    register() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado:', registration);
                })
                .catch(error => {
                    console.log('Falha ao registrar Service Worker:', error);
                });
        }
    }
};

// ===== INICIALIZAÇÃO QUANDO DOM ESTIVER PRONTO =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init.bind(app));
} else {
    app.init();
}

// ===== EXPORTAÇÕES PARA DEBUGGING (DESENVOLVIMENTO) =====
if (typeof window !== 'undefined') {
    window.sustainabilityApp = {
        state: appState,
        navigation: navigationManager,
        pages: pageManager,
        utils: utils,
        analytics: analytics
    };
}

// ===== TRATAMENTO DE ERROS GLOBAIS =====
window.addEventListener('error', (e) => {
    console.error('Erro JavaScript:', e.error);
    // Aqui você pode enviar erros para um serviço de monitoramento
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise rejeitada:', e.reason);
    // Aqui você pode enviar erros para um serviço de monitoramento
});
