// Sentinel Mock API Interceptor for GitHub Pages Demo

(function () {
    console.log("Sentinel Mock API Interceptor Loaded");

    const originalFetch = window.fetch;

    // Simulated Backend State
    let mockState = {
        config: {
            acct_id: "DEMO-123",
            name: "GitHub Demo Site",
            email: "demo@example.com",
            location_lat: 41.4993,
            location_lon: -81.6944,
            master_pin: "1234",
            arm_delay_seconds: 30,
            entry_delay_seconds: 20,
            noonlight_enabled: false,
            state: 0,
            ready: true,
            violation: "None"
        },
        state: 0, // 0=READY, 1=EXITING, 2=ARMED_AWAY, 3=ARMED_STAY, 4=ARMED_NIGHT, 5=ENTRY, 6=ALARMED
        ready: true,
        network: {
            ip: "123.45.67.89",
            ssid: "Demo_WiFi",
            rssi: -50,
            wan_status: "Online"
        },
        uptime: 3600,
        firmware: "v5.3.5-demo"
    };

    window.fetch = async function (resource, config) {
        let url = "";
        if (typeof resource === "string") url = resource;
        else if (resource instanceof Request) url = resource.url;

        // If not /api/ and not /status, let it pass through (for .json files, weather, etc)
        if (!url.includes('/api/') && !url.includes('/status')) {
            return originalFetch.apply(this, arguments);
        }

        console.log(`[Mock API] Intercepted: ${url}`);

        // Helper to mock response
        const jsonResponse = (data, status = 200) => {
            return new Response(JSON.stringify(data), {
                status: status,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        if (url.includes('/api/status') || url.endsWith('/status')) {
            return jsonResponse(mockState);
        }

        if (url.includes('/api/auth')) {
            let body = (config && config.body) ? JSON.parse(config.body) : {};
            if (body.pin === "1234") {
                return jsonResponse({ status: "ok", token: "demo_token_12345", user: "Demo Admin", admin: true, authenticated: true, is_admin: true, name: "Demo Admin" });
            } else if (body.pin === "4321") {
                return jsonResponse({ status: "ok", token: "demo_token_43210", user: "Demo User", admin: false, authenticated: true, is_admin: false, name: "Demo User" });
            } else {
                return jsonResponse({ status: "error", message: "Invalid PIN. Use 1234 or 4321." }, 401);
            }
        }

        if (url.includes('/api/arm')) {
            mockState.state = 2; // Armed Away
            mockState.config.state = 2;
            return jsonResponse({ status: "ok", mode: "away" });
        }

        if (url.includes('/api/disarm')) {
            mockState.state = 0; // Ready
            mockState.config.state = 0;
            return jsonResponse({ status: "ok" });
        }

        if (url.includes('/api/cameras')) {
            return jsonResponse({
                cameras: [
                    { id: 0, friendly_name: "Front Door", enabled: true, failures: 0, sd_recording_enabled: true },
                    { id: 1, friendly_name: "Backyard", enabled: true, failures: 0, sd_recording_enabled: false },
                    { id: 2, friendly_name: "Doorbell", enabled: true, failures: 0, sd_recording_enabled: true },
                    { id: 3, friendly_name: "Sidewalk", enabled: true, failures: 0, sd_recording_enabled: false }
                ]
            });
        }

        if (url.includes('/api/camera/')) {
            return jsonResponse({ status: "ok" });
        }

        if (url.includes('/api/config/update')) {
            return jsonResponse({ status: "ok" });
        }

        if (url.includes('/api/config')) {
            return jsonResponse(mockState.config);
        }

        if (url.includes('/api/audit')) {
            return jsonResponse({
                events: [
                    { id: 100, ts: Math.floor(Date.now() / 1000) - 300, type: 1, user: "Admin", desc: "System Disarmed" },
                    { id: 99, ts: Math.floor(Date.now() / 1000) - 3600, type: 2, user: "System", desc: "System Armed (Away)" }
                ],
                total: 2
            });
        }

        if (url.includes('/api/esphome/delete')) {
            return jsonResponse({ status: "ok" });
        }

        if (url.includes('/api/esphome')) {
            return jsonResponse({
                devices: [
                    { id: "front-door-cam", address: "192.168.1.50", status: "online" }
                ]
            });
        }

        if (url.includes('/api/logs')) {
            return jsonResponse({ logs: "00:00:00 [INFO] System started\n00:00:01 [INFO] Network connected\n" });
        }

        if (url.includes('/api/test/') || url.includes('/api/diagnostics/run')) {
            return jsonResponse({ status: "ok" });
        }

        if (url.includes('/api/trigger') || url.includes('/api/relay/toggle')) {
            return jsonResponse({ status: "ok" });
        }

        if (url.includes('/api/users')) {
            return jsonResponse([
                { id: 0, name: "Admin", email: "demo@example.com", role: "master" }
            ]);
        }

        if (url.includes('/api/zones')) {
            return jsonResponse([
                { id: 0, name: "Front Door", type: "entry", open: false, bypassed: false },
                { id: 1, name: "Back Door", type: "entry", open: false, bypassed: false },
                { id: 2, name: "Living Room Motion", type: "motion", open: false, bypassed: false }
            ]);
        }

        if (url.includes('/api/relays')) {
            return jsonResponse([
                { id: 0, name: "Siren", state: 0 },
                { id: 1, name: "Porch Light", state: 1 }
            ]);
        }

        // Default ok for unhandled mocked routes to prevent UI crashes
        console.warn(`[Mock API] Returning generic OK for: ${url}`);
        return jsonResponse({ status: "ok", message: "Generic Mock Response" });
    };

    // Mock Image SRC setter to intercept camera feeds
    const originalImgSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (originalImgSrc) {
        Object.defineProperty(HTMLImageElement.prototype, 'src', {
            set: function (val) {
                if (typeof val === 'string' && val.includes('/api/camera/')) {
                    let match = val.match(/\/api\/camera\/(\d+)\//);
                    let idx = match ? parseInt(match[1]) : 1;
                    // For the demo, provide realistic images
                    let timeParam = val.includes('?t=') ? `?t=${Date.now()}` : '';
                    if (idx === 0) {
                        val = `img/cam0.png${timeParam}`;
                    } else if (idx === 1) {
                        val = `img/cam1.png${timeParam}`;
                    } else if (idx === 2) {
                        val = `img/cam2.png${timeParam}`;
                    } else if (idx === 3) {
                        val = `img/cam3.png${timeParam}`;
                    } else {
                        val = `https://loremflickr.com/400/300/yard?lock=${idx + 10}${timeParam.replace('?t=', '&t=')}`;
                    }
                }
                return originalImgSrc.set.call(this, val);
            },
            get: function () {
                return originalImgSrc.get.call(this);
            }
        });
    }

    // Inject Help Modal and Button (replaces alert)
    window.addEventListener('DOMContentLoaded', () => {
        // Remove old hardcoded button if it exists
        const oldBtns = document.querySelectorAll('button');
        oldBtns.forEach(b => { if (b.innerText === '?') b.remove(); });

        const helpBtn = document.createElement('div');
        helpBtn.innerHTML = '?';
        Object.assign(helpBtn.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '9999',
            background: '#00d4ff', color: '#000', borderRadius: '50%',
            width: '50px', height: '50px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 'bold', fontSize: '24px',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,212,255,0.4)',
            userSelect: 'none'
        });

        const modal = document.createElement('div');
        Object.assign(modal.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#080c12', border: '1px solid #00d4ff', borderRadius: '10px',
            padding: '25px', zIndex: '10000', color: '#fff', width: '80%', maxWidth: '400px',
            display: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', fontFamily: 'sans-serif'
        });
        modal.innerHTML = `
            <h2 style="margin-top:0; color:#00d4ff; border-bottom:1px solid #333; padding-bottom:10px;">Demo Instructions</h2>
            <p><strong>1. Admin PIN:</strong> <span style="color:#00d4ff">1234</span> (Full Access)</p>
            <p><strong>2. User PIN:</strong> <span style="color:#00d4ff">4321</span> (Non-Admin)</p>
            <p><strong>3. Local Mock:</strong> The system state is mocked locally in your browser (no real backend).</p>
            <p><strong>4. Features:</strong> Explore all tabs (Cameras, Diagnostics, Network) to see the interface.</p>
            <p><strong>5. Testing:</strong> You can bypass zones or trigger alarms in Diagnostics to see the UI respond.</p>
            <div style="text-align:center; margin-top:20px;">
                <button id="closeHelpBtn" style="background:#00d4ff; color:#000; border:none; padding:10px 20px; border-radius:5px; font-weight:bold; cursor:pointer;">Got it!</button>
            </div>
        `;

        const backdrop = document.createElement('div');
        Object.assign(backdrop.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)', zIndex: '9998', display: 'none', backdropFilter: 'blur(3px)'
        });

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        document.body.appendChild(helpBtn);

        helpBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            backdrop.style.display = 'block';
        });

        const close = () => {
            modal.style.display = 'none';
            backdrop.style.display = 'none';
        };

        modal.querySelector('#closeHelpBtn').addEventListener('click', close);
        backdrop.addEventListener('click', close);
    });

})();
