// K6 Script Generator - FIXED VERSION WITH CORRECTED SCRIPT GENERATION
// All variable interpolation errors fixed

let monacoEditor = null;
let apiCounter = 0;
let stageCounter = 0;
let scenarioCounter = 0;
let envVarCounter = 0;
let isMonacoReady = false;
let currentProfile = 'dev';

let config = {
    testName: '',
    baseUrl: '',
    vus: 10,
    duration: '30s',
    loadType: 'constant',
    executionMode: 'sequential',
    stages: [],
    scenarios: [],
    enableScenarios: false,
    envVars: {
        dev: [],
        staging: [],
        prod: []
    },
    thinkTime: {
        mode: 'fixed',
        fixed: 1,
        min: 1,
        max: 5
    },
    apis: [],
    thresholds: {
        enabled: true,
        p95: 500,
        p99: 1000,
        errorRate: 1
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing K6 Script Generator...');
    initMonacoEditor();
    initEventListeners();
    initCollapsibleSections();

    setTimeout(() => {
        loadExampleTemplate();
        generateScript();
    }, 800);

    console.log('✅ Initialization complete!');
});

function initMonacoEditor() {
    console.log('📝 Loading Monaco Editor...');

    if (typeof require === 'undefined') {
        console.error('❌ Monaco loader not found!');
        useFallbackEditor();
        return;
    }

    require.config({ 
        paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } 
    });

    require(['vs/editor/editor.main'], function() {
        try {
            const theme = document.body.getAttribute('data-theme') === 'dark' ? 'vs-dark' : 'vs';
            monacoEditor = monaco.editor.create(document.getElementById('codeEditor'), {
                value: '// Professional K6 Script Generator\n// Configure your test and click "Generate K6 Script"',
                language: 'javascript',
                theme: theme,
                automaticLayout: true,
                minimap: { enabled: true },
                fontSize: 13,
                lineNumbers: 'on',
                readOnly: false,
                wordWrap: 'on'
            });

            isMonacoReady = true;
            console.log('✅ Monaco Editor loaded!');
        } catch (error) {
            console.error('❌ Monaco failed:', error);
            useFallbackEditor();
        }
    }, function(error) {
        console.error('❌ Monaco loading failed:', error);
        useFallbackEditor();
    });
}

function useFallbackEditor() {
    console.log('⚠️ Using fallback textarea');
    const editorDiv = document.getElementById('codeEditor');
    editorDiv.innerHTML = '<textarea id="fallbackEditor" style="width:100%;height:100%;font-family:monospace;padding:10px;border:none;outline:none;resize:none;"></textarea>';
    monacoEditor = {
        getValue: () => document.getElementById('fallbackEditor').value,
        setValue: (v) => document.getElementById('fallbackEditor').value = v
    };
    isMonacoReady = true;
}

function initCollapsibleSections() {
    document.querySelectorAll('.section-content').forEach(content => {
        content.style.display = 'block';
    });
}

function toggleSection(sectionId) {
    const content = document.getElementById('section-' + sectionId);
    const header = content.previousElementSibling;
    const icon = header.querySelector('.toggle-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}

function initEventListeners() {
    console.log('🔗 Setting up event listeners...');

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    const loadType = document.getElementById('loadType');
    if (loadType) loadType.addEventListener('change', handleLoadTypeChange);

    const thinkTimeMode = document.getElementById('thinkTimeMode');
    if (thinkTimeMode) thinkTimeMode.addEventListener('change', handleThinkTimeModeChange);

    document.querySelectorAll('.profile-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.profile-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentProfile = this.dataset.profile;
            loadEnvVarsForProfile();
        });
    });

    const addApiBtn = document.getElementById('addApiBtn');
    if (addApiBtn) addApiBtn.addEventListener('click', () => { console.log('Adding API...'); addApiItem(); });

    // cURL import
    const importCurlBtn = document.getElementById('importCurlBtn');
    if (importCurlBtn) importCurlBtn.addEventListener('click', () => {
        const modal = document.getElementById('curlModal');
        if (modal) modal.classList.remove('hidden');
        const curlInput = document.getElementById('curlInput');
        if (curlInput) curlInput.value = '';
        const curlError = document.getElementById('curlError');
        if (curlError) { curlError.style.display = 'none'; curlError.textContent = ''; }
    });

    const curlCancelBtn = document.getElementById('curlCancelBtn');
    if (curlCancelBtn) curlCancelBtn.addEventListener('click', () => document.getElementById('curlModal').classList.add('hidden'));

    const curlParseBtn = document.getElementById('curlParseBtn');
    if (curlParseBtn) curlParseBtn.addEventListener('click', () => {
        const curlText = document.getElementById('curlInput').value || '';
        const curlError = document.getElementById('curlError');
        try {
            const api = parseCurlToApi(curlText);
            // Close modal
            document.getElementById('curlModal').classList.add('hidden');
            // Add prefilled API item
            addApiItem(api);
        } catch (err) {
            if (curlError) { curlError.style.display = 'block'; curlError.textContent = err.message || 'Failed to parse cURL'; }
        }
    });

    const addStageBtn = document.getElementById('addStageBtn');
    if (addStageBtn) addStageBtn.addEventListener('click', addStageItem);

    const addScenarioBtn = document.getElementById('addScenarioBtn');
    if (addScenarioBtn) addScenarioBtn.addEventListener('click', addScenarioItem);

    const addEnvVarBtn = document.getElementById('addEnvVarBtn');
    if (addEnvVarBtn) addEnvVarBtn.addEventListener('click', addEnvVarItem);

    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.addEventListener('click', () => {
        // Form validation before generating script
        const apiItems = document.querySelectorAll('.api-item');
        const vusInput = document.getElementById('vus');
        const durationInput = document.getElementById('duration');
        let errors = [];
        if (apiItems.length === 0) {
            errors.push('At least one API request must be added.');
        }
        if (!vusInput.value || isNaN(vusInput.value) || parseInt(vusInput.value) < 1) {
            errors.push('Virtual Users (VUs) must be defined and greater than 0.');
        }
        if (!durationInput.value || durationInput.value.trim() === '') {
            errors.push('Test Duration must be defined.');
        }
        // Remove previous error
        let prevError = document.getElementById('formValidationError');
        if (prevError) prevError.remove();
        if (errors.length > 0) {
            // Show error above the Generate button
            const errorDiv = document.createElement('div');
            errorDiv.id = 'formValidationError';
            errorDiv.style.cssText = 'color: var(--danger-color); background: var(--bg-tertiary); padding: 0.8rem; border-radius: 6px; margin-bottom: 1rem; text-align: center;';
            errorDiv.innerHTML = '⚠️ ' + errors.join('<br>');
            generateBtn.parentElement.insertBefore(errorDiv, generateBtn);
            return;
        }
        console.log('Generating...');
        generateScript();
    });

    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);

    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadScript);

    const loadTemplateBtn = document.getElementById('loadTemplateBtn');
    if (loadTemplateBtn) loadTemplateBtn.addEventListener('click', () => { console.log('Loading template...'); loadExampleTemplate(); });

    const exportBtn = document.getElementById('exportConfigBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportConfig);

    const importBtn = document.getElementById('importConfigBtn');
    if (importBtn) importBtn.addEventListener('click', () => document.getElementById('configFileInput').click());

    const fileInput = document.getElementById('configFileInput');
    if (fileInput) fileInput.addEventListener('change', importConfig);

    const enableScenariosCheckbox = document.getElementById('enableScenarios');
    if (enableScenariosCheckbox) {
        enableScenariosCheckbox.addEventListener('change', function() {
            const scenariosConfig = document.getElementById('scenariosConfig');
            if (scenariosConfig) scenariosConfig.style.display = this.checked ? 'block' : 'none';
        });
    }

    const enableThresholdsCheckbox = document.getElementById('enableThresholds');
    if (enableThresholdsCheckbox) {
        enableThresholdsCheckbox.addEventListener('change', function() {
            const thresholdConfig = document.getElementById('thresholdConfig');
            if (thresholdConfig) thresholdConfig.style.display = this.checked ? 'block' : 'none';
        });
    }

    console.log('✅ Event listeners attached!');
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    if (monacoEditor && typeof monaco !== 'undefined') {
        monaco.editor.setTheme(newTheme === 'dark' ? 'vs-dark' : 'vs');
    }
}

function handleLoadTypeChange() {
    const loadType = document.getElementById('loadType').value;
    const simpleRampingConfig = document.getElementById('simpleRampingConfig');
    const manualStagesConfig = document.getElementById('manualStagesConfig');

    simpleRampingConfig.classList.add('hidden');
    manualStagesConfig.classList.add('hidden');

    if (loadType === 'ramping-up' || loadType === 'ramping-down' || loadType === 'spike') {
        simpleRampingConfig.classList.remove('hidden');
    } else if (loadType === 'stages') {
        manualStagesConfig.classList.remove('hidden');
        if (document.getElementById('stagesList').children.length === 0) {
            addStageItem();
        }
    }
}

function handleThinkTimeModeChange() {
    const mode = document.getElementById('thinkTimeMode').value;
    const fixedConfig = document.getElementById('fixedThinkTimeConfig');
    const randomConfig = document.getElementById('randomThinkTimeConfig');

    fixedConfig.classList.add('hidden');
    randomConfig.classList.add('hidden');

    if (mode === 'fixed') {
        fixedConfig.classList.remove('hidden');
        // hide per-api inputs
        document.querySelectorAll('.api-thinktime-section').forEach(el => el.style.display = 'none');
    } else if (mode === 'random') {
        randomConfig.classList.remove('hidden');
        document.querySelectorAll('.api-thinktime-section').forEach(el => el.style.display = 'none');
    } else if (mode === 'per-api') {
        // show per-api inputs
        document.querySelectorAll('.api-thinktime-section').forEach(el => el.style.display = 'block');
    }
}

function addEnvVarItem() {
    envVarCounter++;
    const envVarsList = document.getElementById('envVarsList');

    const envVarItem = document.createElement('div');
    envVarItem.className = 'env-var-item';
    envVarItem.dataset.id = envVarCounter;

    envVarItem.innerHTML = `
        <div class="env-var-row">
            <input type="text" class="env-var-key" placeholder="Variable Name (e.g., API_KEY)" style="flex: 1;">
            <input type="text" class="env-var-value" placeholder="Value for ${currentProfile}" style="flex: 2;">
            <button type="button" class="btn btn-danger btn-sm" onclick="removeEnvVarItem(${envVarCounter})">×</button>
        </div>
    `;

    envVarsList.appendChild(envVarItem);
    console.log('✅ Added env var #' + envVarCounter);
}

function removeEnvVarItem(id) {
    const item = document.querySelector('.env-var-item[data-id="' + id + '"]');
    if (item) item.remove();
}

function loadEnvVarsForProfile() {
    const envVarsList = document.getElementById('envVarsList');
    envVarsList.innerHTML = '';
    envVarCounter = 0;

    if (config.envVars[currentProfile] && config.envVars[currentProfile].length > 0) {
        config.envVars[currentProfile].forEach(envVar => {
            addEnvVarItem();
            const item = document.querySelector('.env-var-item[data-id="' + envVarCounter + '"]');
            if (item) {
                item.querySelector('.env-var-key').value = envVar.key;
                item.querySelector('.env-var-value').value = envVar.value;
            }
        });
    }
}

function addStageItem() {
    stageCounter++;
    const stagesList = document.getElementById('stagesList');

    const stageItem = document.createElement('div');
    stageItem.className = 'stage-item';
    stageItem.dataset.id = stageCounter;

    stageItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-weight: 600;">Stage #${stageCounter}</span>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeStageItem(${stageCounter})">Remove</button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <div>
                <label style="font-size: 0.85rem;">Duration</label>
                <input type="text" class="stage-duration" placeholder="e.g., 30s, 2m" value="30s">
            </div>
            <div>
                <label style="font-size: 0.85rem;">Target VUs</label>
                <input type="number" class="stage-target" min="0" value="10">
            </div>
        </div>
    `;

    stagesList.appendChild(stageItem);
    console.log('✅ Added stage #' + stageCounter);
}

function removeStageItem(id) {
    const item = document.querySelector('.stage-item[data-id="' + id + '"]');
    if (item) item.remove();
}

function addScenarioItem() {
    scenarioCounter++;
    const scenariosList = document.getElementById('scenariosList');

    const scenarioItem = document.createElement('div');
    scenarioItem.className = 'scenario-item';
    scenarioItem.dataset.id = scenarioCounter;

    scenarioItem.innerHTML = `
        <div class="scenario-header">
            <span style="font-weight: 600;">Scenario #${scenarioCounter}</span>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeScenarioItem(${scenarioCounter})">Remove</button>
        </div>
        <div class="form-group">
            <label>Scenario Name</label>
            <input type="text" class="scenario-name" placeholder="e.g., Login Flow" value="Scenario ${scenarioCounter}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Executor Type</label>
                <select class="scenario-executor">
                    <option value="ramping-vus">Ramping VUs</option>
                    <option value="constant-vus">Constant VUs</option>
                    <option value="per-vu-iterations">Per-VU Iterations</option>
                    <option value="shared-iterations">Shared Iterations</option>
                </select>
            </div>
            <div class="form-group">
                <label>Start Time</label>
                <input type="text" class="scenario-start" placeholder="0s" value="0s">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>VUs / Iterations</label>
                <input type="number" class="scenario-vus" min="1" value="10">
            </div>
            <div class="form-group">
                <label>Duration</label>
                <input type="text" class="scenario-duration" placeholder="30s" value="30s">
            </div>
        </div>
        <div class="form-group">
            <label>APIs to Execute (comma-separated, e.g., 1,2,3 or leave empty for all)</label>
            <input type="text" class="scenario-apis" placeholder="Leave empty for all APIs">
        </div>
    `;

    scenariosList.appendChild(scenarioItem);
    console.log('✅ Added scenario #' + scenarioCounter);
}

function removeScenarioItem(id) {
    const item = document.querySelector('.scenario-item[data-id="' + id + '"]');
    if (item) item.remove();
}

function addApiItem(initialData = null) {
    apiCounter++;
    console.log('Creating API item #' + apiCounter);
    const apiList = document.getElementById('apiList');

    if (!apiList) {
        console.error('API list not found!');
        return;
    }

    const apiItem = document.createElement('div');
    apiItem.className = 'api-item';
    apiItem.dataset.id = apiCounter;

    apiItem.innerHTML = `
        <div class="api-item-header">
            <span class="api-item-title">API Request #${apiCounter}</span>
            <button type="button" class="btn btn-danger" onclick="removeApiItem(${apiCounter})">Remove</button>
        </div>

        <div class="form-group">
            <label>API Name / Label</label>
            <input type="text" class="api-name" placeholder="e.g., Get User Profile" value="API ${apiCounter}">
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Request Method</label>
                <select class="api-method">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                </select>
            </div>
            <div class="form-group">
                <label>Endpoint URL</label>
                <input type="text" class="api-url" placeholder="/users or https://..." value="/endpoint${apiCounter}">
            </div>
        </div>

        <div class="form-group">
            <label>Request Body (JSON)</label>
            <textarea class="api-body" placeholder='{"key": "value"} or use variables: {"token": "\${authToken}"}'></textarea>
        </div>

        <div class="api-thinktime-section" style="margin-top:0.8rem; display: none;">
            <label>Per-API Think Time (seconds)</label>
            <input type="number" class="api-thinktime" min="0" step="0.1" value="0" placeholder="e.g., 1.5">
            <small style="display:block;margin-top:0.3rem;color:var(--text-secondary);">Used when Think Time Mode = Per-API</small>
        </div>

        <div class="chaining-section">
            <h4 style="margin: 0.5rem 0; font-size: 0.9rem;">🔗 Request Chaining & Data Extraction</h4>
            <div class="form-group">
                <label>
                    <input type="checkbox" class="enable-extraction">
                    Extract data from response to use in subsequent requests
                </label>
            </div>
            <div class="extraction-config" style="display: none;">
                <div class="form-group">
                    <label>JSON Path (e.g., $.token or $.data.userId)</label>
                    <input type="text" class="extract-path" placeholder="$.token">
                </div>
                <div class="form-group">
                    <label>Save As Variable Name</label>
                    <input type="text" class="extract-varname" placeholder="authToken">
                </div>
                <small style="color: var(--text-secondary); font-size: 0.85rem; display: block;">
                    Use this variable in later APIs as: \${authToken} in headers, URL, or body
                </small>
            </div>
        </div>

        <div class="auth-section">
            <h4>Headers & Authentication</h4>
            <div class="form-group">
                <label>Authentication Type</label>
                <select class="auth-type" onchange="handleAuthTypeChange(${apiCounter}, this.value)">
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="custom">Custom Headers</option>
                </select>
            </div>
            <div class="auth-config"></div>
            <div class="headers-list"></div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addHeader(${apiCounter})">+ Add Header</button>
        </div>

        <div class="checks-section">
            <h4>Checks & Assertions</h4>
            <div class="checks-list"></div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addCheck(${apiCounter})">+ Add Check</button>
        </div>
    `;

    apiList.appendChild(apiItem);

    const extractCheckbox = apiItem.querySelector('.enable-extraction');
    const extractConfig = apiItem.querySelector('.extraction-config');
    extractCheckbox.addEventListener('change', function() {
        extractConfig.style.display = this.checked ? 'block' : 'none';
    });

    addCheck(apiCounter);

    // If initialData provided, prefill fields
    if (initialData) {
        try {
            if (initialData.name) apiItem.querySelector('.api-name').value = initialData.name;
            if (initialData.method) apiItem.querySelector('.api-method').value = initialData.method;
            if (initialData.url) apiItem.querySelector('.api-url').value = initialData.url;
            if (initialData.body) apiItem.querySelector('.api-body').value = initialData.body;
            if (initialData.headers && initialData.headers.length) {
                // clear default headers if any
                const headersList = apiItem.querySelector('.headers-list');
                headersList.innerHTML = '';
                initialData.headers.forEach(h => {
                    const headerItem = document.createElement('div');
                    headerItem.className = 'header-row';
                    headerItem.innerHTML = `
                        <div class="header-inputs">
                            <input type="text" placeholder="Header Key" class="header-key" value="${h.key}">
                            <input type="text" placeholder="Header Value (can use \${VAR})" class="header-value" value="${h.value}">
                        </div>
                        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
                    `;
                    headersList.appendChild(headerItem);
                });
            }
                // Handle basic auth mapping from curl --user
                if (initialData.auth && initialData.auth.type === 'basic') {
                    try {
                        const authSelect = apiItem.querySelector('.auth-type');
                        if (authSelect) {
                            authSelect.value = 'basic';
                            handleAuthTypeChange(apiCounter, 'basic');
                            setTimeout(() => {
                                const usernameInput = apiItem.querySelector('.basic-username');
                                const passwordInput = apiItem.querySelector('.basic-password');
                                if (usernameInput) usernameInput.value = initialData.auth.username || '';
                                if (passwordInput) passwordInput.value = initialData.auth.password || '';
                            }, 50);
                        }
                    } catch (e) { /* ignore */ }
                }

                // Handle form entries (converted to body in parser) - prefill body and content-type if present
                if (initialData.form) {
                    try {
                        if (initialData.body) {
                            apiItem.querySelector('.api-body').value = initialData.body;
                        }
                        // ensure Content-Type header is present if parser added it
                        const hasContentType = initialData.headers && initialData.headers.some(h => h.key && h.key.toLowerCase() === 'content-type');
                        if (!hasContentType && initialData.form.hasFile) {
                            addHeader(apiCounter);
                            setTimeout(() => {
                                const headerRow = apiItem.querySelector('.header-row');
                                if (headerRow) {
                                    headerRow.querySelector('.header-key').value = 'Content-Type';
                                    headerRow.querySelector('.header-value').value = 'multipart/form-data';
                                }
                            }, 50);
                        }
                    } catch (e) { /* ignore */ }
                }
        } catch (e) {
            console.warn('Failed to prefill API item', e);
        }
    }

    console.log('✅ API item #' + apiCounter + ' added successfully');
}

// Parse a cURL command string into an API object compatible with addApiItem
function parseCurlToApi(curlText) {
    if (!curlText || curlText.trim() === '') throw new Error('Empty cURL input');
    // Normalize line continuations and remove leading/trailing spaces
    let s = curlText.replace(/\\\n/g, ' ').trim();
    // Basic check
    if (!s.startsWith('curl')) throw new Error('Not a cURL command');

    // Extract method
    let method = 'GET';
    const methodMatch = s.match(/--request\s+(GET|POST|PUT|DELETE|PATCH)/i);
    if (methodMatch) method = methodMatch[1].toUpperCase();

    // Extract URL (single or double quoted)
    let url = '';
    const urlMatch = s.match(/(?:'|")([^'"]+)(?:'|")/);
    if (urlMatch) {
        // first quoted string after curl and --request may be the URL
        // try to find the token that looks like http
        const allQuoted = Array.from(s.matchAll(/(?:'|")([^'"]+)(?:'|")/g)).map(m => m[1]);
        const httpUrl = allQuoted.find(u => u.startsWith('http'));
        if (httpUrl) url = httpUrl;
        else url = allQuoted[0] || '';
    } else {
        // fallback: find token after --request or curl
        const parts = s.split(/\s+/);
        const httpPart = parts.find(p => p.startsWith('http'));
        if (httpPart) url = httpPart.replace(/['"]/g, '');
    }

    // Extract headers (support single or double quoted header values, and multi-line)
    const headers = [];
    const headerRegex = /--header\s+(['"])([\s\S]*?):\s*([\s\S]*?)\1/g;
    let hm;
    while ((hm = headerRegex.exec(curlText)) !== null) {
        headers.push({ key: hm[2].trim(), value: hm[3].trim() });
    }

    // Extract --user (basic auth)
    let auth = null;
    const userRegex = /(?:--user|-u)\s+(['"])?([\s\S]*?):([\s\S]*?)\1?(?:\s|$)/;
    const userMatch = curlText.match(userRegex);
    if (userMatch) {
        auth = { type: 'basic', username: userMatch[2], password: userMatch[3] };
    }

    // Extract data/body (support multi-line JSON inside single/double quotes)
    let body = '';
    const dataRegex = /--data-raw\s+(['"])([\s\S]*?)\1/i;
    const dataMatch = curlText.match(dataRegex);
    if (dataMatch) {
        body = dataMatch[2];
    } else {
        const dataRegex2 = /--data\s+(['"])([\s\S]*?)\1/i;
        const dataMatch2 = curlText.match(dataRegex2);
        if (dataMatch2) body = dataMatch2[2];
    }

    // Trim potential leading/trailing whitespace
    if (typeof body === 'string') body = body.trim();

    // Extract --form entries (multipart/form-data or form-urlencoded)
    const formEntries = [];
    const formRegex = /--form\s+(['"])([\s\S]*?)\1/g;
    let fm;
    let hasForm = false;
    let hasFile = false;
    while ((fm = formRegex.exec(curlText)) !== null) {
        hasForm = true;
        const entry = fm[2];
        // entry like name=value or name=@filename or name="value"
        const eqIdx = entry.indexOf('=');
        if (eqIdx > -1) {
            const key = entry.substring(0, eqIdx).trim();
            let val = entry.substring(eqIdx + 1).trim();
            if (val.startsWith('@')) {
                hasFile = true;
                // store filename placeholder
                val = val.substring(1);
            }
            // remove surrounding quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
            }
            formEntries.push({ key, value: val, isFile: hasFile });
        }
    }

    // If form entries exist and no explicit --data/body, convert to body accordingly
    if (hasForm && (!body || body === '')) {
        if (!hasFile) {
            // form-urlencoded
            const urlEncoded = formEntries.map(e => encodeURIComponent(e.key) + '=' + encodeURIComponent(e.value)).join('&');
            body = urlEncoded;
            // set header if not present
            if (!headers.some(h => h.key.toLowerCase() === 'content-type')) {
                headers.push({ key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
            }
        } else {
            // multipart with file(s) - create a placeholder representation
            const parts = formEntries.map(e => e.isFile ? `${e.key}=@${e.value}` : `${e.key}=${e.value}`);
            body = parts.join('&');
            if (!headers.some(h => h.key.toLowerCase() === 'content-type')) {
                headers.push({ key: 'Content-Type', value: 'multipart/form-data' });
            }
        }
    }

    const result = {
        name: `Imported from cURL`,
        method,
        url,
        headers,
        body: body || ''
    };
    if (auth) result.auth = auth;
    if (hasForm) result.form = { entries: formEntries, hasFile };
    return result;
}

function removeApiItem(id) {
    const item = document.querySelector('.api-item[data-id="' + id + '"]');
    if (item) {
        item.remove();
        console.log('Removed API #' + id);
    }
}

function handleAuthTypeChange(apiId, authType) {
    const apiItem = document.querySelector('.api-item[data-id="' + apiId + '"]');
    if (!apiItem) return;

    const authConfig = apiItem.querySelector('.auth-config');
    authConfig.innerHTML = '';

    if (authType === 'bearer') {
        authConfig.innerHTML = `
            <div class="form-group">
                <label>Bearer Token (can use variables like \${API_TOKEN})</label>
                <input type="text" class="bearer-token" placeholder="\${API_TOKEN} or your-token-here">
            </div>
        `;
    } else if (authType === 'basic') {
        authConfig.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" class="basic-username" placeholder="username">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" class="basic-password" placeholder="password">
                </div>
            </div>
        `;
    }
}

function addHeader(apiId) {
    const apiItem = document.querySelector('.api-item[data-id="' + apiId + '"]');
    if (!apiItem) return;

    const headersList = apiItem.querySelector('.headers-list');
    const headerItem = document.createElement('div');
    headerItem.className = 'header-row';
    headerItem.innerHTML = `
        <div class="header-inputs">
            <input type="text" placeholder="Header Key" class="header-key">
            <input type="text" placeholder="Header Value (can use \${VAR})" class="header-value">
        </div>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
    `;
    headersList.appendChild(headerItem);
}

function addCheck(apiId) {
    const apiItem = document.querySelector('.api-item[data-id="' + apiId + '"]');
    if (!apiItem) return;

    const checksList = apiItem.querySelector('.checks-list');
    const checkItem = document.createElement('div');
    checkItem.className = 'check-item';
    const isFirst = checksList.children.length === 0;

    checkItem.innerHTML = `
        <input type="text" placeholder="Check name" class="check-name" value="${isFirst ? 'status is 200' : ''}">
        <input type="text" placeholder="Condition" class="check-condition" value="${isFirst ? 'r.status === 200' : ''}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
    `;
    checksList.appendChild(checkItem);
}

function generateScript() {
    if (!isMonacoReady) {
        console.warn('Monaco not ready, waiting...');
        setTimeout(generateScript, 500);
        return;
    }

    console.log('⚙️ Building K6 script...');

    config.testName = document.getElementById('testName')?.value || 'Performance Test';
    config.baseUrl = document.getElementById('baseUrl')?.value?.trim() || '';
    config.vus = parseInt(document.getElementById('vus')?.value) || 10;
    config.duration = document.getElementById('duration')?.value || '30s';
    config.loadType = document.getElementById('loadType')?.value || 'constant';
    config.executionMode = document.getElementById('executionMode')?.value || 'sequential';
    config.enableScenarios = document.getElementById('enableScenarios')?.checked || false;

    config.thinkTime.mode = document.getElementById('thinkTimeMode')?.value || 'fixed';
    config.thinkTime.fixed = parseFloat(document.getElementById('fixedThinkTime')?.value) || 1;
    config.thinkTime.min = parseFloat(document.getElementById('minThinkTime')?.value) || 1;
    config.thinkTime.max = parseFloat(document.getElementById('maxThinkTime')?.value) || 5;

    config.thresholds.enabled = document.getElementById('enableThresholds')?.checked || false;
    config.thresholds.p95 = parseInt(document.getElementById('p95Threshold')?.value) || 500;
    config.thresholds.p99 = parseInt(document.getElementById('p99Threshold')?.value) || 1000;
    config.thresholds.errorRate = parseFloat(document.getElementById('errorRate')?.value) || 1;

    config.envVars[currentProfile] = [];
    document.querySelectorAll('.env-var-item').forEach(item => {
        const key = item.querySelector('.env-var-key')?.value;
        const value = item.querySelector('.env-var-value')?.value;
        if (key && value) {
            config.envVars[currentProfile].push({ key, value });
        }
    });

    config.stages = [];
    if (config.loadType === 'stages') {
        document.querySelectorAll('.stage-item').forEach(item => {
            const duration = item.querySelector('.stage-duration')?.value || '30s';
            const target = parseInt(item.querySelector('.stage-target')?.value) || 10;
            config.stages.push({ duration, target });
        });
    }

    config.scenarios = [];
    if (config.enableScenarios) {
        document.querySelectorAll('.scenario-item').forEach(item => {
            const scenario = {
                name: item.querySelector('.scenario-name')?.value || 'Scenario',
                executor: item.querySelector('.scenario-executor')?.value || 'ramping-vus',
                startTime: item.querySelector('.scenario-start')?.value || '0s',
                vus: parseInt(item.querySelector('.scenario-vus')?.value) || 10,
                duration: item.querySelector('.scenario-duration')?.value || '30s',
                apis: item.querySelector('.scenario-apis')?.value || ''
            };
            config.scenarios.push(scenario);
        });
    }

    config.apis = [];
    document.querySelectorAll('.api-item').forEach(item => {
        const api = {
            name: item.querySelector('.api-name')?.value || '',
            method: item.querySelector('.api-method')?.value || 'GET',
            url: item.querySelector('.api-url')?.value || '',
            body: item.querySelector('.api-body')?.value || '',
            thinkTime: parseFloat(item.querySelector('.api-thinktime')?.value) || 0,
            authType: item.querySelector('.auth-type')?.value || 'none',
            headers: [],
            checks: [],
            extraction: {
                enabled: item.querySelector('.enable-extraction')?.checked || false,
                path: item.querySelector('.extract-path')?.value || '',
                varName: item.querySelector('.extract-varname')?.value || ''
            }
        };

        if (api.authType === 'bearer') {
            api.bearerToken = item.querySelector('.bearer-token')?.value || '';
        } else if (api.authType === 'basic') {
            api.basicAuth = {
                username: item.querySelector('.basic-username')?.value || '',
                password: item.querySelector('.basic-password')?.value || ''
            };
        }

        item.querySelectorAll('.header-row').forEach(row => {
            const key = row.querySelector('.header-key')?.value;
            const value = row.querySelector('.header-value')?.value;
            if (key && value) api.headers.push({ key, value });
        });

        item.querySelectorAll('.check-item').forEach(check => {
            const name = check.querySelector('.check-name')?.value;
            const condition = check.querySelector('.check-condition')?.value;
            if (name && condition) api.checks.push({ name, condition });
        });

        config.apis.push(api);
    });

    const script = buildK6Script(config);

    if (monacoEditor) {
        monacoEditor.setValue(script);
        console.log('✅ Script generated successfully!');
    }
}

function buildK6Script(cfg) {
    let script = `/*\n * ${cfg.testName}\n * Generated by K6 Script Generator (Advanced)\n * Date: ${new Date().toLocaleString()}\n */\n\n`;

    // Add warning if API list is empty
    if (!cfg.apis || cfg.apis.length === 0) {
        script += `/**\n * ⚠️ WARNING: No API requests configured!\n * Please add at least one API request in the UI to generate a valid K6 script.\n */\n\n`;
    }

    script += `import http from 'k6/http';\n`;
    script += `import { check, group, sleep } from 'k6';\n\n`;

    // Environment variables - FIXED: Check if BASE_URL is in env vars to avoid duplication
    const hasBaseUrlInEnv = cfg.envVars[currentProfile]?.some(v => v.key === 'BASE_URL');

    if (cfg.envVars[currentProfile] && cfg.envVars[currentProfile].length > 0) {
        script += `// Environment Variables (Profile: ${currentProfile})\n`;
        script += `// Run with: k6 run script.js`;
        cfg.envVars[currentProfile].forEach(v => {
            script += ` -e ${v.key}="${v.value}"`;
        });
        script += `\n`;
        cfg.envVars[currentProfile].forEach(v => {
            script += `const ${v.key} = __ENV.${v.key} || '${v.value}';\n`;
        });
        script += `\n`;
    }

    // BASE_URL - FIXED: Only add if not in env vars and baseUrl is set
    if (cfg.baseUrl && !hasBaseUrlInEnv) {
        // Don't add if baseUrl is a template literal with BASE_URL variable
        if (!cfg.baseUrl.includes('${BASE_URL}')) {
            script += `const BASE_URL = '${cfg.baseUrl}';\n\n`;
        } else {
            // Just add newline if using BASE_URL variable
            script += `\n`;
        }
    }

    // Request chaining storage
    let hasExtractions = cfg.apis.some(api => api.extraction && api.extraction.enabled);
    if (hasExtractions) {
        script += `// Variables for request chaining\n`;
        script += `let extractedVars = {};\n\n`;
    }

    script += `export const options = {\n`;

    if (cfg.enableScenarios && cfg.scenarios.length > 0) {
        script += `  scenarios: {\n`;
        cfg.scenarios.forEach((scenario, idx) => {
            script += `    '${scenario.name}': {\n`;
            script += `      executor: '${scenario.executor}',\n`;
            script += `      startTime: '${scenario.startTime}',\n`;

            if (scenario.executor === 'ramping-vus' || scenario.executor === 'constant-vus') {
                script += `      vus: ${scenario.vus},\n`;
                script += `      duration: '${scenario.duration}',\n`;
            } else if (scenario.executor === 'per-vu-iterations') {
                script += `      vus: ${scenario.vus},\n`;
                script += `      iterations: ${scenario.vus},\n`;
            } else if (scenario.executor === 'shared-iterations') {
                script += `      vus: ${scenario.vus},\n`;
                script += `      iterations: ${scenario.vus * 10},\n`;
            }

            script += `      exec: '${scenario.name.replace(/\s+/g, '_')}',\n`;
            script += `    }${idx < cfg.scenarios.length - 1 ? ',' : ''}\n`;
        });
        script += `  },\n`;
    } else {
        if (cfg.loadType === 'constant') {
            script += `  vus: ${cfg.vus},\n`;
            script += `  duration: '${cfg.duration}',\n`;
        } else if (cfg.loadType === 'stages' && cfg.stages.length > 0) {
            script += `  stages: [\n`;
            cfg.stages.forEach((stage, idx) => {
                script += `    { duration: '${stage.duration}', target: ${stage.target} }${idx < cfg.stages.length - 1 ? ',' : ''}\n`;
            });
            script += `  ],\n`;
        } else if (cfg.loadType === 'ramping-up') {
            const rampDuration = document.getElementById('rampDuration')?.value || '1m';
            const targetVUs = document.getElementById('targetVUs')?.value || '50';
            script += `  stages: [\n`;
            script += `    { duration: '${rampDuration}', target: ${targetVUs} },\n`;
            script += `    { duration: '${cfg.duration}', target: ${targetVUs} },\n`;
            script += `  ],\n`;
        } else if (cfg.loadType === 'ramping-down') {
            const rampDuration = document.getElementById('rampDuration')?.value || '1m';
            script += `  stages: [\n`;
            script += `    { duration: '${cfg.duration}', target: ${cfg.vus} },\n`;
            script += `    { duration: '${rampDuration}', target: 0 },\n`;
            script += `  ],\n`;
        } else if (cfg.loadType === 'spike') {
            const targetVUs = document.getElementById('targetVUs')?.value || '100';
            script += `  stages: [\n`;
            script += `    { duration: '10s', target: ${cfg.vus} },\n`;
            script += `    { duration: '30s', target: ${targetVUs} },\n`;
            script += `    { duration: '10s', target: ${cfg.vus} },\n`;
            script += `  ],\n`;
        }
    }

    if (cfg.thresholds.enabled) {
        script += `  thresholds: {\n`;
        script += `    http_req_duration: ['p(95)<${cfg.thresholds.p95}', 'p(99)<${cfg.thresholds.p99}'],\n`;
        script += `    http_req_failed: ['rate<${cfg.thresholds.errorRate / 100}'],\n`;
        script += `  },\n`;
    }

    script += `};\n\n`;

    if (cfg.enableScenarios && cfg.scenarios.length > 0) {
        cfg.scenarios.forEach(scenario => {
            const funcName = scenario.name.replace(/\s+/g, '_');
            script += `export function ${funcName}() {\n`;

            const apiIndices = scenario.apis ? scenario.apis.split(',').map(i => parseInt(i.trim()) - 1) : cfg.apis.map((_, i) => i);

            apiIndices.forEach(idx => {
                if (cfg.apis[idx]) {
                    script += generateApiCall(cfg.apis[idx], idx, cfg.baseUrl, cfg.thinkTime, '  ');
                }
            });

            script += `}\n\n`;
        });
    } else if (cfg.executionMode === 'parallel') {
        cfg.apis.forEach((api, index) => {
            script += `function api${index}() {\n`;
            script += generateApiCall(api, index, cfg.baseUrl, cfg.thinkTime, '  ');
            script += `}\n\n`;
        });
    }

    if (!cfg.enableScenarios) {
        script += `export default function() {\n`;

        if (cfg.apis.length === 0) {
            script += `  // No APIs configured\n`;
        } else if (cfg.executionMode === 'sequential') {
            cfg.apis.forEach((api, index) => {
                script += generateApiCall(api, index, cfg.baseUrl, cfg.thinkTime, '  ');
            });
        } else if (cfg.executionMode === 'parallel') {
            script += `  // Parallel execution - all APIs called together\n`;
            cfg.apis.forEach((api, index) => {
                script += `  api${index}();\n`;
            });
        } else if (cfg.executionMode === 'random') {
            script += `  // Randomized execution - pick one API per iteration\n`;
            script += `  const apiIndex = Math.floor(Math.random() * ${cfg.apis.length});\n`;
            script += `  switch(apiIndex) {\n`;
            cfg.apis.forEach((api, index) => {
                script += `    case ${index}:\n`;
                script += generateApiCall(api, index, cfg.baseUrl, cfg.thinkTime, '      ');
                script += `      break;\n`;
            });
            script += `  }\n`;
        }

        if (cfg.thinkTime.mode === 'fixed') {
            script += `  \n  sleep(${cfg.thinkTime.fixed});\n`;
        } else if (cfg.thinkTime.mode === 'random') {
            script += `  \n  sleep(${cfg.thinkTime.min} + Math.random() * ${cfg.thinkTime.max - cfg.thinkTime.min});\n`;
        }

        script += `}\n`;
    }

    return script;
}

function generateApiCall(api, index, baseUrl, thinkTime, indent = '  ') {
    let code = '';

    code += `${indent}group('${api.name}', function() {\n`;

    // Build headers - FIXED: Proper variable handling
    const headers = {};

    if (api.authType === 'bearer' && api.bearerToken) {
        // Parse variable from ${varName} format
        const match = api.bearerToken.match(/\$\{([^}]+)\}/);
        if (match) {
            const varName = match[1];
            // Check if lowercase (extracted var) or uppercase (env var)
            if (varName.charAt(0) === varName.charAt(0).toLowerCase()) {
                headers['Authorization'] = `Bearer \${extractedVars.${varName}}`;
            } else {
                headers['Authorization'] = `Bearer \${${varName}}`;
            }
        } else {
            headers['Authorization'] = `Bearer ${api.bearerToken}`;
        }
    }

    // Add custom headers with variable handling
    api.headers.forEach(header => {
        const match = header.value.match(/\$\{([^}]+)\}/);
        if (match) {
            const varName = match[1];
            if (varName.charAt(0) === varName.charAt(0).toLowerCase()) {
                headers[header.key] = `\${extractedVars.${varName}}`;
            } else {
                headers[header.key] = `\${${varName}}`;
            }
        } else {
            headers[header.key] = header.value;
        }
    });

    if (['POST', 'PUT', 'PATCH'].includes(api.method)) {
        headers['Content-Type'] = 'application/json';
    }

    // Generate headers object
    code += `${indent}  const params = { headers: {`;
    const headerEntries = Object.entries(headers);
    if (headerEntries.length > 0) {
        code += `\n`;
        headerEntries.forEach(([key, value], idx) => {
            // escape single quotes in plain header values
            const escSingle = (v) => v.replace(/'/g, "\\'");
            const escBacktick = (v) => v.replace(/`/g, '\\`').replace(/\\/g, '\\\\');
            if (value.includes('\${')) {
                const safe = escBacktick(value);
                code += `${indent}    '${key}': \`${safe}\`${idx < headerEntries.length - 1 ? ',' : ''}\n`;
            } else {
                const safe = escSingle(value);
                code += `${indent}    '${key}': '${safe}'${idx < headerEntries.length - 1 ? ',' : ''}\n`;
            }
        });
        code += `${indent}  `;
    }
    code += `} };\n${indent}  \n`;

    // Build URL
    let fullUrl = api.url;
    if (baseUrl && !api.url.startsWith('http')) {
        if (baseUrl.includes('${BASE_URL}') || baseUrl === '${BASE_URL}') {
            fullUrl = '\${BASE_URL}' + (api.url.startsWith('/') ? '' : '/') + api.url;
        } else {
            fullUrl = '\${BASE_URL}' + (api.url.startsWith('/') ? '' : '/') + api.url;
        }
    }

    // Make request
    if (['GET', 'DELETE'].includes(api.method)) {
        code += `${indent}  const res = http.${api.method.toLowerCase()}(\`${fullUrl}\`, params);\n`;
    } else {
        const body = api.body || '';
        // Handle variables in body (lowercase -> extractedVars, uppercase -> env vars)
        let processedBody = body;
        try {
            processedBody = processedBody.replace(/\$\{([a-z][a-zA-Z0-9_]*)\}/g, '\${extractedVars.$1}');
            processedBody = processedBody.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, '\${$1}');
        } catch (e) {
            // ignore
        }
        // Escape backticks and backslashes so template literal in generated script is safe
        const safeBody = String(processedBody).replace(/\\/g, '\\\\').replace(/`/g, '\\`');
        code += `${indent}  const payload = \`${safeBody}\`;\n`;
        code += `${indent}  const res = http.${api.method.toLowerCase()}(\`${fullUrl}\`, payload, params);\n`;
    }

    code += `${indent}  \n`;

    // Extraction
    if (api.extraction && api.extraction.enabled && api.extraction.path && api.extraction.varName) {
        code += `${indent}  // Extract data for request chaining\n`;
        code += `${indent}  if (res.status === 200 || res.status === 201) {\n`;

        if (api.extraction.path.startsWith('$.')) {
            const jsonPath = api.extraction.path.substring(2);
            code += `${indent}    extractedVars.${api.extraction.varName} = res.json('${jsonPath}');\n`;
        } else {
            code += `${indent}    extractedVars.${api.extraction.varName} = res.json().${api.extraction.path};\n`;
        }

        code += `${indent}    console.log('Extracted ${api.extraction.varName}:', extractedVars.${api.extraction.varName});\n`;
        code += `${indent}  }\n${indent}  \n`;
    }

    // Checks
    if (api.checks && api.checks.length > 0) {
        code += `${indent}  check(res, {\n`;
        api.checks.forEach((checkItem, idx) => {
            code += `${indent}    '${checkItem.name}': (r) => ${checkItem.condition}${idx < api.checks.length - 1 ? ',' : ''}\n`;
        });
        code += `${indent}  });\n`;
    }

    // Per-API think time: if global mode is per-api, sleep for this api's configured think time
    if (thinkTime && thinkTime.mode === 'per-api') {
        const tt = api.thinkTime || 0;
        if (tt > 0) {
            code += `${indent}  sleep(${tt});\n`;
        }
    }

    code += `${indent}});\n${indent}\n`;

    return code;
}

function copyToClipboard() {
    if (!monacoEditor) return;
    const code = monacoEditor.getValue();
    navigator.clipboard.writeText(code).then(() => {
        alert('✅ Script copied to clipboard!');
    }).catch(() => {
        alert('❌ Copy failed. Please select and copy manually.');
    });
}

function downloadScript() {
    if (!monacoEditor) return;
    const code = monacoEditor.getValue();
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'k6-test-script.js';
    a.click();
    URL.revokeObjectURL(url);
}

function exportConfig() {
    generateScript();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'k6-config.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            config = JSON.parse(e.target.result);
            alert('✅ Configuration loaded!');
            generateScript();
        } catch (error) {
            alert('❌ Invalid config file!');
        }
    };
    reader.readAsText(file);
}

function loadExampleTemplate() {
    console.log('📋 Loading example template...');

    document.getElementById('apiList').innerHTML = '';
    apiCounter = 0;

    document.getElementById('testName').value = "DemoAPI Test";
    document.getElementById('baseUrl').value = "${BASE_URL}";
    document.getElementById('vus').value = "20";
    document.getElementById('duration').value = "2m";
    document.getElementById('loadType').value = "ramping-up";
    document.getElementById('executionMode').value = "sequential";

    document.getElementById('rampDuration').value = "1m";
    document.getElementById('targetVUs').value = "50";
    handleLoadTypeChange();

    document.getElementById('thinkTimeMode').value = "random";
    document.getElementById('minThinkTime').value = "1";
    document.getElementById('maxThinkTime').value = "3";
    handleThinkTimeModeChange();

    config.envVars = {
        dev: [
            { key: 'BASE_URL', value: 'https://dev.api.example.com' },
            { key: 'API_KEY', value: 'dev-api-key-123' }
        ],
        staging: [
            { key: 'BASE_URL', value: 'https://staging.api.example.com' },
            { key: 'API_KEY', value: 'staging-api-key-456' }
        ],
        prod: [
            { key: 'BASE_URL', value: 'https://api.example.com' },
            { key: 'API_KEY', value: 'prod-api-key-789' }
        ]
    };
    currentProfile = 'dev';
    loadEnvVarsForProfile();

    // API 1: Login
    addApiItem();
    setTimeout(() => {
        let api1 = document.querySelector('.api-item[data-id="1"]');
        if (api1) {
            api1.querySelector('.api-name').value = "Login - Get Auth Token";
            api1.querySelector('.api-method').value = "POST";
            api1.querySelector('.api-url').value = "/auth/login";
            api1.querySelector('.api-body').value = '{"username": "testuser", "password": "testpass"}';
            api1.querySelector('.enable-extraction').checked = true;
            api1.querySelector('.extraction-config').style.display = 'block';
            api1.querySelector('.extract-path').value = "$.token";
            api1.querySelector('.extract-varname').value = "authToken";
        }
    }, 100);

    // API 2: Get Profile
    addApiItem();
    setTimeout(() => {
        let api2 = document.querySelector('.api-item[data-id="2"]');
        if (api2) {
            api2.querySelector('.api-name').value = "Get User Profile";
            api2.querySelector('.api-method').value = "GET";
            api2.querySelector('.api-url').value = "/user/profile";
            api2.querySelector('.auth-type').value = "bearer";
            handleAuthTypeChange(2, 'bearer');
            setTimeout(() => {
                if (api2.querySelector('.bearer-token')) {
                    api2.querySelector('.bearer-token').value = "${authToken}";
                }
            }, 50);

            addHeader(2);
            setTimeout(() => {
                const headerRow = api2.querySelector('.header-row');
                if (headerRow) {
                    headerRow.querySelector('.header-key').value = "X-API-Key";
                    headerRow.querySelector('.header-value').value = "${API_KEY}";
                }
            }, 50);
        }
    }, 150);

    // API 3: Update Settings
    addApiItem();
    setTimeout(() => {
        let api3 = document.querySelector('.api-item[data-id="3"]');
        if (api3) {
            api3.querySelector('.api-name').value = "Update User Settings";
            api3.querySelector('.api-method').value = "PUT";
            api3.querySelector('.api-url').value = "/user/settings";
            api3.querySelector('.api-body').value = '{"theme": "dark", "notifications": true}';
            api3.querySelector('.auth-type').value = "bearer";
            handleAuthTypeChange(3, 'bearer');
            setTimeout(() => {
                if (api3.querySelector('.bearer-token')) {
                    api3.querySelector('.bearer-token').value = "${authToken}";
                }
            }, 50);
        }
    }, 200);

    console.log('✅ Example template loaded!');

    setTimeout(() => {
        generateScript();
    }, 500);
}

function initScenariosToggle() {
    const enableScenariosCheckbox = document.getElementById('enableScenarios');
    if (enableScenariosCheckbox) {
        enableScenariosCheckbox.addEventListener('change', function() {
            const scenariosConfig = document.getElementById('scenariosConfig');
            if (scenariosConfig) {
                if (this.checked) {
                    scenariosConfig.classList.remove('hidden');
                    scenariosConfig.style.animation = 'slideDown 0.3s ease-out';
                    updateScenarioSummary();
                } else {
                    scenariosConfig.classList.add('hidden');
                }
            }
        });
    }
}

setTimeout(initScenariosToggle, 100);

function updateScenarioSummary() {
    const scenariosEnabled = document.getElementById('enableScenarios')?.checked;
    const scenarioItems = document.querySelectorAll('.scenario-item');
    if (!scenariosEnabled || scenarioItems.length === 0) return;
    console.log(`📊 Active scenarios: ${scenarioItems.length}`);
}

function validateScenario(scenarioId) {
    const scenarioItem = document.querySelector('.scenario-item[data-id="' + scenarioId + '"]');
    if (!scenarioItem) return true;
    
    const name = scenarioItem.querySelector('.scenario-name')?.value;
    const duration = scenarioItem.querySelector('.scenario-duration')?.value;
    const vus = scenarioItem.querySelector('.scenario-vus')?.value;
    
    let isValid = true;
    let errors = [];
    
    if (!name || name.trim() === '') errors.push('Scenario name is required'), isValid = false;
    if (!duration || duration.trim() === '') errors.push('Duration is required'), isValid = false;
    if (!vus || parseInt(vus) < 1) errors.push('VUs must be at least 1'), isValid = false;
    
    const existingError = scenarioItem.querySelector('.validation-error');
    if (existingError) existingError.remove();
    
    if (!isValid) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.innerHTML = `<small style="color: var(--danger-color); display: block; margin-top: 0.5rem;">⚠️ ${errors.join(', ')}</small>`;
        scenarioItem.appendChild(errorDiv);
    }
    return isValid;
}

function getScenarioPreview(scenarioId) {
    const scenarioItem = document.querySelector('.scenario-item[data-id="' + scenarioId + '"]');
    if (!scenarioItem) return null;
    
    return {
        name: scenarioItem.querySelector('.scenario-name')?.value || 'Unnamed',
        executor: scenarioItem.querySelector('.scenario-executor')?.value || 'ramping-vus',
        startTime: scenarioItem.querySelector('.scenario-start')?.value || '0s',
        vus: scenarioItem.querySelector('.scenario-vus')?.value || '10',
        duration: scenarioItem.querySelector('.scenario-duration')?.value || '30s',
        apis: scenarioItem.querySelector('.scenario-apis')?.value || 'all'
    };
}

function showScenarioApiAssignment(scenarioId) {
    const preview = getScenarioPreview(scenarioId);
    if (!preview) return;
    
    const scenarioItem = document.querySelector('.scenario-item[data-id="' + scenarioId + '"]');
    if (!scenarioItem) return;
    
    const existingPreview = scenarioItem.querySelector('.scenario-preview');
    if (existingPreview) existingPreview.remove();
    
    let apiText = preview.apis === '' || preview.apis === 'all' 
        ? `All APIs (${document.querySelectorAll('.api-item').length} total)` 
        : `APIs: ${preview.apis}`;
    
    const previewDiv = document.createElement('div');
    previewDiv.className = 'scenario-preview';
    previewDiv.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 0.8rem; border-radius: 4px; margin-top: 0.8rem; border-left: 3px solid var(--primary-color); animation: fadeIn 0.3s ease-out;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                <strong style="color: var(--primary-color);">📊 Scenario Preview:</strong><br>
                <span style="display: inline-block; margin-top: 0.5rem;">
                    🎯 <strong>${preview.executor}</strong> | 
                    ⏱️ Start: ${preview.startTime} | 
                    👥 ${preview.vus} VUs | 
                    ⏰ Duration: ${preview.duration}
                </span><br>
                <span style="display: inline-block; margin-top: 0.3rem;">🔗 ${apiText}</span>
            </div>
        </div>
    `;
    scenarioItem.appendChild(previewDiv);
}

window.originalAddScenarioItem = addScenarioItem;
addScenarioItem = function() {
    window.originalAddScenarioItem();
    const currentId = scenarioCounter;
    
    setTimeout(() => {
        const scenarioItem = document.querySelector('.scenario-item[data-id="' + currentId + '"]');
        if (scenarioItem) {
            scenarioItem.style.animation = 'fadeIn 0.3s ease-out';
            const header = scenarioItem.querySelector('.scenario-header span');
            if (header) {
                header.innerHTML = `🎬 Scenario #${currentId}`;
                header.style.color = 'var(--primary-color)';
            }
            
            const apiInput = scenarioItem.querySelector('.scenario-apis');
            if (apiInput && !scenarioItem.querySelector('.preview-btn')) {
                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'btn btn-secondary btn-sm preview-btn';
                previewBtn.textContent = '📊 Preview Configuration';
                previewBtn.style.cssText = 'width: 100%; margin-top: 0.8rem; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; border: none;';
                previewBtn.onclick = () => showScenarioApiAssignment(currentId);
                apiInput.parentElement.appendChild(previewBtn);
            }
            
            scenarioItem.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('change', () => {
                    validateScenario(currentId);
                    showScenarioApiAssignment(currentId);
                });
            });
            
            showScenarioApiAssignment(currentId);
        }
    }, 150);
};

window.showScenarioApiAssignment = showScenarioApiAssignment;
window.validateScenario = validateScenario;
window.updateScenarioSummary = updateScenarioSummary;


window.removeApiItem = removeApiItem;
window.removeStageItem = removeStageItem;
window.removeScenarioItem = removeScenarioItem;
window.removeEnvVarItem = removeEnvVarItem;
window.handleAuthTypeChange = handleAuthTypeChange;
window.addHeader = addHeader;
window.addCheck = addCheck;
window.toggleSection = toggleSection;

console.log('📦 Script loaded - K6 Generator ready!');
