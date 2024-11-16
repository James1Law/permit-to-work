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
