// ========================================
// SHIP MONITORING SYSTEM - MERGED CODE
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // NAVIGATION ACTIVE STATE
    // ========================================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ========================================
    // ROUTE SELECTION VARIABLES
    // ========================================
    let selectedRoute = null;
    let isStarted = false;
    let currentAnimationInterval = null;
    let satellitePolyline = null; // Polyline untuk trail di Satellite Map (TANPA MARKER)

    const routeButtons = document.querySelectorAll('.route-btn');
    const lintasanABtn = routeButtons[0];
    const lintasanBBtn = routeButtons[1];
    const startBtn = routeButtons[2];

    // ========================================
    // PATH GENERATION FUNCTION
    // ========================================
    function generatePath(startTop, startLeft, directions, step = 5) {
        const path = [];
        let currentTop = startTop;
        let currentLeft = startLeft;

        directions.forEach(dir => {
            switch (dir) {
                case 'up':
                    currentTop -= step;
                    break;
                case 'down':
                    currentTop += step;
                    break;
                case 'left':
                    currentLeft -= step;
                    break;
                case 'right':
                    currentLeft += step;
                    break;
                case 'up-left':
                    currentTop -= step;
                    currentLeft -= step * 0.3;
                    break;
                case 'up-right':
                    currentTop -= step;
                    currentLeft += step * 0.3;
                    break;
                case 'down-left':
                    currentTop += step;
                    currentLeft -= step * 0.3;
                    break;
                case 'down-right':
                    currentTop += step;
                    currentLeft += step * 0.3;
                    break;
            }
            path.push({ top: currentTop, left: currentLeft });
        });

        return path;
    }

    // ========================================
    // PIXEL TO LAT/LNG CONVERSION
    // ========================================
    function pixelToLatLng(top, left, containerWidth, containerHeight) {
        const bounds = {
            north: 3.560089663827306,
            south: 3.559089663827306,
            west: 98.65696192628275,
            east: 98.65796192628275
        };

        const normalizedX = left / containerWidth;
        const normalizedY = top / containerHeight;

        const lng = bounds.west + (normalizedX * (bounds.east - bounds.west));
        const lat = bounds.north - (normalizedY * (bounds.north - bounds.south));

        return [lat, lng];
    }

    // ========================================
    // SHIP ANIMATION FUNCTION
    // ========================================
    function animateShip(container, shipIcon, path, speed = 250) {
        // Hentikan animasi sebelumnya
        if (currentAnimationInterval) {
            clearInterval(currentAnimationInterval);
            currentAnimationInterval = null;
        }

        // Reset polyline
        if (satellitePolyline) {
            map.removeLayer(satellitePolyline);
        }
        const trailCoordinates = [];

        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        let index = 0;
        currentAnimationInterval = setInterval(() => {
            if (index >= path.length - 1) {
                clearInterval(currentAnimationInterval);
                currentAnimationInterval = null;
                console.log('Kapal sampai di tujuan 🚢');
                return;
            }

            const { top, left } = path[index];
            const { top: nextTop, left: nextLeft } = path[index + 1];

            // Update Virtual Map
            shipIcon.style.top = top + 'px';
            shipIcon.style.left = left + 'px';

            // Hitung sudut rotasi
            const dx = nextLeft - left;
            const dy = nextTop - top;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const rotation = angle + 45;

            const arrow = shipIcon.querySelector('i');
            if (arrow) {
                arrow.style.transform = `rotate(${rotation}deg)`;
            }

            // Jejak lintasan di Virtual Map
            const trail = document.createElement('div');
            trail.className = 'trail-dot route-element';
            trail.style.position = 'absolute';
            trail.style.width = '5px';
            trail.style.height = '5px';
            trail.style.borderRadius = '50%';
            trail.style.backgroundColor = '#1976D2';
            trail.style.opacity = '0.6';
            trail.style.top = (top + 10) + 'px';
            trail.style.left = (left + 8) + 'px';
            container.appendChild(trail);

            // Update Satellite Map - HANYA TRAIL
            const latLng = pixelToLatLng(top, left, containerWidth, containerHeight);
            trailCoordinates.push(latLng);

            if (satellitePolyline) {
                map.removeLayer(satellitePolyline);
            }
            satellitePolyline = L.polyline(trailCoordinates, {
                color: '#1976D2',
                weight: 3,
                opacity: 0.7
            }).addTo(map);

            map.panTo(latLng);

            index++;
        }, speed);
    }

    // ========================================
    // UPDATE VIRTUAL MAP
    // ========================================
    function updateVirtualMap(route) {
        const virtualMapGrid = document.querySelector('.map-grid');
        if (!virtualMapGrid) return;

        // Remove ALL existing elements
        const oldElements = virtualMapGrid.querySelectorAll('.route-element, .ship-icon, .trail-dot');
        oldElements.forEach(el => el.remove());

        const specificElements = virtualMapGrid.querySelectorAll('.b-label, .red-dot, .green-dot, .green-rect, .blue-rect, .biggreen-rect, .anchor-logo');
        specificElements.forEach(el => el.remove());

        // Clear satellite map
        if (satellitePolyline) {
            map.removeLayer(satellitePolyline);
            satellitePolyline = null;
        }

        console.log('Cleared all elements, switching to route:', route);

        if (route === 'A') {
            createLintasanA(virtualMapGrid);
        } else if (route === 'B') {
            createLintasanB(virtualMapGrid);
        }
    }

    // ========================================
    // MIRROR POSITION HELPER
    // ========================================
    function mirrorPosition(left) {
        const leftPercent = parseFloat(left);
        return (100 - leftPercent) + '%';
    }

    // ========================================
    // CREATE LINTASAN A
    // ========================================
    function createLintasanA(container) {
        const aLabel = document.createElement('div');
        aLabel.className = 'b-label route-element';
        aLabel.textContent = 'A';
        aLabel.style.top = '185px';
        aLabel.style.left = '50.5%';
        container.appendChild(aLabel);

        const shipIcon = document.createElement('div');
        shipIcon.className = 'ship-icon route-element';
        shipIcon.style.position = 'absolute';
        shipIcon.style.top = '270px';
        shipIcon.style.left = '325px';
        shipIcon.style.zIndex = '100';
        shipIcon.innerHTML = `<i class="fa-solid fa-location-arrow" style="font-size: 18px; color: #455A64; filter: drop-shadow(0 0 3px #0D47A1); transform: rotate(-45deg); transition: transform 0.2s linear;"></i>`;
        container.appendChild(shipIcon);

        const directions = [
            'up','up','up','up','up','up','up','up','up','up','up',
            'up-left','up-left','up-left','up-left','up-left','left',
            'left','up-left','up','up','up-right','up','up-right','right',
            'up-right','right','up-right','right','right','right','right',
            'up-right','up','up','up','up','up','up','up','up-left','left',
            'up-left','up-left','up-left','up-left','up-left','up-left','up-left',
            'up-left','up-left','left','left','up-left','up-left','up-left','up-left',
            'up-left','left','up-left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','left','down-left','left','left','down-left','down-left','down','left','left','left','left','left','down-left','down-left','down-left','down-left','down-left','down-left','down-left','down-left','left','left','down-left','down-left','down-left','down','down','down','down-left','down-left','down-left','down-left','down-left','down-left','down-left','down-left','down-left','down','down','down','down-left','down','down','down','down','down','down','down','down','down','down-right','down-right','right','-down-right','right','down-right','right','right','down-right','down-right','down-right','down-right','right','down-right','right','down-right','right','down','down','right','right','down-right'
        ];

        const shipPath = generatePath(270, 325, directions, 5);
        animateShip(container, shipIcon, shipPath, 700);
        addLintasanAMarkers(container);
    }

    // ========================================
    // CREATE LINTASAN B
    // ========================================
    function createLintasanB(container) {
        const bLabel = document.createElement('div');
        bLabel.className = 'b-label route-element';
        bLabel.textContent = 'B';
        bLabel.style.top = '185px';
        bLabel.style.left = mirrorPosition('50.5%');
        container.appendChild(bLabel);

        const shipIcon = document.createElement('div');
        shipIcon.className = 'ship-icon route-element';
        shipIcon.style.position = 'absolute';
        shipIcon.style.top = '270px';
        shipIcon.style.left = '35px';
        shipIcon.style.zIndex = '100';
        shipIcon.innerHTML = `<i class="fa-solid fa-location-arrow" style="font-size: 18px; color: #455A64; filter: drop-shadow(0 0 3px #0D47A1); transform: rotate(135deg); transition: transform 0.2s linear;"></i>`;
        container.appendChild(shipIcon);

        const directions = [
            'up','up','up','up','up','up','up','up','up','up','up',
            'up-right','up-right','up-right','up-right','up-right','right',
            'right','up-right','up','up','up-left','up','up-left','left',
            'up-left','left','up-left','left','left','left','left',
            'up-left','up','up','up','up','up','up','up','up-right','right',
            'up-right','up-right','up-right','up-right','up-right','up-right','up-right',
            'up-right','up-right','right','right','up-right','up-right','up-right','up-right',
            'up-right','right','up-right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','right','down-right','right','right','down-right','down-right','down','right','right','right','right','right','down-right','down-right','down-right','down-right','down-right','down-right','down-right','down-right','right','right','down-right','down-right','down-right','down','down','down','down-right','down-right','down-right','down-right','down-right','down-right','down-right','down-right','down-right','down','down','down','down-right','down','down','down','down','down','down','down','down','down','down-left','down-left','left','-down-left','left','down-left','left','left','down-left','down-left','down-left','down-left','left','down-left','left','down-left','left','down','down','left','left','down-left'
        ];

        const shipPath = generatePath(270, 35, directions, 5);
        animateShip(container, shipIcon, shipPath, 700);
        addLintasanBMarkers(container);
    }

    // ========================================
    // ADD MARKERS - LINTASAN A
    // ========================================
    function addLintasanAMarkers(container) {
        const redDotsA = [
            { top: '227px', left: '8%' },
            { top: '170px', left: '8%' },
            { top: '120px', left: '12%' },
            { top: '55px', left: '41%' },
            { top: '55px', left: '48%' },
            { top: '55px', left: '55%' },
            { top: '55px', left: '62%' },
            { top: '154px', left: '89%' },
            { top: '197px', left: '81%' },
            { top: '230px', left: '85%' }
        ];

        redDotsA.forEach(pos => {
            const dot = document.createElement('div');
            dot.className = 'red-dot route-element';
            dot.style.top = pos.top;
            dot.style.left = pos.left;
            container.appendChild(dot);
        });

        const greenDotsA = [
            { top: '227px', left: '15%' },
            { top: '170px', left: '15%' },
            { top: '120px', left: '18%' },
            { top: '35px', left: '41%' },
            { top: '35px', left: '48%' },
            { top: '35px', left: '55%' },
            { top: '35px', left: '62%' },
            { top: '154px', left: '96%' },
            { top: '197px', left: '87%' },
            { top: '230px', left: '91%' }
        ];

        greenDotsA.forEach(pos => {
            const dot = document.createElement('div');
            dot.className = 'green-dot route-element';
            dot.style.top = pos.top;
            dot.style.left = pos.left;
            container.appendChild(dot);
        });

        const greenRect = document.createElement('div');
        greenRect.className = 'green-rect route-element';
        greenRect.style.top = '276px';
        greenRect.style.left = '14%';
        container.appendChild(greenRect);

        const blueRect = document.createElement('div');
        blueRect.className = 'blue-rect route-element';
        blueRect.style.top = '304px';
        blueRect.style.left = '22%';
        container.appendChild(blueRect);

        const bigGreenRect = document.createElement('div');
        bigGreenRect.className = 'biggreen-rect route-element';
        bigGreenRect.style.top = '338px';
        bigGreenRect.style.left = '85%';
        container.appendChild(bigGreenRect);

        const anchorLogo = document.createElement('div');
        anchorLogo.className = 'anchor-logo route-element';
        anchorLogo.style.top = '312px';
        anchorLogo.style.left = '88%';
        anchorLogo.innerHTML = '<i class="ri-anchor-fill" style="color:#7a7a7a; font-size:30px;"></i>';
        container.appendChild(anchorLogo);
    }

    // ========================================
    // ADD MARKERS - LINTASAN B
    // ========================================
    function addLintasanBMarkers(container) {
        const redDotsA = [
            { top: '227px', left: '8%' },
            { top: '170px', left: '8%' },
            { top: '120px', left: '12%' },
            { top: '55px', left: '41%' },
            { top: '55px', left: '48%' },
            { top: '55px', left: '55%' },
            { top: '55px', left: '62%' },
            { top: '154px', left: '89%' },
            { top: '197px', left: '81%' },
            { top: '230px', left: '85%' }
        ];

        redDotsA.forEach(pos => {
            const dot = document.createElement('div');
            dot.className = 'red-dot route-element';
            dot.style.top = pos.top;
            dot.style.left = mirrorPosition(pos.left);
            container.appendChild(dot);
        });

        const greenDotsA = [
            { top: '227px', left: '15%' },
            { top: '170px', left: '15%' },
            { top: '120px', left: '18%' },
            { top: '35px', left: '41%' },
            { top: '35px', left: '48%' },
            { top: '35px', left: '55%' },
            { top: '35px', left: '62%' },
            { top: '154px', left: '96%' },
            { top: '197px', left: '87%' },
            { top: '230px', left: '91%' }
        ];

        greenDotsA.forEach(pos => {
            const dot = document.createElement('div');
            dot.className = 'green-dot route-element';
            dot.style.top = pos.top;
            dot.style.left = mirrorPosition(pos.left);
            container.appendChild(dot);
        });

        const greenRect = document.createElement('div');
        greenRect.className = 'green-rect route-element';
        greenRect.style.top = '276px';
        greenRect.style.left = mirrorPosition('14%');
        container.appendChild(greenRect);

        const blueRect = document.createElement('div');
        blueRect.className = 'blue-rect route-element';
        blueRect.style.top = '304px';
        blueRect.style.left = mirrorPosition('22%');
        container.appendChild(blueRect);

        const bigGreenRect = document.createElement('div');
        bigGreenRect.className = 'biggreen-rect route-element';
        bigGreenRect.style.top = '338px';
        bigGreenRect.style.left = mirrorPosition('85%');
        container.appendChild(bigGreenRect);

        const anchorLogo = document.createElement('div');
        anchorLogo.className = 'anchor-logo route-element';
        anchorLogo.style.top = '312px';
        anchorLogo.style.left = mirrorPosition('88%');
        anchorLogo.innerHTML = '<i class="ri-anchor-fill" style="color:#7a7a7a; font-size:30px;"></i>';
        container.appendChild(anchorLogo);
    }

    // ========================================
    // UPDATE BUTTON STATES
    // ========================================
    function updateButtonStates(activeRoute) {
        routeButtons.forEach(btn => btn.classList.remove('active', 'secondary'));

        if (activeRoute === 'A') {
            lintasanABtn.classList.add('active');
            lintasanBBtn.classList.add('secondary');
        } else if (activeRoute === 'B') {
            lintasanBBtn.classList.add('active');
            lintasanABtn.classList.add('secondary');
        }
    }

    // ========================================
    // BUTTON EVENT LISTENERS
    // ========================================
    lintasanABtn.addEventListener('click', function() {
        selectedRoute = 'A';
        isStarted = false;
        updateButtonStates('A');
        startBtn.classList.remove('active');
        updateVirtualMap('A');
        console.log('Lintasan A dipilih (ORIGINAL)');
    });

    lintasanBBtn.addEventListener('click', function() {
        selectedRoute = 'B';
        isStarted = false;
        updateButtonStates('B');
        startBtn.classList.remove('active');
        updateVirtualMap('B');
        console.log('Lintasan B dipilih (MIRROR dari A)');
    });

    startBtn.addEventListener('click', function() {
        if (!selectedRoute) {
            alert('Pilih lintasan terlebih dahulu (A atau B)');
            return;
        }
        isStarted = true;
        startBtn.classList.add('active');
        console.log('Misi dimulai dengan Lintasan ' + selectedRoute);
    });

    // ========================================
    // VIDEO STREAM FUNCTIONALITY
    // ========================================
    const surfaceStream = document.getElementById('surface-stream');
    const underwaterStream = document.getElementById('underwater-stream');
    const surfaceStatus = document.getElementById('surface-status');
    const underwaterStatus = document.getElementById('underwater-status');

    function takeSnapshot(imgElement, streamName) {
        try {
            if (!imgElement || !imgElement.complete) {
                console.warn('Stream tidak tersedia untuk snapshot');
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = imgElement.naturalWidth || 1280;
            canvas.height = imgElement.naturalHeight || 720;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = streamName + '_' + new Date().toISOString().replace(/[:.]/g, '-') + '.png';
            document.body.appendChild(a);
            a.click();
            a.remove();

            console.log('Snapshot saved: ' + streamName);
        } catch (err) {
            console.error('Snapshot gagal:', err);
        }
    }

    // Snapshot buttons
    const btnSnapshotSurface = document.getElementById('btn-snapshot-surface');
    const btnSnapshotUnderwater = document.getElementById('btn-snapshot-underwater');

    if (btnSnapshotSurface) {
        btnSnapshotSurface.addEventListener('click', function() {
            takeSnapshot(surfaceStream, 'surface');
        });
    }

    if (btnSnapshotUnderwater) {
        btnSnapshotUnderwater.addEventListener('click', function() {
            takeSnapshot(underwaterStream, 'underwater');
        });
    }

    // Stream status monitoring
    if (surfaceStream) {
        surfaceStream.addEventListener('load', function() {
            surfaceStatus.textContent = 'LIVE';
            surfaceStatus.classList.remove('offline');
        });

        surfaceStream.addEventListener('error', function() {
            surfaceStatus.textContent = 'OFFLINE';
            surfaceStatus.classList.add('offline');
        });
    }

    if (underwaterStream) {
        underwaterStream.addEventListener('load', function() {
            underwaterStatus.textContent = 'LIVE';
            underwaterStatus.classList.remove('offline');
        });

        underwaterStream.addEventListener('error', function() {
            underwaterStatus.textContent = 'OFFLINE';
            underwaterStatus.classList.add('offline');
        });
    }

    // ========================================
    // LOGOUT FUNCTIONALITY
    // ========================================
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Apakah Anda yakin ingin logout?')) {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
                this.disabled = true;

                setTimeout(() => {
                    window.location.href = '/logout';
                }, 1000);
            }
        });
    }

    // ========================================
    // CHART FUNCTIONALITY
    // ========================================
    const speedData = {
        labels: ['08:00', '08:05', '08:10', '08:15', '08:20', '08:25', '08:30', '08:35', '08:40', '08:45'],
        datasets: [{
            label: 'Kecepatan (knot)',
            data: [0, 2.5, 3.8, 4.2, 3.9, 3.5, 3.2, 2.8, 2.1, 0],
            borderColor: '#39d353',
            backgroundColor: 'rgba(57, 211, 83, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };

    const positionData = {
        labels: ['Posisi 1', 'Posisi 2', 'Posisi 3', 'Posisi 4', 'Posisi 5', 'Posisi 6', 'Posisi 7', 'Posisi 8', 'Posisi 9', 'Posisi 10'],
        datasets: [{
            label: 'Latitude (°N)',
            data: [5.5481, 5.5482, 5.5483, 5.5484, 5.5485, 5.5486, 5.5487, 5.5488, 5.5489, 5.5490],
            borderColor: '#64b5f6',
            backgroundColor: 'rgba(100, 181, 246, 0.1)',
            borderWidth: 2,
            fill: false,
            yAxisID: 'y'
        }, {
            label: 'Longitude (°E)',
            data: [95.3237, 95.3238, 95.3239, 95.3240, 95.3241, 95.3242, 95.3243, 95.3244, 95.3245, 95.3246],
            borderColor: '#ffb74d',
            backgroundColor: 'rgba(255, 183, 77, 0.1)',
            borderWidth: 2,
            fill: false,
            yAxisID: 'y1'
        }]
    };

    const speedConfig = {
        type: 'line',
        data: speedData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Kecepatan Kapal vs Waktu',
                    color: '#d9d9e2',
                    font: { size: 14 }
                },
                legend: {
                    labels: { color: '#d9d9e2' }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#9da0a9' }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#9da0a9' },
                    title: {
                        display: true,
                        text: 'Kecepatan (knot)',
                        color: '#9da0a9'
                    }
                }
            }
        }
    };

    const positionConfig = {
        type: 'line',
        data: positionData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Trajektori Posisi Kapal',
                    color: '#d9d9e2',
                    font: { size: 14 }
                },
                legend: {
                    labels: { color: '#d9d9e2' }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#9da0a9' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#9da0a9' },
                    title: {
                        display: true,
                        text: 'Latitude (°N)',
                        color: '#9da0a9'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#9da0a9' },
                    title: {
                        display: true,
                        text: 'Longitude (°E)',
                        color: '#9da0a9'
                    }
                }
            }
        }
    };

    // Initialize charts
    const speedChartEl = document.getElementById('speedChart');
    const positionChartEl = document.getElementById('positionChart');

    if (speedChartEl && typeof Chart !== 'undefined') {
        const speedCtx = speedChartEl.getContext('2d');
        const speedChart = new Chart(speedCtx, speedConfig);

        const downloadSpeedBtn = document.getElementById('download-speed-chart');
        if (downloadSpeedBtn) {
            downloadSpeedBtn.addEventListener('click', function() {
                const link = document.createElement('a');
                link.download = 'grafik-kecepatan.png';
                link.href = speedChart.toBase64Image();
                link.click();
            });
        }
    }

    if (positionChartEl && typeof Chart !== 'undefined') {
        const positionCtx = positionChartEl.getContext('2d');
        const positionChart = new Chart(positionCtx, positionConfig);

        const downloadPositionBtn = document.getElementById('download-position-chart');
        if (downloadPositionBtn) {
            downloadPositionBtn.addEventListener('click', function() {
                const link = document.createElement('a');
                link.download = 'grafik-posisi.png';
                link.href = positionChart.toBase64Image();
                link.click();
            });
        }
    }

    // ========================================
    // TIME UPDATE FUNCTION
    // ========================================
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID');
        const dateString = now.toLocaleDateString('id-ID');
        const dayString = now.toLocaleDateString('id-ID', { weekday: 'long' });

        const geoValues = document.querySelectorAll('.geo-value');
        if (geoValues.length >= 3) {
            geoValues[2].textContent = timeString;
            geoValues[1].textContent = dateString;
            geoValues[0].textContent = dayString;
        }
    }

    setInterval(updateTime, 1000);
    updateTime();

    // ========================================
    // INITIALIZE WITH LINTASAN A
    // ========================================
    selectedRoute = 'A';
    updateButtonStates('A');
    updateVirtualMap('A');

    console.log('Ship Monitoring System initialized successfully');
});

// ========================================
// LEAFLET MAP INITIALIZATION
// ========================================
var map = L.map('map').setView([3.559589663827306, 98.65746192628275], 20);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Tidak ada marker kapal di satellite map - hanya akan muncul trail saat animasi berjalan