/* ============================================
   QuickCheck Landing — Interactive Engine
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // === Cursor Glow Follower ===
    const cursorGlow = document.getElementById('cursorGlow');
    let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateGlow() {
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        if (cursorGlow) {
            cursorGlow.style.left = glowX + 'px';
            cursorGlow.style.top = glowY + 'px';
        }
        requestAnimationFrame(animateGlow);
    }
    animateGlow();

    // === Navbar Scroll ===
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = scrollTop;
    }, { passive: true });

    // === Mobile Menu ===
    const hamburger = document.getElementById('navHamburger');
    const mobileOverlay = document.getElementById('mobileMenuOverlay');
    const mobileLinks = document.querySelectorAll('.mobile-menu-link, .mobile-menu-cta');

    if (hamburger && mobileOverlay) {
        hamburger.addEventListener('click', () => {
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : '';
            
            // Animate hamburger
            const spans = hamburger.querySelectorAll('span');
            if (mobileOverlay.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            }
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            });
        });
    }

    // === Smooth Scroll for anchor links ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // === Scroll Animations (Custom AOS) ===
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.aosDelay || 0;
                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, parseInt(delay));
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        scrollObserver.observe(el);
    });

    // === Counter Animation ===
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number[data-target]').forEach(el => {
        counterObserver.observe(el);
    });

    function animateCounter(el, target) {
        const duration = 2000;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(easedProgress * target);
            
            el.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    // === FAQ Accordion ===
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item-acc');
            const isActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.faq-item-acc').forEach(i => {
                i.classList.remove('active');
            });
            
            // Toggle clicked
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // === Active nav link on scroll ===
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-80px 0px -50% 0px'
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // === Card tilt effect on hover ===
    document.querySelectorAll('.feature-card, .problem-card, .scenario-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -3;
            const rotateY = (x - centerX) / centerX * 3;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            
            // Move glow
            const glow = card.querySelector('.feature-glow');
            if (glow) {
                glow.style.left = (x - rect.width) + 'px';
                glow.style.top = (y - rect.height) + 'px';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // === Typed effect for hero subtitle (optional enhancement) ===
    // The text is already in HTML so no typing needed, but we add a subtle entrance animation
    const heroLines = document.querySelectorAll('.hero-line');
    heroLines.forEach((line, i) => {
        line.style.opacity = '0';
        line.style.transform = 'translateY(20px)';
        line.style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15 + 0.2}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15 + 0.2}s`;
        
        requestAnimationFrame(() => {
            line.style.opacity = '1';
            line.style.transform = 'translateY(0)';
        });
    });

    // Hero badge entrance
    const heroBadge = document.querySelector('.hero-badge');
    if (heroBadge) {
        heroBadge.style.opacity = '0';
        heroBadge.style.transform = 'translateY(10px)';
        heroBadge.style.transition = 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s';
        requestAnimationFrame(() => {
            heroBadge.style.opacity = '1';
            heroBadge.style.transform = 'translateY(0)';
        });
    }

    // Hero subtitle entrance
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        heroSubtitle.style.opacity = '0';
        heroSubtitle.style.transform = 'translateY(15px)';
        heroSubtitle.style.transition = 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s';
        requestAnimationFrame(() => {
            heroSubtitle.style.opacity = '1';
            heroSubtitle.style.transform = 'translateY(0)';
        });
    }

    // Hero actions entrance
    const heroActions = document.querySelector('.hero-actions');
    if (heroActions) {
        heroActions.style.opacity = '0';
        heroActions.style.transform = 'translateY(15px)';
        heroActions.style.transition = 'opacity 0.8s ease 0.8s, transform 0.8s ease 0.8s';
        requestAnimationFrame(() => {
            heroActions.style.opacity = '1';
            heroActions.style.transform = 'translateY(0)';
        });
    }

    // Hero trust entrance
    const heroTrust = document.querySelector('.hero-trust');
    if (heroTrust) {
        heroTrust.style.opacity = '0';
        heroTrust.style.transform = 'translateY(15px)';
        heroTrust.style.transition = 'opacity 0.8s ease 1s, transform 0.8s ease 1s';
        requestAnimationFrame(() => {
            heroTrust.style.opacity = '1';
            heroTrust.style.transform = 'translateY(0)';
        });
    }

    // Phone entrance
    const heroPhone = document.querySelector('.hero-phone');
    if (heroPhone) {
        heroPhone.style.opacity = '0';
        heroPhone.style.transform = 'translateY(40px) scale(0.95)';
        heroPhone.style.transition = 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s';
        requestAnimationFrame(() => {
            heroPhone.style.opacity = '1';
            heroPhone.style.transform = 'translateY(0) scale(1)';
        });
    }

    // Floating badges entrance
    const floatingBadges = document.querySelectorAll('.floating-badge');
    floatingBadges.forEach((badge, i) => {
        badge.style.opacity = '0';
        badge.style.transform = 'scale(0.8)';
        badge.style.transition = `opacity 0.6s ease ${1 + i * 0.2}s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${1 + i * 0.2}s`;
        requestAnimationFrame(() => {
            badge.style.opacity = '1';
            badge.style.transform = 'scale(1)';
        });
    });

    // === Parallax on scroll for orbs ===
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const orbs = document.querySelectorAll('.hero-orb');
        orbs.forEach((orb, i) => {
            const speed = 0.03 + i * 0.02;
            orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
    }, { passive: true });

});
