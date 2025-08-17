// --- ACE EDITOR SETUP ---
function setupEditor(id, mode) {
    const editor = ace.edit(id);
    editor.setTheme("ace/theme/tomorrow_night");
    editor.session.setMode(`ace/mode/${mode}`);
    editor.resize();
    editor.setHighlightActiveLine(true);
    editor.setShowPrintMargin(false);
    // Update the preview in real-time on code change
    editor.session.on('change', updatePreview);
    return editor;
}

const htmlEditor = setupEditor("html", "html");
const cssEditor = setupEditor("css", "css");
const jsEditor = setupEditor("js", "javascript");

// --- PANEL & TAB SWITCHING LOGIC ---
const allPanels = document.querySelectorAll(".editor-pane .panel-wrapper");
const allTabs = document.querySelectorAll(".file-tabs .tab");

function switchPanel(panelIndex) {
    allPanels.forEach(panel => panel.style.display = "none");
    allTabs.forEach(tab => tab.classList.remove("active"));

    allPanels[panelIndex].style.display = "block";
    allTabs[panelIndex].classList.add("active");

    // Resize the active editor to fit the panel
    [htmlEditor, cssEditor, jsEditor][panelIndex].resize();
}

// Set initial active panel
switchPanel(0);

// --- LIVE PREVIEW LOGIC ---
const previewFrame = document.getElementById('preview-iframe');
const livePreviewBtn = document.getElementById('live-preview-btn');

livePreviewBtn.addEventListener('click', () => {
    document.body.classList.toggle('preview-active');
    // Resize editors after toggling preview to ensure they fit
    htmlEditor.resize();
    cssEditor.resize();
    jsEditor.resize();
});


function getCombinedCode() {
    const htmlValue = htmlEditor.getValue();
    const cssValue = cssEditor.getValue();
    const jsValue = jsEditor.getValue();

    return `
        <html>
            <head>
                <style>${cssValue}</style>
            </head>
            <body>
                ${htmlValue}
                <script>${jsValue}<\/script>
            </body>
        </html>
    `;
}

function updatePreview() {
    const combinedCode = getCombinedCode();
    
    // Method 1: Update the iframe on the main page
    previewFrame.srcdoc = combinedCode;

    // Method 2: Save the code to localStorage for live.html to use
    localStorage.setItem('liveCodeEditorContent', combinedCode);
}

// Initial preview update on page load
updatePreview();

// --- MODERN DARK MODE TOGGLE ---
const themeToggleButton = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');

themeToggleButton.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDarkMode);

    const editorTheme = isDarkMode ? "ace/theme/tomorrow_night" : "ace/e/github";
    htmlEditor.setTheme(editorTheme);
    cssEditor.setTheme(editorTheme);
    jsEditor.setTheme(editorTheme);

    // Update icon
    if (isDarkMode) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
});


// --- FILE UPLOAD LOGIC ---
const uploadBtn = document.getElementById('upload-btn');
const htmlUpload = document.getElementById('html-upload');
const cssUpload = document.getElementById('css-upload');
const jsUpload = document.getElementById('js-upload');

uploadBtn.addEventListener('click', () => {
    const activeTabIndex = [...allTabs].findIndex(tab => tab.classList.contains('active'));
    if (activeTabIndex === 0) htmlUpload.click();
    if (activeTabIndex === 1) cssUpload.click();
    if (activeTabIndex === 2) jsUpload.click();
});

function handleFileUpload(event, editor) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            editor.setValue(e.target.result, 1); // -1 moves cursor to start, 1 to end
        };
        reader.readAsText(file);
    }
}

htmlUpload.addEventListener('change', (e) => handleFileUpload(e, htmlEditor));
cssUpload.addEventListener('change', (e) => handleFileUpload(e, cssEditor));
jsUpload.addEventListener('change', (e) => handleFileUpload(e, jsEditor));


// --- CODE FORMATTING ---
const formatCodeBtn = document.getElementById('format-code-btn');
formatCodeBtn.addEventListener('click', () => {
    // Note: This is a very basic formatter. For production, consider a library like Prettier.
    const activeTabIndex = [...allTabs].findIndex(tab => tab.classList.contains('active'));
    const editor = [htmlEditor, cssEditor, jsEditor][activeTabIndex];
    const code = editor.getValue();
    
    // Simple formatting: trim each line and add basic indentation
    const lines = code.split('\n');
    let indentLevel = 0;
    const indentSize = 2;
    const formattedLines = lines.map(line => {
        line = line.trim();
        if (line.match(/[\{\[\(]$/) || line.match(/<[a-zA-Z0-9]+[^>]*>$/) && !line.match(/<\/[a-zA-Z0-9]+>$/) && !line.match(/\/>$/)) {
            const indentedLine = ' '.repeat(indentLevel * indentSize) + line;
            indentLevel++;
            return indentedLine;
        } else if (line.match(/^[\}\]\)]/) || line.match(/^<\//)) {
            indentLevel = Math.max(0, indentLevel - 1);
            return ' '.repeat(indentLevel * indentSize) + line;
        } else {
            return ' '.repeat(indentLevel * indentSize) + line;
        }
    });
    editor.setValue(formattedLines.join('\n'), 1);
});


// --- RESIZABLE SPLITTER LOGIC ---
const resizer = document.getElementById('resizer');
const editorPane = document.querySelector('.editor-pane');
const previewPane = document.querySelector('.preview-pane');

resizer.addEventListener('mousedown', function(e) {
    e.preventDefault();
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', function() {
        window.removeEventListener('mousemove', resize);
        // Trigger resize on editors after dragging ends to fix rendering
        htmlEditor.resize();
        cssEditor.resize();
        jsEditor.resize();
    });
});

function resize(e) {
    const containerWidth = document.body.clientWidth;
    const newEditorWidth = e.clientX;
    const newPreviewWidth = containerWidth - e.clientX;

    if (newEditorWidth > containerWidth * 0.2 && newPreviewWidth > containerWidth * 0.2) {
        editorPane.style.width = (newEditorWidth / containerWidth) * 100 + '%';
        previewPane.style.width = (newPreviewWidth / containerWidth) * 100 + '%';
    }
}