const API_BASE = 'http://localhost:8000';

let stream = null;
let processedCount = 0;
let qualityScores = [];

const startBtn = document.getElementById('startBtn');
const captureBtn = document.getElementById('captureBtn');
const stopBtn = document.getElementById('stopBtn');
const camera = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const resultsDiv = document.getElementById('results');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const cameraStatus = document.getElementById('cameraStatus');
const apiStatus = document.getElementById('apiStatus');

startBtn.addEventListener('click', startDetection);
captureBtn.addEventListener('click', captureImage);
stopBtn.addEventListener('click', stopDetection);

// Check backend health on page load
window.addEventListener('load', checkBackendHealth);

async function checkBackendHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json();
        if (data.status === 'healthy') {
            updateSystemStatus('Online', true);
            apiStatus.textContent = 'Backend: Connected';
            apiStatus.classList.remove('offline');
        }
    } catch (err) {
        updateSystemStatus('Offline', false);
        apiStatus.textContent = 'Backend: Offline';
        apiStatus.classList.add('offline');
    }
}

function updateSystemStatus(text, isOnline) {
    statusText.textContent = text;
    if (isOnline) {
        statusIndicator.style.background = '#16a34a';
    } else {
        statusIndicator.style.background = '#dc2626';
    }
}

async function startDetection() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        camera.srcObject = stream;
        
        startBtn.disabled = true;
        captureBtn.disabled = false;
        stopBtn.disabled = false;
        cameraStatus.textContent = 'Active';
        cameraStatus.classList.remove('inactive');
        
        appendResult('Camera initialized successfully');
    } catch (err) {
        appendResult(`❌ Camera Error: ${err.message}`, 'danger');
        cameraStatus.textContent = 'Error';
        cameraStatus.classList.add('inactive');
    }
}

async function captureImage() {
    if (!camera.videoWidth) {
        appendResult('❌ Camera not ready', 'danger');
        return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    ctx.drawImage(camera, 0, 0);
    
    appendResult('📸 Image captured, sending to backend for analysis...');
    
    canvas.toBlob(async (blob) => {
        await sendToBackend(blob);
    }, 'image/jpeg', 0.9);
}

async function sendToBackend(imageBlob) {
    const formData = new FormData();
    formData.append('file', imageBlob, 'dragon_fruit.jpg');
    
    try {
        const res = await fetch(`${API_BASE}/detect`, {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) {
            throw new Error(`Server error: ${res.statusText}`);
        }
        
        const data = await res.json();
        processResults(data);
    } catch (err) {
        appendResult(`❌ Analysis Error: ${err.message}`, 'danger');
    }
}

function processResults(analysisData) {
    processedCount++;
    
    // Update stats
    document.getElementById('processedCount').textContent = processedCount;
    
    // Extract metrics
    const ripeness = analysisData.ripeness_score || 0;
    const quality = analysisData.quality_score || 0;
    const defects = analysisData.defect_probability || 0;
    
    qualityScores.push(quality);
    const avgQuality = (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1);
    document.getElementById('avgQuality').textContent = avgQuality + '%';
    
    // Update metric bars
    document.getElementById('metricRipeness').style.width = ripeness + '%';
    document.getElementById('ripenessPct').textContent = ripeness.toFixed(1) + '%';
    
    document.getElementById('metricQuality').style.width = quality + '%';
    document.getElementById('qualityPct').textContent = quality.toFixed(1) + '%';
    
    document.getElementById('metricDefects').style.width = defects + '%';
    document.getElementById('defectsPct').textContent = defects.toFixed(1) + '%';
    
    // Update detailed parameters
    updateParameterDetails(analysisData);
    
    // Display results
    clearResults();
    appendResult('✓ Analysis Complete', 'success');
    appendResult(`Grade: ${analysisData.grade || 'N/A'}`, 'success');
    appendResult(`Ripeness: ${ripeness.toFixed(1)}%`);
    appendResult(`Quality: ${quality.toFixed(1)}%`);
    appendResult(`Defects: ${defects.toFixed(1)}%`);
    
    if (analysisData.notes) {
        appendResult(`Notes: ${analysisData.notes}`);
    }
}

function updateParameterDetails(data) {
    document.getElementById('colorDetail').textContent = data.color_analysis || 'Processing...';
    document.getElementById('surfaceDetail').textContent = data.surface_quality || 'Processing...';
    document.getElementById('sizeDetail').textContent = data.size_classification || 'Processing...';
    document.getElementById('ripenessDetail').textContent = data.ripeness_level || 'Processing...';
    document.getElementById('gradeDetail').textContent = data.grade || 'Pending...';
    document.getElementById('defectDetail').textContent = data.defect_description || 'Processing...';
}

function stopDetection() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        camera.srcObject = null;
    }
    
    startBtn.disabled = false;
    captureBtn.disabled = true;
    stopBtn.disabled = true;
    cameraStatus.textContent = 'Ready';
    cameraStatus.classList.add('inactive');
    
    clearResults();
    appendResult('Camera stopped');
}

function appendResult(text, type = 'default') {
    const resultsDiv = document.getElementById('results');
    
    if
