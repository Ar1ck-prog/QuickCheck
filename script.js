document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const scanButton = document.getElementById('scanButton');
    const btnText = document.querySelector('.btn-text');
    const btnIcon = document.querySelector('.btn-icon');
    const btnLoader = document.querySelector('.btn-loader');
    const resultSection = document.getElementById('resultSection');
    const verdictBadge = document.getElementById('verdictBadge');
    const verdictIcon = document.getElementById('verdictIcon');
    const explanationText = document.getElementById('explanationText');
    const instructionsText = document.getElementById('instructionsText');
    const lawText = document.getElementById('lawText');
    const lawBlock = document.getElementById('lawBlock');
    const countrySelect = document.getElementById('countrySelect');
    const countryFlag = document.getElementById('countryFlag');
    const charCount = document.getElementById('charCount');
    const scanOverlay = document.getElementById('scanOverlay');
    const scanTextEl = document.getElementById('scanText');
    const scanStepEl = document.getElementById('scanStep');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const copyText = document.getElementById('copyText');
    const riskBarFill = document.getElementById('riskBarFill');
    const riskValue = document.getElementById('riskValue');
    const riskMeter = document.getElementById('riskMeter');
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const totalScansEl = document.getElementById('totalScans');
    const hiwToggle = document.getElementById('hiwToggle');
    const hiwContent = document.getElementById('hiwContent');
    const faqToggle = document.getElementById('faqToggle');
    const faqContent = document.getElementById('faqContent');
    const shareTg = document.getElementById('shareTg');
    const shareWa = document.getElementById('shareWa');
    const toastContainer = document.getElementById('toastContainer');
    const imageUpload = document.getElementById('imageUpload');
    const ocrButton = document.getElementById('ocrButton');
    const ocrPreview = document.getElementById('ocrPreview');
    const extractedBlock = document.getElementById('extractedBlock');
    const extractedContent = document.getElementById('extractedContent');
    const socialEngBlock = document.getElementById('socialEngBlock');
    const socialEngList = document.getElementById('socialEngList');
    const ocrTextBlock = document.getElementById('ocrTextBlock');
    const ocrTextContent = document.getElementById('ocrTextContent');

    const FLAGS = {
        'РК': '<svg width="24" height="18" viewBox="0 0 20 15" fill="none"><rect width="20" height="15" rx="2" fill="#00AFCA"/><circle cx="10" cy="7.5" r="3" fill="#FFE100"/></svg>',
        'РФ': '<svg width="24" height="18" viewBox="0 0 20 15" fill="none"><rect width="20" height="5" rx="2" fill="#FFFFFF"/><rect y="5" width="20" height="5" fill="#0039A6"/><rect y="10" width="20" height="5" rx="2" fill="#D52B1E"/></svg>'
    };
    const COUNTRY_NAMES = { 'РК': 'Республика Казахстан', 'РФ': 'Российская Федерация' };

    const EXAMPLES = {
        scam: 'Уважаемый клиент! Ваш счёт заблокирован службой безопасности. Для разблокировки срочно переведите средства на безопасный счёт №4276 1234 5678 9012 или сообщите код из SMS оператору. Промедление приведёт к полной блокировке всех ваших счетов!',
        suspicious: 'Здравствуйте! Ваша посылка задержана на складе из-за неполных данных получателя. Пожалуйста, уточните адрес доставки по ссылке: delivery-info.com/track. Если не подтвердите в течение 48 часов, посылка будет возвращена отправителю.',
        safe: 'Привет! Во сколько завтра встречаемся в кафе? Я забронировал столик на 18:00, будет ещё Марат и Айгуль.'
    };

    const SCAN_STEPS = [
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Поиск паттернов мошенничества...',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> Проверка ссылок и URL...',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M12 2L2 7h20L12 2z"></path></svg> Анализ банковских реквизитов...',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Сверка с базой схем обмана...',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><path d="M12 2L2 7h20L12 2z"></path><line x1="12" y1="7" x2="12" y2="21"></line><line x1="6" y1="7" x2="6" y2="15"></line><line x1="18" y1="7" x2="18" y2="15"></line></svg> Проверка по статьям УК...',
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><line x1="12" y1="7" x2="12" y2="11"></line><circle cx="9" cy="16" r="1"></circle><circle cx="15" cy="16" r="1"></circle></svg> Финальный анализ нейросетью...'
    ];

    const VERDICT_ICONS = {
        'БЕЗОПАСНО': '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-safe)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        'ПОДОЗРИТЕЛЬНО': '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-suspicious)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        'МОШЕННИКИ': '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-scam)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };

    const TOAST_ICONS = {
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        warn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        danger: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
        delete: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
    };

    let lastResult = null;
    let scanStepInterval = null;

// =====// Global variables
let isScanning = false;
let currentExample = '';

// ===== OVERDRIVE: Scramble Text Effect =====
function scrambleText(element, targetText, duration = 1200) {
    const chars = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789!@#$%^&*()';
    let frame = 0;
    const fps = 30;
    const totalFrames = Math.round((duration / 1000) * fps);
    
    element.textContent = '';
    element.style.fontFamily = 'var(--font-mono)'; // use monospace for glitch
    
    let interval = setInterval(() => {
        let currentString = '';
        for (let i = 0; i < targetText.length; i++) {
            if (targetText[i] === ' ' || frame >= totalFrames - (targetText.length - i) * (totalFrames/targetText.length)) {
                currentString += targetText[i];
            } else {
                currentString += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        element.textContent = currentString;
        frame++;
        
        if (frame >= totalFrames) {
            clearInterval(interval);
            element.textContent = targetText;
            element.style.fontFamily = 'var(--font-heading)'; // restore font
        }
    }, 1000 / fps);
}

// ===== ANIMATE: View Transitions Helper =====
function withViewTransition(callback) {
    if (!document.startViewTransition) {
        callback();
        return;
    }
    document.startViewTransition(callback);
}

    // ===== Mouse Parallax on Particles =====
    document.addEventListener('mousemove', (e) => {
        const particles = document.querySelectorAll('.particle');
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        particles.forEach((p, i) => {
            const speed = (i + 1) * 8;
            p.style.transform = `translate(${dx * speed}px, ${dy * speed}px)`;
        });
    });

    // ===== Scan Counter =====
    function getScanCount() {
        return parseInt(localStorage.getItem('qc_scan_count') || '0', 10);
    }
    function incrementScanCount() {
        const c = getScanCount() + 1;
        localStorage.setItem('qc_scan_count', c.toString());
        animateCounter(totalScansEl, c);
    }
    function animateCounter(el, target) {
        const start = parseInt(el.textContent, 10) || 0;
        if (start === target) { el.textContent = target; return; }
        const duration = 600;
        const startTime = performance.now();
        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    totalScansEl.textContent = getScanCount();

    // ===== Accordions =====
    hiwToggle.addEventListener('click', () => {
        hiwToggle.classList.toggle('open');
        hiwContent.classList.toggle('open');
    });
    faqToggle.addEventListener('click', () => {
        faqToggle.classList.toggle('open');
        faqContent.classList.toggle('open');
    });

    // ===== OCR Image Upload =====
    let pendingImage = null;

    ocrButton.addEventListener('click', () => imageUpload.click());

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('warn', 'Поддерживаются только изображения');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('warn', 'Файл слишком большой (макс. 10 МБ)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const base64 = dataUrl.split(',')[1];
            const mimeType = file.type;
            pendingImage = { base64, mime_type: mimeType };

            ocrPreview.innerHTML = `<img src="${dataUrl}" alt="Preview"><button class="ocr-remove" title="Удалить">×</button>`;
            ocrPreview.classList.remove('hidden');
            ocrPreview.querySelector('.ocr-remove').addEventListener('click', clearImage);
            showToast('info', 'Скриншот загружен — нажмите «Сканировать»');
        };
        reader.readAsDataURL(file);
    });

    function clearImage() {
        pendingImage = null;
        ocrPreview.innerHTML = '';
        ocrPreview.classList.add('hidden');
        imageUpload.value = '';
    }

    // ===== Example Chips =====
    let typeWriterTimeout;
    document.querySelectorAll('.chip[data-example]').forEach(chip => {
        chip.addEventListener('click', () => {
            const key = chip.dataset.example;
            const text = EXAMPLES[key];
            if (text) {
                clearTimeout(typeWriterTimeout);
                messageInput.value = '';
                messageInput.focus();
                
                chip.style.transform = 'scale(0.95)';
                setTimeout(() => chip.style.transform = '', 150);
                
                let i = 0;
                function typeInput() {
                    if (i < text.length) {
                        messageInput.value += text.charAt(i);
                        messageInput.dispatchEvent(new Event('input'));
                        i++;
                        typeWriterTimeout = setTimeout(typeInput, 15);
                    } else {
                        showToast('info', 'Пример загружен — Нажмите «Проверить»');
                    }
                }
                typeInput();
            }
        });
    });

    // ===== Country flag animation =====
    countryFlag.innerHTML = FLAGS[countrySelect.value] || FLAGS['РК'];
    countrySelect.addEventListener('change', () => {
        const flag = FLAGS[countrySelect.value] || FLAGS['РК'];
        countryFlag.style.transform = 'scale(0) rotate(-180deg)';
        setTimeout(() => {
            countryFlag.innerHTML = flag;
            countryFlag.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
    });

    // ===== Character counter =====
    messageInput.addEventListener('input', () => {
        const len = messageInput.value.length;
        charCount.textContent = `${len} символ${getPlural(len)}`;
    });

    function getPlural(n) {
        const abs = Math.abs(n) % 100;
        const n1 = abs % 10;
        if (abs > 10 && abs < 20) return 'ов';
        if (n1 > 1 && n1 < 5) return 'а';
        if (n1 === 1) return '';
        return 'ов';
    }

    // ===== Keyboard shortcut (Ctrl+Enter) =====
    messageInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            scanButton.click();
        }
    });

    // ===== Reset button =====
    resetButton.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        resultSection.classList.remove('verdict-safe-panel', 'verdict-suspicious-panel', 'verdict-scam-panel');
        messageInput.value = '';
        charCount.textContent = '0 символов';
        clearImage();
        messageInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== Copy result =====
    copyButton.addEventListener('click', () => {
        if (!lastResult) return;
        const text = buildShareText();
        navigator.clipboard.writeText(text).then(() => {
            copyText.textContent = '✓ Готово!';
            copyButton.classList.add('copy-success');
            showToast('success', 'Результат скопирован');
            setTimeout(() => {
                copyText.textContent = 'Скопировать';
                copyButton.classList.remove('copy-success');
            }, 2000);
        });
    });

    // ===== Share helpers =====
    function buildShareText() {
        if (!lastResult) return '';
        return `[QuickCheck] Вердикт: ${lastResult.verdict}\n\n` +
            `• ${lastResult.explanation}\n` +
            `• ${lastResult.instructions}\n` +
            `• Юрисдикция: ${COUNTRY_NAMES[lastResult.country] || lastResult.country}`;
    }

    shareTg.addEventListener('click', () => {
        if (!lastResult) return;
        const text = encodeURIComponent(buildShareText());
        window.open(`https://t.me/share/url?url=${encodeURIComponent('QuickCheck')}&text=${text}`, '_blank');
        showToast('share', 'Открываем Telegram...');
    });

    shareWa.addEventListener('click', () => {
        if (!lastResult) return;
        const text = encodeURIComponent(buildShareText());
        window.open(`https://wa.me/?text=${text}`, '_blank');
        showToast('share', 'Открываем WhatsApp...');
    });

    // ===== Toast Notifications =====
    function showToast(type, message, duration = 3000) {
        const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ===== Scan Step Rotator =====
    function startScanSteps() {
        let idx = 0;
        scanStepEl.innerHTML = SCAN_STEPS[0];
        scanStepInterval = setInterval(() => {
            idx++;
            if (idx >= SCAN_STEPS.length) idx = 0;
            scanStepEl.style.opacity = '0';
            setTimeout(() => {
                scanStepEl.innerHTML = SCAN_STEPS[idx];
                scanStepEl.style.opacity = '0.8';
            }, 200);
        }, 800);
    }
    function stopScanSteps() {
        if (scanStepInterval) { clearInterval(scanStepInterval); scanStepInterval = null; }
    }

    // ===== Shield Pulse (Delight) =====
    function fireShieldPulse() {
        verdictIcon.style.position = 'relative';
        const pulse = document.createElement('div');
        pulse.className = 'shield-pulse-ring';
        verdictIcon.appendChild(pulse);
        setTimeout(() => pulse.remove(), 2000);
    }

    // ===== History =====
    function getHistory() {
        try { return JSON.parse(localStorage.getItem('qc_history') || '[]'); }
        catch { return []; }
    }

    function saveToHistory(text, data) {
        const history = getHistory();
        history.unshift({
            text: text.substring(0, 120),
            verdict: data.verdict,
            timestamp: Date.now()
        });
        if (history.length > 10) history.length = 10;
        localStorage.setItem('qc_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = getHistory();
        if (history.length === 0) {
            historySection.style.display = 'none';
            return;
        }
        historySection.style.display = '';
        historyList.innerHTML = '';
        history.forEach((item, i) => {
            const dotClass = item.verdict === 'БЕЗОПАСНО' ? 'safe' : item.verdict === 'ПОДОЗРИТЕЛЬНО' ? 'suspicious' : 'scam';
            const el = document.createElement('div');
            el.className = 'history-item';
            el.style.animationDelay = (i * 0.05) + 's';
            el.innerHTML = `
                <div class="history-dot ${dotClass}"></div>
                <div class="history-text">${escapeHtml(item.text)}</div>
                <span class="history-verdict ${dotClass}">${item.verdict}</span>
            `;
            el.addEventListener('click', () => {
                messageInput.value = item.text;
                messageInput.dispatchEvent(new Event('input'));
                messageInput.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            historyList.appendChild(el);
        });
    }

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('qc_history');
        renderHistory();
        showToast('delete', 'История очищена');
    });

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    renderHistory();

    // ===== Main scan action =====
    scanButton.addEventListener('click', async () => {
        const text = messageInput.value.trim();
        const country = countrySelect.value;
        
        if (!text && !pendingImage) {
            messageInput.style.borderColor = 'var(--status-scam)';
            messageInput.style.animation = 'shake 0.4s ease';
            showToast('warn', 'Введите сообщение или загрузите скриншот');
            setTimeout(() => {
                messageInput.style.borderColor = 'var(--panel-border)';
                messageInput.style.animation = '';
            }, 1500);
            return;
        }

        scanButton.disabled = true;
        withViewTransition(() => {
            btnText.classList.add('hidden');
            if (btnIcon) btnIcon.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            resultSection.classList.add('hidden');
            resultSection.classList.remove('verdict-safe-panel', 'verdict-suspicious-panel', 'verdict-scam-panel');
            scanOverlay.classList.remove('hidden');
        });
        startScanSteps();

        try {
            let data;

            if (pendingImage) {
                // OCR mode
                const response = await fetch('/api/scan-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: pendingImage.base64,
                        mime_type: pendingImage.mime_type,
                        country
                    })
                });
                if (!response.ok) {
                    let errText = `Ошибка сервера: ${response.status}`;
                    try { const errData = await response.json(); if (errData.error) errText = errData.error; } catch(e) {}
                    throw new Error(errText);
                }
                data = await response.json();
                if (data.error) throw new Error(data.error);
                clearImage();
            } else {
                // Text mode
                const response = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, country })
                });
                if (!response.ok) {
                    let errText = `Ошибка сервера: ${response.status}`;
                    try { const errData = await response.json(); if (errData.error) errText = errData.error; } catch(e) {}
                    throw new Error(errText);
                }
                data = await response.json();
                if (data.error) throw new Error(data.error);
            }

            await new Promise(r => setTimeout(r, 800));

            data.country = country;
            lastResult = data;
            incrementScanCount();
            const historyText = text || data.extracted_text || '[Скриншот]';
            saveToHistory(historyText, data);
            
            withViewTransition(() => {
                displayResult(data, country);
                stopScanSteps();
                scanButton.disabled = false;
                btnText.classList.remove('hidden');
                if (btnIcon) btnIcon.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                scanOverlay.classList.add('hidden');
            });
            isScanning = false;

            if (data.verdict === 'БЕЗОПАСНО') {
                showToast('success', 'Сообщение безопасно!');
                fireShieldPulse();
            } else if (data.verdict === 'МОШЕННИКИ') {
                showToast('danger', 'Обнаружено мошенничество!', 5000);
            } else {
                showToast('warn', 'Обнаружены подозрительные признаки');
            }
        } catch (error) {
            console.error('Scanning error:', error);
            
            let errMsg = error.message || '';
            let mainError = 'Произошла непредвиденная ошибка при сканировании.';
            let recoveryAction = 'Проверьте подключение к интернету и попробуйте позже.';
            let toastMsg = 'Ошибка соединения';
            
            if (errMsg.includes('429') || errMsg.toLowerCase().includes('лимит')) {
                mainError = 'Слишком много запросов к серверу.';
                recoveryAction = 'Подождите 30 секунд и попробуйте снова.';
                toastMsg = 'Лимит запросов — подождите';
            } else if (errMsg.includes('502') || errMsg.includes('API')) {
                mainError = 'Сервер временно недоступен.';
                recoveryAction = 'Пожалуйста, попробуйте повторить попытку через пару минут.';
            } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
                mainError = 'Не удалось подключиться к серверу.';
                recoveryAction = 'Убедитесь, что у вас есть доступ в интернет, или попробуйте позже.';
            }
            
            withViewTransition(() => {
                verdictIcon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-suspicious)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
                scrambleText(verdictBadge, 'ОШИБКА СКАНИРОВАНИЯ');
                verdictBadge.className = 'verdict-badge verdict-suspicious';
                explanationText.textContent = mainError;
                instructionsText.textContent = recoveryAction;
                lawBlock.classList.add('hidden');
                riskMeter.classList.add('hidden');
                resultSection.classList.remove('hidden');
                
                stopScanSteps();
                scanButton.disabled = false;
                btnText.classList.remove('hidden');
                if (btnIcon) btnIcon.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                scanOverlay.classList.add('hidden');
            });
            isScanning = false;
            showToast('danger', toastMsg);
        }
    });

    // ===== Display result =====
    function displayResult(data, country) {
        // Verdict icon
        verdictIcon.innerHTML = VERDICT_ICONS[data.verdict] || '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
        // Force re-animation
        verdictIcon.style.animation = 'none';
        void verdictIcon.offsetHeight;
        verdictIcon.style.animation = '';

        verdictBadge.className = 'verdict-badge';
        scrambleText(verdictBadge, data.verdict);
        
        // Panel border color
        resultSection.classList.remove('verdict-safe-panel', 'verdict-suspicious-panel', 'verdict-scam-panel');

        if (data.verdict === 'БЕЗОПАСНО') {
            verdictBadge.classList.add('verdict-safe');
            resultSection.classList.add('verdict-safe-panel');
        } else if (data.verdict === 'ПОДОЗРИТЕЛЬНО') {
            verdictBadge.classList.add('verdict-suspicious');
            resultSection.classList.add('verdict-suspicious-panel');
        } else {
            verdictBadge.classList.add('verdict-scam');
            resultSection.classList.add('verdict-scam-panel');
        }

        typeWriter(explanationText, data.explanation || 'Нет дополнительных объяснений.', 15);
        instructionsText.textContent = data.instructions || 'Действуйте по своему усмотрению.';

        if (data.verdict !== 'БЕЗОПАСНО') {
            const countryName = COUNTRY_NAMES[country] || country;
            const lawCode = data.law_code || (country === 'РК' ? 'УК РК' : 'УК РФ');
            const detectedArticle = data.detected_article ? ` Применимая статья: ${data.detected_article}.` : '';
            lawText.textContent = `Анализ по законодательству: ${countryName}. Кодекс: ${lawCode}.${detectedArticle}`;
            lawBlock.classList.remove('hidden');
        } else {
            lawBlock.classList.add('hidden');
        }

        // Extracted data (URLs, phones, cards)
        const extracted = data.extracted || {};
        const hasExtracted = (extracted.urls?.length || extracted.phones?.length || extracted.cards?.length);
        if (hasExtracted) {
            extractedContent.innerHTML = '';
            (extracted.urls || []).forEach(u => {
                extractedContent.innerHTML += `<span class="ex-tag tag-url"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> ${escapeHtml(u)}</span>`;
            });
            (extracted.phones || []).forEach(p => {
                extractedContent.innerHTML += `<span class="ex-tag tag-phone"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"></path></svg> ${escapeHtml(p)}</span>`;
            });
            (extracted.cards || []).forEach(c => {
                extractedContent.innerHTML += `<span class="ex-tag tag-card"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> ${escapeHtml(c)}</span>`;
            });
            extractedBlock.classList.remove('hidden');
        } else {
            extractedBlock.classList.add('hidden');
        }

        // Social engineering signs
        const seSigns = data.social_engineering_signs || [];
        if (seSigns.length > 0) {
            socialEngList.innerHTML = '';
            seSigns.forEach(sign => {
                socialEngList.innerHTML += `<li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> ${escapeHtml(sign)}</li>`;
            });
            socialEngBlock.classList.remove('hidden');
        } else {
            socialEngBlock.classList.add('hidden');
        }

        // OCR extracted text
        if (data.extracted_text) {
            ocrTextContent.textContent = data.extracted_text;
            ocrTextBlock.classList.remove('hidden');
        } else {
            ocrTextBlock.classList.add('hidden');
        }

        const riskScore = data.risk_score ?? (data.verdict === 'БЕЗОПАСНО' ? 5 : data.verdict === 'ПОДОЗРИТЕЛЬНО' ? 55 : 90);
        riskMeter.classList.remove('hidden');
        animateRiskMeter(riskScore);

        resultSection.classList.remove('hidden');
        setTimeout(() => resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }

    // ===== Typewriter effect =====
    function typeWriter(element, text, speed) {
        element.textContent = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // ===== Animate risk meter =====
    function animateRiskMeter(score) {
        riskBarFill.style.width = '0%';
        riskValue.textContent = '0%';

        let color;
        if (score <= 30) color = 'var(--status-safe)';
        else if (score <= 65) color = 'var(--status-suspicious)';
        else color = 'var(--status-scam)';

        setTimeout(() => {
            riskBarFill.style.background = color;
            riskBarFill.style.width = score + '%';
        }, 100);

        let current = 0;
        const step = Math.max(1, Math.floor(score / 30));
        const interval = setInterval(() => {
            current += step;
            if (current >= score) { current = score; clearInterval(interval); }
            riskValue.textContent = current + '%';
            riskValue.style.color = color;
        }, 30);
    }
});

// Shake keyframe
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
}`;
document.head.appendChild(style);
