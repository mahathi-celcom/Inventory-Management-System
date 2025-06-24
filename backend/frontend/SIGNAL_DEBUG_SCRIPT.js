// 🔍 SIGNAL DEBUG SCRIPT
// Run this in browser console to find Signal .set() errors

console.log('🔍 Starting Signal Debug Analysis...');

// Function to search for .set() calls on computed signals
function findSignalSetErrors() {
    const results = {
        computedSignals: [],
        setCallLocations: [],
        potentialErrors: []
    };

    // Search through all script tags and source files
    const scripts = document.querySelectorAll('script');
    
    console.log('📁 Searching through loaded scripts...');
    
    // Common patterns that indicate Signal .set() errors
    const errorPatterns = [
        /\.assets\.set\(/g,
        /\.users\.set\(/g,
        /\.assetModelsWithDetails\.set\(/g,
        /computed\(\)\s*.*\.set\(/g,
        /signal\<.*\>\(\).*\.set\(/g
    ];

    // Check if we can access Angular component instances
    if (window.ng) {
        console.log('🅰️ Angular detected, checking component instances...');
        
        // Try to find Angular components
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            try {
                const component = window.ng.getComponent(el);
                if (component) {
                    // Check for computed signals
                    Object.keys(component).forEach(key => {
                        const value = component[key];
                        if (value && typeof value === 'function' && value.toString().includes('computed')) {
                            results.computedSignals.push({
                                component: component.constructor.name,
                                property: key,
                                element: el.tagName
                            });
                        }
                    });
                }
            } catch (e) {
                // Ignore errors
            }
        });
    }

    return results;
}

// Function to check TypeScript compilation errors
function checkTypeScriptErrors() {
    console.log('📝 Checking for TypeScript compilation patterns...');
    
    // Look for error indicators in the console
    const consoleErrors = [];
    
    // Override console.error to capture TypeScript errors
    const originalError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('Property \'set\' does not exist') || 
            message.includes('Signal<') ||
            message.includes('computed()')) {
            consoleErrors.push(message);
        }
        originalError.apply(console, args);
    };

    return consoleErrors;
}

// Function to analyze network requests for source maps
function analyzeSourceMaps() {
    console.log('🗺️ Analyzing source maps for Signal usage...');
    
    const sourceMapUrls = [];
    
    // Find source map URLs
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        if (script.src.includes('.js')) {
            sourceMapUrls.push(script.src + '.map');
        }
    });

    return sourceMapUrls;
}

// Function to provide debugging suggestions
function generateDebuggingSuggestions() {
    return [
        '🔧 DEBUGGING STEPS FOR SIGNAL ERRORS:',
        '',
        '1. CHECK COMPONENT DECLARATIONS:',
        '   • Look for: assets = computed(() => ...)',
        '   • Look for: users = computed(() => ...)',
        '   • Look for: assetModelsWithDetails = computed(() => ...)',
        '',
        '2. FIND .set() CALLS:',
        '   • Search codebase for: ".assets.set("',
        '   • Search codebase for: ".users.set("',
        '   • Search codebase for: ".assetModelsWithDetails.set("',
        '',
        '3. CHECK TEST FILES:',
        '   • Look in *.spec.ts files',
        '   • Test files often call .set() on signals incorrectly',
        '',
        '4. REPLACE WITH PROPER METHODS:',
        '   • For computed signals, update the underlying data',
        '   • Use service methods instead of direct .set() calls',
        '',
        '5. RUN THESE COMMANDS:',
        '   • ng build --no-cache',
        '   • ng test --no-watch',
        '   • Check console for TypeScript errors',
        '',
        '6. SEARCH PATTERNS TO USE:',
        '   grep -r "\.assets\.set(" src/',
        '   grep -r "\.users\.set(" src/',
        '   grep -r "\.assetModelsWithDetails\.set(" src/',
        '',
        '7. COMMON FIXES:',
        '   • Replace: component.assets.set(data)',
        '   • With: this.clientFilterService.updateAssets(data)',
        '   • Or: Update the underlying service data instead',
        ''
    ];
}

// Function to create a comprehensive debug report
function createSignalDebugReport() {
    console.log('📋 Creating comprehensive Signal debug report...');
    
    const report = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        angularDetected: !!window.ng,
        signals: findSignalSetErrors(),
        suggestions: generateDebuggingSuggestions()
    };

    console.log('📊 SIGNAL DEBUG REPORT:', report);
    
    // Format for easy reading
    const formattedReport = [
        '🔍 SIGNAL .SET() ERROR DEBUG REPORT',
        '===================================',
        '',
        `Timestamp: ${report.timestamp}`,
        `URL: ${report.url}`,
        `Angular Detected: ${report.angularDetected}`,
        '',
        '🎯 COMPUTED SIGNALS FOUND:',
        ...report.signals.computedSignals.map(s => 
            `  • ${s.component}.${s.property} (${s.element})`),
        '',
        ...report.suggestions
    ].join('\n');

    // Copy to clipboard if possible
    if (navigator.clipboard) {
        navigator.clipboard.writeText(formattedReport).then(() => {
            console.log('📋 Report copied to clipboard!');
        });
    }

    return formattedReport;
}

// Function to monitor for Signal errors in real-time
function monitorSignalErrors() {
    console.log('👀 Starting real-time Signal error monitoring...');
    
    const originalError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('Property \'set\' does not exist on type \'Signal<')) {
            console.log('🚨 SIGNAL ERROR DETECTED:', message);
            
            // Try to extract more information
            const match = message.match(/Property 'set' does not exist on type 'Signal<(.+?)>/);
            if (match) {
                console.log(`🎯 Signal Type: ${match[1]}`);
                console.log('💡 This is a computed signal - use the underlying service to update data');
            }
        }
        originalError.apply(console, args);
    };
}

// Main execution
function runSignalDebugger() {
    console.log('🚀 Running complete Signal debugger...');
    
    // Start monitoring
    monitorSignalErrors();
    
    // Generate report
    const report = createSignalDebugReport();
    
    // Additional debugging helpers
    window.signalDebugger = {
        findErrors: findSignalSetErrors,
        createReport: createSignalDebugReport,
        monitor: monitorSignalErrors,
        suggestions: generateDebuggingSuggestions
    };
    
    console.log('🔧 Signal debugger tools available at: window.signalDebugger');
    console.log('📋 Full report:', report);
}

// Auto-run the debugger
runSignalDebugger();

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runSignalDebugger,
        findSignalSetErrors,
        createSignalDebugReport,
        monitorSignalErrors
    };
} 