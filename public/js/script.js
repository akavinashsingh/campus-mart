// Hide footer when scrolling down, show when scrolling up
let lastScrollTop = 0;
const footer = document.getElementById('main-footer');
let scrollTimeout;

// Save/Unsave Product Functionality
document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const productId = this.dataset.productId;
            const isSaved = this.dataset.saved === 'true';
            const method = isSaved ? 'DELETE' : 'POST';
            
            try {
                const response = await fetch(`/api/products/${productId}/save`, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Update button state
                    this.dataset.saved = data.saved;
                    
                    if (data.saved) {
                        this.classList.remove('btn-outline-primary');
                        this.classList.add('btn-danger');
                        document.getElementById('saveBtnText').textContent = 'Unsave';
                    } else {
                        this.classList.remove('btn-danger');
                        this.classList.add('btn-outline-primary');
                        document.getElementById('saveBtnText').textContent = 'Save Item';
                    }
                }
            } catch (error) {
                console.error('Error saving/unsaving item:', error);
                alert('Failed to save item. Please try again.');
            }
        });
    }
});

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
