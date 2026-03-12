// gallery Slider
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.new-slide');
    const dots = document.querySelectorAll('.new-dots li');
    const prevButton = document.querySelector('.new-prev');
    const nextButton = document.querySelector('.new-next');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentSlide = index;
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
    }

    function prevSlide() {
        const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }

    // Event listeners for buttons
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);

    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    });

    // Auto-slide (optional, inspired by banner’s dynamic feel)
    let autoSlide = setInterval(nextSlide, 4000);
    document.querySelector('.new-gallery').addEventListener('mouseenter', () => clearInterval(autoSlide));
    document.querySelector('.new-gallery').addEventListener('mouseleave', () => {
        autoSlide = setInterval(nextSlide, 5000);
    });
});