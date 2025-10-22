// AGU Branding Component
// Bu faylni barcha sahifalarga qo'shing

const AGU_BRANDING = {
    // Brand colors
    colors: {
        primary: '#1b5bb5',
        secondary: '#ed8f36',
        accent: '#E30613',
        dark: '#2d3748',
        blue: '#0B3373'
    },

    // Logo HTML
    getLogo: (size = 'large') => {
        const sizes = {
            small: 'text-xl',
            medium: 'text-2xl',
            large: 'text-5xl'
        };

        return `
            <div class="agu-logo ${sizes[size]} font-extrabold inline-block">
                <span style="color: ${AGU_BRANDING.colors.accent}">AG</span><span style="color: ${AGU_BRANDING.colors.blue}">U</span><sup style="font-size: 0.6em; color: ${AGU_BRANDING.colors.blue}">®</sup>
            </div>
        `;
    },

    // Full branding with subtitle
    getFullBranding: (size = 'large') => {
        return `
            <div class="text-center agu-logo-container">
                ${AGU_BRANDING.getLogo(size)}
                <div class="text-sm font-bold mt-1" style="color: ${AGU_BRANDING.colors.blue}; letter-spacing: 0.5px;">
                    Auto Gas Uzbekistan
                </div>
            </div>
        `;
    },

    // Navbar logo
    getNavbarLogo: () => {
        return `
            <div class="flex items-center space-x-2">
                <div class="text-2xl font-extrabold">
                    <span style="color: ${AGU_BRANDING.colors.accent}">AG</span><span style="color: ${AGU_BRANDING.colors.blue}">U</span><sup style="font-size: 0.6em; color: ${AGU_BRANDING.colors.blue}">®</sup>
                </div>
                <div class="text-sm font-semibold" style="color: ${AGU_BRANDING.colors.dark}">
                    Auto Gas Uzbekistan
                </div>
            </div>
        `;
    },

    // Common CSS styles
    getStyles: () => {
        return `
            <style>
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                @keyframes flicker {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }

                .agu-logo-container {
                    animation: fadeInUp 0.8s ease-out;
                }

                .agu-logo:hover {
                    animation: pulse 0.6s ease-in-out;
                    cursor: pointer;
                }

                .flame-effect {
                    position: relative;
                    display: inline-block;
                }

                .flame-effect::after {
                    content: '';
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    width: 8px;
                    height: 8px;
                    background: radial-gradient(circle, #E30613, transparent);
                    border-radius: 50%;
                    animation: flicker 2s infinite;
                }
            </style>
        `;
    },

    // Favicon SVG (data URL)
    getFaviconDataURL: () => {
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="70" font-weight="bold" font-family="Arial"><tspan fill="%23E30613">AG</tspan><tspan fill="%230B3373">U</tspan></text></svg>`;
    },

    // Initialize branding on page
    init: () => {
        // Add favicon
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/svg+xml';
        favicon.href = AGU_BRANDING.getFaviconDataURL();
        document.head.appendChild(favicon);

        // Add common styles
        document.head.insertAdjacentHTML('beforeend', AGU_BRANDING.getStyles());
    }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
    window.AGU_BRANDING = AGU_BRANDING;
    document.addEventListener('DOMContentLoaded', () => {
        AGU_BRANDING.init();
    });
}
