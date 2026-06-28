/**
 * Noman Javed - Portfolio Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize general UI controls
  initNavigation();
  initThemeToggle();
  initCaseStudyTabs();
  initScrollAnimations();
  initContactClipboard();
});

/* --- Navigation & Menu --- */
function initNavigation() {
  const header = document.querySelector('header');
  const navToggle = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Change header styling on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = navToggle.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });
  }

  // Close mobile menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu) navMenu.classList.remove('active');
      const icon = navToggle ? navToggle.querySelector('i') : null;
      if (icon) icon.className = 'fa-solid fa-bars';
    });
  });

  // Smooth scroll and active states
  const sections = document.querySelectorAll('section');
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* --- Theme Toggle (Dark/Light) --- */
function initThemeToggle() {
  const themeToggleBtn = document.querySelector('.theme-toggle-btn');
  const currentTheme = localStorage.getItem('theme') || 'dark';

  // Apply default theme
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateMermaidTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      let theme = document.documentElement.getAttribute('data-theme');
      let targetTheme = theme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
      
      // Update Mermaid diagrams theme and re-render active diagrams
      updateMermaidTheme(targetTheme);
      reRenderVisibleDiagrams();
    });
  }
}

function updateMermaidTheme(theme) {
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif'
    });
  }
}

async function reRenderVisibleDiagrams() {
  const activeDiagramContainers = document.querySelectorAll('.cs-pane.active .diagram-container');
  activeDiagramContainers.forEach(container => {
    renderMermaidDiagram(container);
  });
}

/* --- Case Studies Tabs & Charts --- */
function initCaseStudyTabs() {
  const tabGroups = document.querySelectorAll('.case-study-card');

  tabGroups.forEach(group => {
    const tabs = group.querySelectorAll('.cs-tab-btn');
    const panes = group.querySelectorAll('.cs-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPaneId = tab.getAttribute('data-tab');
        
        // Deactivate other tabs and panes in this group
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        // Activate selected tab and pane
        tab.classList.add('active');
        const activePane = group.querySelector(`.cs-pane[data-pane="${targetPaneId}"]`);
        if (activePane) {
          activePane.classList.add('active');
          
          // Custom actions for specific tabs
          if (targetPaneId === 'metrics') {
            // Animate performance metrics charts
            animateMetricsCharts(activePane);
          } else if (targetPaneId === 'architecture') {
            // Render Mermaid diagram inside the pane
            const diagContainer = activePane.querySelector('.diagram-container');
            if (diagContainer) {
              renderMermaidDiagram(diagContainer);
            }
          }
        }
      });
    });
  });
}

async function renderMermaidDiagram(container) {
  // If already rendered and theme didn't change, we can skip.
  // But to handle theme toggle, we redraw it using saved source.
  const sourceCode = container.getAttribute('data-code');
  if (!sourceCode) return;

  // Clear container
  container.innerHTML = '<div style="color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Rendering architecture diagram...</div>';

  if (typeof mermaid === 'undefined') {
    container.innerHTML = '<div style="color:var(--color-error)">Failed to load diagram renderer. Please check internet connection.</div>';
    return;
  }

  const id = 'mermaid-svg-' + Math.random().toString(36).substr(2, 9);
  try {
    const { svg } = await mermaid.render(id, sourceCode);
    container.innerHTML = svg;
  } catch (error) {
    console.error("Mermaid error: ", error);
    // Find the error element mermaid creates and remove it from body if it got inserted
    const errEl = document.getElementById('d' + id);
    if (errEl) errEl.remove();
    container.innerHTML = `<div style="color:var(--color-error); font-size:0.875rem"><i class="fa-solid fa-triangle-exclamation"></i> Error rendering architecture diagram.</div>`;
  }
}

function animateMetricsCharts(pane) {
  const bars = pane.querySelectorAll('.chart-bar-fill');
  bars.forEach(bar => {
    const targetVal = bar.getAttribute('data-percent');
    // Set timeout to allow rendering to complete before transitions
    setTimeout(() => {
      bar.style.width = `${targetVal}%`;
    }, 100);
  });
}

/* --- Scroll Animations (Intersection Observer) --- */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        
        // If skill list container is revealed, animate the skill fills
        if (entry.target.classList.contains('skills-category')) {
          animateSkills(entry.target);
        }
        
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

function animateSkills(categoryEl) {
  const fills = categoryEl.querySelectorAll('.skill-fill');
  fills.forEach(fill => {
    const level = fill.getAttribute('data-level');
    setTimeout(() => {
      fill.style.width = `${level}%`;
    }, 200);
  });
}

/* --- Contact & Clipboard Toast --- */
function initContactClipboard() {
  const emailCard = document.getElementById('email-card');
  if (emailCard) {
    emailCard.addEventListener('click', () => {
      const email = emailCard.getAttribute('data-email');
      navigator.clipboard.writeText(email)
        .then(() => {
          showToast('Email address copied to clipboard!');
        })
        .catch(err => {
          console.error('Could not copy email: ', err);
          // Fallback to mailto
          window.location.href = `mailto:${email}`;
        });
    });
  }
}

function showToast(message) {
  // Create container if not exists
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i class="fa-solid fa-circle-check" style="color: var(--color-success)"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Auto-remove toast after animation completes
  setTimeout(() => {
    toast.remove();
    if (toastContainer.children.length === 0) {
      toastContainer.remove();
    }
  }, 3000);
}
