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
            noonlight_enabled: false
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
            } else {
                return jsonResponse({ status: "error", message: "Invalid PIN. Use 1234." }, 401);
            }
        }

        if (url.includes('/api/arm')) {
            mockState.state = 2; // Armed Away
            return jsonResponse({ status: "ok", mode: "away" });
        }

        if (url.includes('/api/disarm')) {
            mockState.state = 0; // Ready
            return jsonResponse({ status: "ok" });
        }

        if (url.includes('/api/cameras')) {
            return jsonResponse({
                cameras: [
                    { id: 0, friendly_name: "Front Door", enabled: true, failures: 0, sd_recording_enabled: true },
                    { id: 1, friendly_name: "Backyard", enabled: true, failures: 0, sd_recording_enabled: false }
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
            set: function(val) {
                if (typeof val === 'string' && val.includes('/api/camera/')) {
                    let match = val.match(/\/api\/camera\/(\d+)\//);
                    let idx = match ? match[1] : 1;
                    // For the demo, provide a static placeholder image
                    let timeParam = val.includes('?t=') ? `?t=${Date.now()}` : '';
                    val = `https://picsum.photos/seed/cam${idx}/400/300${timeParam}`;
                }
                return originalImgSrc.set.call(this, val);
            },
            get: function() {
                return originalImgSrc.get.call(this);
            }
        });
    }

})();
