const API_URL = 'http://localhost:8000';

// Elements
const dashboard = document.getElementById('dashboard');
const colorIndicator = document.getElementById('color-indicator');
const batchBreed = document.getElementById('batch-breed');
const batchDate = document.getElementById('batch-date');
const batchStage = document.getElementById('batch-stage');
const climateTemp = document.getElementById('climate-temp');
const climateHum = document.getElementById('climate-hum');
const adviceText = document.getElementById('advice-text');
const alertsContainer = document.getElementById('alerts-container');
const btnAdvanceStage = document.getElementById('btn-advance-stage');

const batchForm = document.getElementById('batch-form');
const climateForm = document.getElementById('climate-form');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', fetchStatus);

async function fetchStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();
        
        updateDashboard(data);
    } catch (error) {
        showToast('Error connecting to API. Is it running?');
        console.error(error);
    }
}

function updateDashboard(data) {
    if (data.status === 'Inactive') {
        dashboard.className = 'card status-Blue';
        colorIndicator.textContent = 'Setup Required';
        batchBreed.textContent = 'No Active Batch';
        batchDate.textContent = '--';
        batchStage.textContent = '--';
        climateTemp.textContent = '--°C';
        climateHum.textContent = '--%';
        adviceText.textContent = data.message;
        alertsContainer.innerHTML = '';
        btnAdvanceStage.disabled = true;
        return;
    }

    // Active Status
    dashboard.className = `card status-${data.dashboard.status_color}`;
    colorIndicator.textContent = data.dashboard.status_color === 'Green' ? 'Safe' : data.dashboard.status_color === 'Orange' ? 'Warning' : 'Danger';
    
    batchBreed.textContent = data.batch.breed;
    const date = new Date(data.batch.start_date);
    batchDate.textContent = `Started: ${date.toLocaleDateString()}`;
    batchStage.textContent = data.batch.stage_name;
    
    climateTemp.textContent = data.climate.temperature !== null ? `${data.climate.temperature}°C` : '--°C';
    climateHum.textContent = data.climate.humidity !== null ? `${data.climate.humidity}%` : '--%';
    
    adviceText.textContent = data.dashboard.advice;

    // Handle Alerts
    alertsContainer.innerHTML = '';
    if (data.alerts && data.alerts.length > 0) {
        data.alerts.forEach(alertText => {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.textContent = alertText;
            alertsContainer.appendChild(div);
        });
    }

    // Enable/disable advance button
    btnAdvanceStage.disabled = data.batch.stage_index >= 5;
}

// Start New Batch
batchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const breed = document.getElementById('breed-select').value;
    
    try {
        const response = await fetch(`${API_URL}/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ breed })
        });
        
        if (response.ok) {
            showToast('New batch started successfully!');
            batchForm.reset();
            fetchStatus();
        }
    } catch (error) {
        showToast('Failed to start batch.');
    }
});

// Log Climate
climateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const temperature = parseFloat(document.getElementById('temp-input').value);
    const humidity = parseFloat(document.getElementById('hum-input').value);
    
    try {
        const response = await fetch(`${API_URL}/climate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temperature, humidity })
        });
        
        const data = await response.json();
        if (response.ok) {
            showToast('Climate logged successfully!');
            climateForm.reset();
            fetchStatus();
        } else {
            showToast(`Error: ${data.detail[0]?.msg || data.detail || 'Validation failed'}`);
        }
    } catch (error) {
        showToast('Failed to log climate.');
    }
});

// Advance Stage
btnAdvanceStage.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/batch/advance`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showToast('Silkworm stage advanced!');
            fetchStatus();
        }
    } catch (error) {
        showToast('Failed to advance stage.');
    }
});

// Toast Utility
let toastTimeout;
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
