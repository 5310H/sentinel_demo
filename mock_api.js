// Sentinel Mock API Interceptor for GitHub Pages Demo

(function() {
    console.log("Sentinel Mock API Interceptor Loaded");

    const originalFetch = window.fetch;
    
    // Simulated Backend State
    let mockState = {
        config: {
            acct_id: "DEMO-123",
            name: "GitHub Demo Site",
            email: "demo@example.com",
            location_lat: 41.4993,
            location_lon: -81.6944
        },
        state: 0, // 0=READY, 1=ARMED_AWAY, etc.
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

    window.fetch = async function(resource, config) {
        let url = "";
        if (typeof resource === "string") url = resource;
        else if (resource instanceof Request) url = resource.url;

        // Only intercept /api/ endpoints. Pass through weather/sports.
        if (!url.includes('/api/')) {
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

        if (url.includes('/api/status')) {
            return jsonResponse(mockState);
        }

        if (url.includes('/api/auth')) {
            let body = config ? JSON.parse(config.body) : {};
            // Accept any PIN starting with 1234
            if (body.pin === "1234") {
                return jsonResponse({
                    status: "ok",
                    token: "demo_token_12345",
                    user: "Demo Admin",
                    admin: true
                });
            } else {
                return jsonResponse({ status: "error", message: "Invalid PIN. Use 1234." }, 401);
            }
        }

        if (url.includes('/api/arm')) {
            mockState.state = 1; // Armed
            return jsonResponse({ status: "ok", mode: "away" });
        }

        if (url.includes('/api/disarm')) {
            mockState.state = 0; // Ready
            return jsonResponse({ status: "ok" });
        }
        
        if (url.includes('/api/camera/list')) {
            return jsonResponse([
                { id: "cam1", name: "Front Door", status: "online" },
                { id: "cam2", name: "Backyard", status: "online" }
            ]);
        }

        // Default 404 for unhandled mocked routes
        console.warn(`[Mock API] Unhandled route: ${url}`);
        return jsonResponse({ status: "error", message: "Mock API route not found" }, 404);
    };
})();
