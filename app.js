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
        this.isDrawing = false;
        this.points = [];
        
        // Set canvas size
        this.resize();
        
        // Set up drawing style
        this.ctx.strokeStyle = '#000';
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
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
    }
    
    addEventListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleEnd, { passive: false });
        
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleStart);
        this.canvas.addEventListener('mousemove', this.handleMove);
        this.canvas.addEventListener('mouseup', this.handleEnd);
        this.canvas.addEventListener('mouseout', this.handleEnd);
        
        // Prevent scrolling while signing
        this.canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    handleStart(event) {
        event.preventDefault();
        
        const point = this.getPoint(event);
        this.isDrawing = true;
        this.points = [point];
        
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
        this.ctx.stroke();
    }
    
    handleMove(event) {
        if (!this.isDrawing) return;
        event.preventDefault();
        
        const point = this.getPoint(event);
        this.points.push(point);
        
        if (this.points.length > 2) {
            const lastTwoPoints = this.points.slice(-2);
            const controlPoint = lastTwoPoints[0];
            const endPoint = {
                x: (lastTwoPoints[1].x + controlPoint.x) / 2,
                y: (lastTwoPoints[1].y + controlPoint.y) / 2,
            };
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.points.slice(-2, -1)[0].x, this.points.slice(-2, -1)[0].y);
            this.ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(endPoint.x, endPoint.y);
        }
    }
    
    handleEnd(event) {
        if (!this.isDrawing) return;
        event.preventDefault();
        this.isDrawing = false;
        this.points = [];
    }
    
    getPoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        const point = event.touches ? event.touches[0] : event;
        return {
            x: (point.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (point.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    isEmpty() {
        const pixels = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        return !pixels.some(pixel => pixel !== 0);
    }
}
