document.addEventListener('DOMContentLoaded', function() {
    const permitForm = document.getElementById('permitForm');
    
    // Form validation and submission
    permitForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate atmospheric readings
        const oxygenLevel = parseFloat(document.getElementById('oxygenLevel').value);
        const flammableGases = parseFloat(document.getElementById('flammableGases').value);
        const toxicGases = parseFloat(document.getElementById('toxicGases').value);
        
        // Example validation rules (adjust according to your safety standards)
        if (oxygenLevel < 19.5 || oxygenLevel > 23.5) {
            alert('Oxygen levels must be between 19.5% and 23.5%');
            return;
        }
        
        if (flammableGases > 10) {
            alert('Flammable gases must be below 10% LEL');
            return;
        }
        
        // Check required checkboxes
        const requiredCheckboxes = permitForm.querySelectorAll('input[type="checkbox"][required]');
        let allChecked = true;
        
        requiredCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                allChecked = false;
                checkbox.parentElement.classList.add('error');
            }
        });
        
        if (!allChecked) {
            alert('Please complete all required checks');
            return;
        }
        
        // If validation passes, collect form data
        const formData = new FormData(permitForm);
        const permitData = Object.fromEntries(formData);
        
        // You would typically send this data to a server
        console.log('Permit data:', permitData);
        
        // Example success message
        alert('Permit submitted successfully!');
    });
    
    // Real-time validation for atmospheric readings
    const numericInputs = permitForm.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('error');
            const value = parseFloat(this.value);
            
            if (this.id === 'oxygenLevel' && (value < 19.5 || value > 23.5)) {
                this.classList.add('error');
            }
            
            if (this.id === 'flammableGases' && value > 10) {
                this.classList.add('error');
            }
        });
    });
    
    // Clear error styling when checkbox is checked
    const checkboxes = permitForm.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                this.parentElement.classList.remove('error');
            }
        });
    });
    
    // Add pull-to-refresh functionality
    let touchstartY = 0;
    document.addEventListener('touchstart', e => {
        touchstartY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', e => {
        const touchY = e.touches[0].clientY;
        const touchDiff = touchY - touchstartY;
        
        if (window.scrollY === 0 && touchDiff > 0) {
            e.preventDefault();
        }
    });
    
    // Initialize signature pads
    const signaturePads = new Map();
    
    document.querySelectorAll('.signature-pad').forEach(canvas => {
        signaturePads.set(canvas.id, new SignaturePad(canvas));
    });
    
    // Add clear button functionality
    document.querySelectorAll('.clear-signature').forEach(button => {
        button.addEventListener('click', function() {
            const padId = this.dataset.pad;
            const pad = signaturePads.get(padId);
            if (pad) {
                pad.clear();
            }
        });
    });
});

// Add error class styles
const style = document.createElement('style');
style.textContent = `
    .error {
        border-color: #e74c3c !important;
        background-color: #ffd7d7;
    }
    
    .checklist-item.error {
        background-color: #fff3f3;
        padding: 0.5rem;
        border-radius: 4px;
    }
`;
document.head.appendChild(style);

class SignaturePad {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Drawing settings
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#000000';
        
        // Touch handling
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.ctx.beginPath();
            this.ctx.moveTo(
                touch.clientX - rect.left,
                touch.clientY - rect.top
            );
        }, false);
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.ctx.lineTo(
                touch.clientX - rect.left,
                touch.clientY - rect.top
            );
            this.ctx.stroke();
        }, false);
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    const pads = {};
    
    // Initialize each signature pad
    document.querySelectorAll('.signature-pad').forEach(canvas => {
        pads[canvas.id] = new SignaturePad(canvas);
    });
    
    // Setup clear buttons
    document.querySelectorAll('.clear-signature').forEach(button => {
        button.addEventListener('click', () => {
            const padId = button.dataset.pad;
            if (pads[padId]) {
                pads[padId].clear();
            }
        });
    });
});
