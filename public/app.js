// DisasterBio Application JavaScript
class DisasterBioApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.victims = this.loadVictims();
        this.teams = [
            {id: 'T001', name: 'NGO Team Alpha', lead: 'Dr. Pradeep Singh', contact: '+91-9876540001'},
            {id: 'T002', name: 'Army Medical Corps', lead: 'Lt. Col. Menon', contact: '+91-9876540002'},
            {id: 'T003', name: 'Red Cross Team', lead: 'Ms. Patel', contact: '+91-9876540003'}
        ];
        this.languages = ['Hindi', 'English', 'Tamil', 'Bengali', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.updateDashboard();
        this.populateLanguageCheckboxes();
        setInterval(() => this.updateDateTime(), 1000);
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            if (btn.dataset.tab) {
                btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
            }
        });

        // Registration form
        const regForm = document.getElementById('registrationForm');
        if (regForm) {
            regForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }

        // Biometric buttons
        const fpBtn = document.getElementById('captureFingerprint');
        const photoBtn = document.getElementById('capturePhoto');
        if (fpBtn) fpBtn.addEventListener('click', () => this.simulateFingerprint());
        if (photoBtn) photoBtn.addEventListener('click', () => this.simulatePhoto());

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Search methods
        document.querySelectorAll('.search-method').forEach(method => {
            method.addEventListener('click', (e) => this.switchSearchMethod(e.currentTarget.dataset.method));
        });
    }

    updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-IN', options);
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        switch(tabName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'search':
                this.updateSearchResults();
                break;
            case 'reports':
                this.updateReports();
                break;
        }
    }

    updateDashboard() {
        const stats = this.calculateStats();
        document.getElementById('totalRegistered').textContent = stats.total;
        document.getElementById('activeCases').textContent = stats.active;
        document.getElementById('familiesReunited').textContent = stats.reunited;
        document.getElementById('teamsDeployed').textContent = this.teams.length;

        this.updateActivityFeed();
    }

    calculateStats() {
        return {
            total: this.victims.length,
            active: this.victims.filter(v => ['Missing', 'Critical', 'Missing Family'].includes(v.status)).length,
            reunited: this.victims.filter(v => v.status === 'Safe' && v.notes?.includes('Reunited')).length
        };
    }

    updateActivityFeed() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        const recentVictims = this.victims
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        activityList.innerHTML = recentVictims.map(victim => `
            <div class="activity-item">
                <div class="activity-info">
                    <strong>${victim.name}</strong> registered by ${victim.registeredBy}
                    <span class="activity-time">${this.formatTime(victim.timestamp)}</span>
                </div>
                <span class="victim-status ${victim.status.toLowerCase().replace(' ', '-')}">${victim.status}</span>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
    }

    populateLanguageCheckboxes() {
        const container = document.getElementById('languageCheckboxes');
        if (!container) return;

        container.innerHTML = this.languages.map(lang => `
            <label class="checkbox-item">
                <input type="checkbox" value="${lang}">
                <span>${lang}</span>
            </label>
        `).join('');
    }

    handleRegistration(e) {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(e.target);
        const languages = Array.from(document.querySelectorAll('#languageCheckboxes input:checked'))
            .map(cb => cb.value);

        const victim = {
            id: this.generateVictimId(),
            name: document.getElementById('victimName').value,
            age: parseInt(document.getElementById('victimAge').value),
            gender: document.getElementById('victimGender').value,
            location: document.getElementById('currentLocation').value,
            rescueLocation: document.getElementById('rescueLocation').value || 'Not specified',
            status: document.getElementById('victimStatus').value,
            medicalNeeds: document.getElementById('medicalNeeds').value || 'None specified',
            bloodType: document.getElementById('bloodType').value || 'Unknown',
            allergies: document.getElementById('allergies').value || 'None known',
            familyContact: document.getElementById('familyContact').value || 'Unknown',
            emergencyContact: document.getElementById('emergencyContact').value || 'Unknown',
            languages: languages,
            qrCode: this.generateQRCode(document.getElementById('victimName').value),
            registeredBy: 'Mobile Team - ' + (localStorage.getItem('operatorName') || 'Unknown'),
            timestamp: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            notes: 'Newly registered victim',
            biometricCaptured: this.biometricStatus.fingerprint || this.biometricStatus.photo
        };

        this.victims.unshift(victim);
        this.saveVictims();

        this.showToast('Victim registered successfully!', 'success');
        this.clearRegistrationForm();
        this.updateDashboard();
    }

    generateVictimId() {
        const prefix = 'VIC';
        const number = String(this.victims.length + 1).padStart(3, '0');
        return `${prefix}${number}`;
    }

    generateQRCode(name) {
        const cleanName = name.replace(/\s+/g, '-').toUpperCase();
        const timestamp = new Date().getFullYear();
        return `${this.generateVictimId()}-${cleanName}-${timestamp}`;
    }

    clearRegistrationForm() {
        document.getElementById('registrationForm').reset();
        document.querySelectorAll('#languageCheckboxes input').forEach(cb => cb.checked = false);
        this.biometricStatus = {fingerprint: false, photo: false};
        this.updateBiometricStatus();
    }

    simulateFingerprint() {
        this.showToast('Capturing fingerprint...', 'info');
        setTimeout(() => {
            this.biometricStatus.fingerprint = true;
            this.updateBiometricStatus();
            this.showToast('Fingerprint captured successfully!', 'success');
        }, 2000);
    }

    simulatePhoto() {
        this.showToast('Taking photo...', 'info');
        setTimeout(() => {
            this.biometricStatus.photo = true;
            this.updateBiometricStatus();
            this.showToast('Photo captured successfully!', 'success');
        }, 1500);
    }

    updateBiometricStatus() {
        const statusElement = document.getElementById('biometricStatus');
        if (!statusElement) return;

        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('span:last-child');

        if (this.biometricStatus.fingerprint && this.biometricStatus.photo) {
            indicator.className = 'status-indicator success';
            text.textContent = 'All biometrics captured';
        } else if (this.biometricStatus.fingerprint || this.biometricStatus.photo) {
            indicator.className = 'status-indicator pending';
            text.textContent = 'Partial biometric capture';
        } else {
            indicator.className = 'status-indicator pending';
            text.textContent = 'Ready to capture biometrics';
        }
    }

    switchSearchMethod(method) {
        // Update active search method
        document.querySelectorAll('.search-method').forEach(m => {
            m.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        const searchInput = document.getElementById('searchInput');
        const biometricSearch = document.getElementById('biometricSearch');

        if (method === 'biometric') {
            searchInput.style.display = 'none';
            biometricSearch.style.display = 'block';
        } else {
            searchInput.style.display = 'block';
            biometricSearch.style.display = 'none';

            // Update placeholder based on method
            const placeholders = {
                name: 'Enter name to search...',
                id: 'Enter victim ID...',
                location: 'Enter location...'
            };
            searchInput.placeholder = placeholders[method];
        }
    }

    handleSearch(query) {
        if (query.length < 2) {
            this.updateSearchResults([]);
            return;
        }

        const results = this.victims.filter(victim => 
            victim.name.toLowerCase().includes(query.toLowerCase()) ||
            victim.id.toLowerCase().includes(query.toLowerCase()) ||
            victim.location.toLowerCase().includes(query.toLowerCase())
        );

        this.updateSearchResults(results);
    }

    updateSearchResults(results = this.victims) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No victims found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results.map(victim => `
            <div class="victim-card" onclick="app.showVictimProfile('${victim.id}')">
                <div class="victim-header">
                    <div class="victim-info">
                        <h3>${victim.name}</h3>
                        <p>ID: ${victim.id} • Age: ${victim.age} • ${victim.gender}</p>
                    </div>
                    <span class="victim-status ${victim.status.toLowerCase().replace(' ', '-')}">${victim.status}</span>
                </div>
                <div class="victim-details">
                    <span><i class="fas fa-map-marker-alt"></i> ${victim.location}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatTime(victim.lastUpdated)}</span>
                    <span><i class="fas fa-user-shield"></i> ${victim.registeredBy}</span>
                </div>
            </div>
        `).join('');
    }

    simulateFingerprintScan() {
        this.showToast('Scanning fingerprint...', 'info');
        this.showMatchProgress();

        setTimeout(() => {
            const randomMatch = this.victims[Math.floor(Math.random() * this.victims.length)];
            const confidence = Math.floor(Math.random() * 30) + 70; // 70-99%

            this.showMatchResult(confidence);
            this.updateSearchResults([randomMatch]);
            this.showToast(`Match found with ${confidence}% confidence`, 'success');
        }, 3000);
    }

    simulateFaceScan() {
        this.showToast('Processing facial recognition...', 'info');
        this.showMatchProgress();

        setTimeout(() => {
            const randomMatch = this.victims[Math.floor(Math.random() * this.victims.length)];
            const confidence = Math.floor(Math.random() * 25) + 75; // 75-99%

            this.showMatchResult(confidence);
            this.updateSearchResults([randomMatch]);
            this.showToast(`Face match found with ${confidence}% confidence`, 'success');
        }, 4000);
    }

    showMatchProgress() {
        const matchConfidence = document.getElementById('matchConfidence');
        matchConfidence.style.display = 'block';

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }

            const fill = document.getElementById('confidenceFill');
            const text = document.getElementById('confidenceText');
            fill.style.width = `${progress}%`;
            text.textContent = `Processing: ${Math.floor(progress)}%`;
        }, 200);
    }

    showMatchResult(confidence) {
        const fill = document.getElementById('confidenceFill');
        const text = document.getElementById('confidenceText');

        fill.style.width = `${confidence}%`;
        text.textContent = `Match: ${confidence}%`;

        if (confidence >= 90) {
            fill.style.backgroundColor = 'var(--success-color)';
        } else if (confidence >= 75) {
            fill.style.backgroundColor = 'var(--warning-color)';
        } else {
            fill.style.backgroundColor = 'var(--danger-color)';
        }
    }

    showVictimProfile(victimId) {
        const victim = this.victims.find(v => v.id === victimId);
        if (!victim) return;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="victim-profile">
                <div class="profile-header">
                    <div class="profile-photo">
                        <i class="fas fa-user-circle" style="font-size: 4rem; color: var(--color-text-muted);"></i>
                    </div>
                    <div class="profile-info">
                        <h2>${victim.name}</h2>
                        <p class="victim-id">ID: ${victim.id}</p>
                        <span class="victim-status ${victim.status.toLowerCase().replace(' ', '-')}">${victim.status}</span>
                    </div>
                </div>

                <div class="profile-details">
                    <div class="detail-section">
                        <h3>Personal Information</h3>
                        <div class="detail-grid">
                            <div><strong>Age:</strong> ${victim.age}</div>
                            <div><strong>Gender:</strong> ${victim.gender}</div>
                            <div><strong>Blood Type:</strong> ${victim.bloodType}</div>
                            <div><strong>Languages:</strong> ${victim.languages.join(', ')}</div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Location & Contact</h3>
                        <div class="detail-grid">
                            <div><strong>Current Location:</strong> ${victim.location}</div>
                            <div><strong>Rescue Location:</strong> ${victim.rescueLocation}</div>
                            <div><strong>Family Contact:</strong> ${victim.familyContact}</div>
                            <div><strong>Emergency Contact:</strong> ${victim.emergencyContact}</div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Medical Information</h3>
                        <div class="medical-info">
                            <p><strong>Medical Needs:</strong> ${victim.medicalNeeds}</p>
                            <p><strong>Allergies:</strong> ${victim.allergies}</p>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Registration Details</h3>
                        <div class="detail-grid">
                            <div><strong>Registered By:</strong> ${victim.registeredBy}</div>
                            <div><strong>QR Code:</strong> ${victim.qrCode}</div>
                            <div><strong>Registered:</strong> ${this.formatTime(victim.timestamp)}</div>
                            <div><strong>Last Updated:</strong> ${this.formatTime(victim.lastUpdated)}</div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Notes</h3>
                        <textarea class="notes-textarea" rows="3">${victim.notes}</textarea>
                        <button class="btn primary" onclick="app.updateVictimNotes('${victim.id}')">
                            <i class="fas fa-save"></i> Update Notes
                        </button>
                    </div>

                    <div class="profile-actions">
                        <button class="btn info" onclick="app.printIdCard('${victim.id}')">
                            <i class="fas fa-print"></i> Print ID Card
                        </button>
                        <button class="btn success" onclick="app.printWristband('${victim.id}')">
                            <i class="fas fa-id-badge"></i> Print Wristband
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('victimModal').style.display = 'block';
    }

    updateVictimNotes(victimId) {
        const victim = this.victims.find(v => v.id === victimId);
        if (!victim) return;

        const notesTextarea = document.querySelector('.notes-textarea');
        victim.notes = notesTextarea.value;
        victim.lastUpdated = new Date().toISOString();

        this.saveVictims();
        this.showToast('Notes updated successfully!', 'success');
    }

    printIdCard(victimId) {
        this.showToast('Printing ID card...', 'info');
        setTimeout(() => {
            this.showToast('ID card printed successfully!', 'success');
        }, 2000);
    }

    printWristband(victimId) {
        this.showToast('Printing wristband...', 'info');
        setTimeout(() => {
            this.showToast('Wristband printed successfully!', 'success');
        }, 2000);
    }

    updateReports() {
        this.updateVictimsTable();
    }

    updateVictimsTable() {
        const tableBody = document.getElementById('victimsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = this.victims.map(victim => `
            <tr>
                <td>${victim.id}</td>
                <td>${victim.name}</td>
                <td>${victim.age}</td>
                <td>${victim.gender}</td>
                <td>${victim.location}</td>
                <td><span class="victim-status ${victim.status.toLowerCase().replace(' ', '-')}">${victim.status}</span></td>
                <td>${this.formatTime(victim.timestamp)}</td>
                <td>
                    <button class="btn info btn-sm" onclick="app.showVictimProfile('${victim.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    exportCSV() {
        const csv = this.generateCSV();
        this.downloadFile(csv, 'victims-report.csv', 'text/csv');
        this.showToast('CSV report generated successfully!', 'success');
    }

    generateCSV() {
        const headers = ['ID', 'Name', 'Age', 'Gender', 'Location', 'Status', 'Medical Needs', 'Contact', 'Registered', 'Team'];
        const rows = this.victims.map(v => [
            v.id, v.name, v.age, v.gender, v.location, v.status,
            v.medicalNeeds, v.familyContact, v.timestamp, v.registeredBy
        ]);

        return [headers, ...rows].map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
    }

    exportPDF() {
        this.showToast('Generating PDF report...', 'info');
        setTimeout(() => {
            this.showToast('PDF report generated successfully!', 'success');
        }, 2000);
    }

    sendToAuthorities() {
        this.showToast('Sending report to authorities...', 'info');
        setTimeout(() => {
            this.showToast('Report sent to NDMA and local authorities!', 'success');
        }, 3000);
    }

    downloadFile(content, filename, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
    }

    syncData() {
        this.showToast('Syncing data to cloud...', 'info');

        setTimeout(() => {
            localStorage.setItem('lastSync', new Date().toISOString());
            document.getElementById('lastSync').textContent = 'Just now';
            this.showToast('Data synced successfully!', 'success');
        }, 3000);
    }

    loadVictims() {
        const stored = localStorage.getItem('disasterBioVictims');
        if (stored) {
            return JSON.parse(stored);
        }

        // Sample data
        return [
            {
                id: "VIC001",
                name: "Rajesh Kumar",
                age: 35,
                gender: "Male",
                location: "Tamil Nadu Flood Zone - Sector 7",
                rescueLocation: "Cuddalore District Relief Camp",
                status: "Safe",
                medicalNeeds: "Type 2 Diabetes - needs insulin",
                bloodType: "B+",
                allergies: "Penicillin",
                familyContact: "+91-9876543210",
                emergencyContact: "Wife - Sunita Kumar",
                languages: ["Tamil", "Hindi", "English"],
                qrCode: "VIC001-RAJESH-KUMAR-2024",
                registeredBy: "NGO Team Alpha - Dr. Pradeep",
                timestamp: "2024-08-07T10:30:00",
                lastUpdated: "2024-08-07T15:45:00",
                notes: "Reunited with wife and daughter. Receiving regular medical care."
            },
            {
                id: "VIC002",
                name: "Priya Sharma", 
                age: 28,
                gender: "Female",
                location: "Kerala Landslide Area - Hill Station",
                rescueLocation: "Wayanad Emergency Medical Center",
                status: "Critical",
                medicalNeeds: "Pregnant - 7 months, requires gynecological care",
                bloodType: "A+",
                allergies: "None known",
                familyContact: "Unknown",
                emergencyContact: "Searching for husband - Vikram Sharma",
                languages: ["Malayalam", "Hindi"],
                qrCode: "VIC002-PRIYA-SHARMA-2024",
                registeredBy: "Army Medical Corps - Lt. Col. Menon",
                timestamp: "2024-08-07T14:15:00",
                lastUpdated: "2024-08-07T18:20:00",
                notes: "Stable condition. Baby's heartbeat normal. Needs family support."
            },
            {
                id: "VIC003",
                name: "Mohammed Ali",
                age: 42,
                gender: "Male",
                location: "Gujarat Earthquake Zone - Block 12", 
                rescueLocation: "Bhuj Relief Distribution Center",
                status: "Missing Family",
                medicalNeeds: "Minor cuts and bruises, psychological trauma",
                bloodType: "O-",
                allergies: "Dust, pollen",
                familyContact: "+91-9123456789",
                emergencyContact: "Brother - Hassan Ali +91-9876543211",
                languages: ["Gujarati", "Hindi", "Urdu"],
                qrCode: "VIC003-MOHAMMED-ALI-2024",
                registeredBy: "Red Cross Team - Ms. Patel",
                timestamp: "2024-08-07T09:45:00",
                lastUpdated: "2024-08-07T16:30:00",
                notes: "Still searching for wife and 2 children. Brother contacted and traveling from Mumbai."
            }
        ];
    }

    saveVictims() {
        localStorage.setItem('disasterBioVictims', JSON.stringify(this.victims));
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');

        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle', 
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        icon.className = `toast-icon ${icons[type]}`;
        messageEl.textContent = message;
        toast.className = `toast ${type}`;

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Initialize biometric status
    biometricStatus = {
        fingerprint: false,
        photo: false
    };
}

// Global functions
function closeModal() {
    document.getElementById('victimModal').style.display = 'none';
}

function clearForm() {
    document.getElementById('registrationForm').reset();
    document.querySelectorAll('#languageCheckboxes input').forEach(cb => cb.checked = false);
    app.biometricStatus = {fingerprint: false, photo: false};
    app.updateBiometricStatus();
}

function showAllVictims() {
    app.switchTab('search');
    app.updateSearchResults();
}

function performSearch() {
    const query = document.getElementById('searchInput').value;
    app.handleSearch(query);
}

function simulateFingerprintScan() {
    app.simulateFingerprintScan();
}

function simulateFaceScan() {
    app.simulateFaceScan();
}

function exportCSV() {
    app.exportCSV();
}

function exportPDF() {
    app.exportPDF();
}

function sendToAuthorities() {
    app.sendToAuthorities();
}

function syncData() {
    app.syncData();
}

function exportDatabase() {
    const data = JSON.stringify(app.victims, null, 2);
    app.downloadFile(data, 'disaster-bio-database.json', 'application/json');
    app.showToast('Database exported successfully!', 'success');
}

function importDatabase() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    app.victims = data;
                    app.saveVictims();
                    app.updateDashboard();
                    app.showToast('Database imported successfully!', 'success');
                } catch (error) {
                    app.showToast('Error importing database!', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function clearDatabase() {
    if (confirm('Are you sure you want to clear all victim data? This cannot be undone.')) {
        app.victims = [];
        app.saveVictims();
        app.updateDashboard();
        app.updateSearchResults([]);
        app.showToast('Database cleared successfully!', 'warning');
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new DisasterBioApp();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('victimModal');
    if (event.target === modal) {
        closeModal();
    }
};