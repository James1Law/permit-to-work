document.addEventListener('DOMContentLoaded', function() {
    const permitForm = document.getElementById('permitForm');
    const signaturePads = new Map();
    
    // Initialize signature pads
    document.querySelectorAll('.signature-pad').forEach(canvas => {
        signaturePads.set(canvas.id, new SignaturePad(canvas));
    });
    
    // Form validation and submission
    permitForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Collect form data
        const formData = new FormData(permitForm);
        const permitData = Object.fromEntries(formData);
        
        // Add signature data
        signaturePads.forEach((pad, id) => {
            permitData[id] = pad.canvas.toDataURL();
        });
        
        // You would typically send this data to a server
        console.log('Permit data:', permitData);
        
        // Show success message
        showToast('Permit submitted successfully!', 'success');
    });
    
    // Form validation function
    function validateForm() {
        let isValid = true;
        
        // Validate atmospheric readings
        const oxygenLevel = parseFloat(document.getElementById('oxygenLevel').value);
        const flammableGases = parseFloat(document.getElementById('flammableGases').value);
        const toxicGases = parseFloat(document.getElementById('toxicGases').value);
        
        if (oxygenLevel < 19.5 || oxygenLevel > 23.5) {
            showToast('Oxygen levels must be between 19.5% and 23.5%', 'error');
            isValid = false;
        }
        
        if (flammableGases > 10) {
            showToast('Flammable gases must be below 10% LEL', 'error');
            isValid = false;
        }
        
        // Validate required checkboxes
        const requiredCheckboxes = permitForm.querySelectorAll('input[type="checkbox"][required]');
        requiredCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                isValid = false;
                checkbox.parentElement.classList.add('error');
            }
        });
        
        // Validate signatures
        signaturePads.forEach((pad, id) => {
            if (pad.isEmpty()) {
                isValid = false;
                document.getElementById(id).parentElement.classList.add('error');
                showToast('Please complete all signatures', 'error');
            }
        });
        
        return isValid;
    }
    
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
    
    // Toast notification function
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        const container = document.querySelector('.toast-container') || createToastContainer();
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    function createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
    
    // Clear signature button functionality
    document.querySelectorAll('.clear-signature').forEach(button => {
        button.addEventListener('click', () => {
            const padId = button.dataset.pad;
            const pad = signaturePads.get(padId);
            if (pad) {
                pad.clear();
                document.getElementById(padId).parentElement.classList.remove('error');
            }
        });
    });
    
    // Initialize save buttons
    document.querySelectorAll('.save-section-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const section = this.dataset.section;
            if (this.classList.contains('edit-mode')) {
                enableSectionEditing(section);
                this.classList.remove('edit-mode');
                this.textContent = `Save ${formatSectionName(section)}`;
            } else {
                await saveSection(section, this);
            }
        });
    });
});

// SignaturePad class definition (if not in a separate file)
class SignaturePad {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.lastPoint = null;
        
        // Set canvas size
        this.resizeCanvas();
        
        // Set drawing style
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Bind event handlers
        this.handleStart = this.handleStart.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        
        // Add event listeners
        this.addEventListeners();
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        
        this.ctx.scale(dpr, dpr);
    }
    
    addEventListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleEnd);
        
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleStart);
        this.canvas.addEventListener('mousemove', this.handleMove);
        this.canvas.addEventListener('mouseup', this.handleEnd);
        this.canvas.addEventListener('mouseout', this.handleEnd);
        
        // Prevent scrolling while signing
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    handleStart(e) {
        e.preventDefault();
        const point = this.getPoint(e);
        this.isDrawing = true;
        this.lastPoint = point;
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
        
        // Hide instructions
        const instructions = this.canvas.parentElement.querySelector('.signature-instructions');
        if (instructions) {
            instructions.style.opacity = '0';
        }
    }
    
    handleMove(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        
        const point = this.getPoint(e);
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
        this.lastPoint = point;
    }
    
    handleEnd(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.closePath();
    }
    
    getPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const point = e.touches ? e.touches[0] : e;
        return {
            x: point.clientX - rect.left,
            y: point.clientY - rect.top
        };
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const instructions = this.canvas.parentElement.querySelector('.signature-instructions');
        if (instructions) {
            instructions.style.opacity = '1';
        }
    }
}

async function saveSection(sectionId, button) {
    if (button.classList.contains('saving')) {
        return;
    }

    // Find the section container
    const sectionContainer = button.closest('.checklist-section');
    
    button.classList.add('saving');
    button.textContent = 'Saving...';

    try {
        const sectionData = collectSectionData(sectionContainer);
        
        if (!validateSectionData(sectionContainer)) {
            button.classList.remove('saving');
            button.textContent = `Save ${formatSectionName(sectionId)}`;
            return;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Make section read-only
        sectionContainer.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.type === 'checkbox') {
                input.disabled = true;
            } else {
                input.readOnly = true;
            }
            input.classList.add('read-only');
        });

        // Add read-only class to section
        sectionContainer.classList.add('read-only-section');

        // Disable any signature pads in the section
        sectionContainer.querySelectorAll('.signature-pad').forEach(canvas => {
            canvas.style.pointerEvents = 'none';
        });

        // Update button state
        button.classList.remove('saving');
        button.classList.add('saved');
        button.textContent = `${formatSectionName(sectionId)} Saved`;
        showToast(`${formatSectionName(sectionId)} saved successfully!`, 'success');

        // Change to edit button after delay
        setTimeout(() => {
            button.classList.remove('saved');
            button.classList.add('edit-mode');
            button.textContent = `Edit ${formatSectionName(sectionId)}`;
        }, 3000);

    } catch (error) {
        console.error('Save error:', error);
        button.classList.remove('saving');
        button.textContent = `Save ${formatSectionName(sectionId)}`;
        showToast('Error saving section. Please try again.', 'error');
    }
}

function collectSectionData(section) {
    const formData = new FormData();
    section.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type === 'checkbox') {
            formData.append(input.id, input.checked);
        } else if (input.type === 'file') {
            Array.from(input.files).forEach(file => {
                formData.append(input.id, file);
            });
        } else {
            formData.append(input.id, input.value);
        }
    });
    return formData;
}

function validateSectionData(section) {
    let isValid = true;
    
    // Check required fields
    section.querySelectorAll('[required]').forEach(field => {
        if (!field.value) {
            field.classList.add('error');
            isValid = false;
        }
    });

    if (!isValid) {
        showToast('Please complete all required fields', 'error');
    }

    return isValid;
}

function enableSectionEditing(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`)
        .closest('.checklist-section');
    
    section.classList.remove('read-only-section');
    
    section.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type === 'checkbox') {
            input.disabled = false;
        } else {
            input.readOnly = false;
        }
        input.classList.remove('read-only');
    });

    section.querySelectorAll('.signature-pad').forEach(canvas => {
        canvas.style.pointerEvents = 'auto';
    });
}

function formatSectionName(sectionId) {
    return sectionId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
