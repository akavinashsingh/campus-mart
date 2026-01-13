// Hide footer when scrolling down, show when scrolling up
let lastScrollTop = 0;
const footer = document.getElementById('main-footer');
let scrollTimeout;

window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // If scrolling down and not at the very bottom
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            footer.style.transform = 'translateY(100%)';
            footer.style.transition = 'transform 0.3s ease-in-out';
        } 
        // If scrolling up or at the bottom of the page
        else {
            footer.style.transform = 'translateY(0)';
            footer.style.transition = 'transform 0.3s ease-in-out';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, 50);
});

// Show footer when reaching the bottom of the page
window.addEventListener('scroll', function() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        footer.style.transform = 'translateY(0)';
    }
});
