// Google Sheets Form Submission
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzM5V1rksCGnt3xLXyfSwEIRo-mFieppORTHWYZNQ_9SLlLa259aPvB_ZnOAHyjnLpeMA/exec';

// Page Initialization
window.onload = function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    initScrollAnimations();
    document.body.classList.add('loaded');
    
    // Initialize calculators
    if (document.getElementById('r-amount')) calcRepaymentDetail();
    if (document.getElementById('b-income1')) calcBorrowingPower();
    if (document.getElementById('s-value')) calcStampDuty();
    if (document.getElementById('e-balance')) calcExtraRepayment();
    if (document.getElementById('o-loan')) calcOffset();
    if (document.getElementById('faq-search')) initSearch();
};

// Slideshow
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-bg-slide');
if (slides.length > 0) {
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 6000);
}

// Mobile Menu
const mobileMenu = document.getElementById('mobile-menu');
function toggleMenu() {
    if (mobileMenu) {
        mobileMenu.classList.toggle('translate-x-full');
        document.body.classList.toggle('overflow-hidden');
    }
}

const mobileBtn = document.getElementById('mobile-menu-btn');
if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);

const closeMenuBtn = document.getElementById('close-menu-btn');
if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);

// Navbar Scroll
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// Scroll Animations
function initScrollAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('reveal-hidden');
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => {
        if (!el.classList.contains('active')) el.classList.add('reveal-hidden');
        revealObserver.observe(el);
    });
}

// Accordion
function toggleAccordion(button) {
    const item = button.parentElement;
    item.classList.toggle('active');
}

// Search
function initSearch() {
    const searchInput = document.getElementById('faq-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.accordion-item');
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(term) ? 'block' : 'none';
            });
        });
    }
}

// Calculator Functions
let charts = {};

function renderChart(canvasId, type, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    if (charts[canvasId]) charts[canvasId].destroy();

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { family: 'FuturaPT', size: 12 },
                    color: '#686965'
                }
            },
            tooltip: {
                backgroundColor: '#686965',
                titleFont: { family: 'FuturaPT' },
                bodyFont: { family: 'FuturaPT' },
                padding: 10,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-AU', {
                                style: 'currency',
                                currency: 'AUD',
                                maximumFractionDigits: 0
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: {
                    font: { family: 'FuturaPT' },
                    color: '#9ca3af',
                    callback: function(value) {
                        if (value >= 1000000) return '$' + value / 1000000 + 'M';
                        if (value >= 1000) return '$' + value / 1000 + 'k';
                        return '$' + value;
                    }
                }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { family: 'FuturaPT' },
                    color: '#9ca3af'
                }
            }
        }
    };

    if (options.scales && options.scales.y) defaultOptions.scales.y = {...defaultOptions.scales.y, ...options.scales.y};
    if (options.scales && options.scales.x) defaultOptions.scales.x = {...defaultOptions.scales.x, ...options.scales.x};

    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: { labels: labels, datasets: datasets },
        options: defaultOptions
    });
}

function switchCalcTab(tabName) {
    document.querySelectorAll('.calc-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.calc-tab').forEach(el => el.classList.remove('active'));
    const content = document.getElementById('calc-' + tabName);
    const tab = document.getElementById('tab-' + tabName);
    if (content) content.classList.add('active');
    if (tab) tab.classList.add('active');
}

function calcRepaymentDetail() {
    const amountEl = document.getElementById('r-amount');
    const rateEl = document.getElementById('r-rate');
    const termEl = document.getElementById('r-term');
    const freqEl = document.getElementById('r-freq');
    const resultEl = document.getElementById('r-result');
    const interestEl = document.getElementById('r-total-interest');
    const costEl = document.getElementById('r-total-cost');
    const labelEl = document.getElementById('r-result-label');
    
    if (!amountEl || !rateEl || !termEl || !freqEl) return;
    
    const amount = parseFloat(amountEl.value) || 0;
    const rate = parseFloat(rateEl.value) || 0;
    const term = parseFloat(termEl.value) || 30;
    const freq = parseInt(freqEl.value);

    if (amount > 0 && rate > 0 && term > 0) {
        const annualRate = rate / 100;
        const numPayments = term * freq;
        const ratePerPeriod = annualRate / freq;
        const payment = amount * (ratePerPeriod * Math.pow(1 + ratePerPeriod, numPayments)) / (Math.pow(1 + ratePerPeriod, numPayments) - 1);

        if (resultEl) resultEl.innerText = '$' + Math.round(payment).toLocaleString('en-AU');
        if (interestEl) interestEl.innerText = '$' + Math.round((payment * numPayments) - amount).toLocaleString('en-AU');
        if (costEl) costEl.innerText = '$' + Math.round(payment * numPayments).toLocaleString('en-AU');

        let label = 'Per Month';
        if (freq === 26) label = 'Per Fortnight';
        if (freq === 52) label = 'Per Week';
        if (labelEl) labelEl.innerText = label;
    } else {
        if (resultEl) resultEl.innerText = '$0';
        if (interestEl) interestEl.innerText = '$0';
        if (costEl) costEl.innerText = '$0';
    }
}
