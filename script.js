const frontMatterInput = document.getElementById('front-matter');
const markdownInput = document.getElementById('markdown-input');
const previewContent = document.getElementById('preview-content');
const previewButtons = document.getElementById('preview-buttons');
const copyBtn = document.getElementById('copy-btn');
const saveImageBtn = document.getElementById('save-image-btn');
const loadBtn = document.getElementById('load-btn');
const saveBtn = document.getElementById('save-btn');
const previewFrame = document.getElementById('preview-frame');

function renderMarkdown() {
    let ctaButtons = '';
    try {
        const yamlData = jsyaml.load(frontMatterInput.value);
        if (yamlData && yamlData.it) {
            ctaButtons = generateCTAButtons(yamlData.it);
        }
    } catch (e) {
        console.error('Errore nel parsing del front-matter YAML:', e);
    }
    
    const htmlContent = marked(markdownInput.value);
    previewContent.innerHTML = htmlContent;
    previewButtons.innerHTML = ctaButtons || '<div class="error-message">Errore nel front matter!</div>';

    adjustContentHeight();
}

function generateCTAButtons(data) {
    let buttons = '';
    if (data.cta_1) {
        buttons += generateCTAButton(data.cta_1, 'primary');
        if (data.cta_2) {
            buttons += generateCTAButton(data.cta_2, 'secondary');
        }
    } else if (data.cta_2) {
        return ''; // Questo triggererà il messaggio di errore
    }
    return buttons;
}

function generateCTAButton(cta, type) {
    let action = cta.action;
    let onclickAttr = '';
    if (action.startsWith('iohandledlink://')) {
        const targetUrl = action.replace('iohandledlink://', '');
        onclickAttr = `onclick="window.open('${targetUrl}', '_blank', 'width=800,height=600'); return false;"`;
        action = targetUrl;
    }
    return `<a href="${action}" class="io-button io-button-${type}" ${onclickAttr}>${cta.text}</a>`;
}

function adjustContentHeight() {
    const frameHeight = previewFrame.offsetHeight;
    const buttonsHeight = previewButtons.offsetHeight;
    previewContent.style.height = `${frameHeight - buttonsHeight}px`;
}

copyBtn.addEventListener('click', () => {
    const textToCopy = formatFullMarkdown();
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Contenuto copiato negli appunti!');
    });
});

saveImageBtn.addEventListener('click', () => {
    const tempContainer = document.createElement('div');
    tempContainer.style.width = `${previewFrame.offsetWidth}px`;
    tempContainer.innerHTML = previewContent.innerHTML + previewButtons.innerHTML;
    document.body.appendChild(tempContainer);

    html2canvas(tempContainer).then(canvas => {
        const link = document.createElement('a');
        link.download = 'preview.png';
        link.href = canvas.toDataURL();
        link.click();
        document.body.removeChild(tempContainer);
    });
});

loadBtn.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            
            if (match) {
                // Il file contiene front matter
                frontMatterInput.value = unformatFrontMatter(match[1].trim());
                markdownInput.value = unformatMarkdown(match[2].trim());
            } else {
                // Il file non contiene front matter
                frontMatterInput.value = '';
                markdownInput.value = unformatMarkdown(content.trim());
            }
            renderMarkdown();
        };
        reader.readAsText(file);
    }
});

saveBtn.addEventListener('click', () => {
    const content = formatFullMarkdown();
    const blob = new Blob([content], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'document.md';
    link.click();
});

function formatFullMarkdown() {
    let result = '';
    if (frontMatterInput.value.trim()) {
        result += `---\\n${formatFrontMatter(frontMatterInput.value)}\\n---\\n`;
    }
    result += formatMarkdown(markdownInput.value);
    return result.replace(/\n/g, ' ');
}

function formatFrontMatter(text) {
    return text.trim().replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function unformatFrontMatter(text) {
    return text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
}

function formatMarkdown(text) {
    return text.replace(/"/g, '\\"')
               .replace(/\n{2,}/g, '\\n\\n')
               .replace(/  \n/g, ' \\n')
               .replace(/\n/g, '\\n');
}

function unformatMarkdown(text) {
    return text.replace(/\\"/g, '"')
               .replace(/\\n\\n/g, '\n\n')
               .replace(/ \\n/g, '  \n')
               .replace(/\\n/g, '\n');
}

function loadSplitterPositions() {
    const horizontalSplit = localStorage.getItem('horizontalSplit');
    const verticalSplit = localStorage.getItem('verticalSplit');

    if (horizontalSplit) {
        document.querySelector('.horizontal').style.flexBasis = horizontalSplit;
    }
    if (verticalSplit) {
        document.querySelector('.vertical').style.flexBasis = verticalSplit;
    }
}

function saveSplitterPositions() {
    localStorage.setItem('horizontalSplit', document.querySelector('.horizontal').style.flexBasis);
    localStorage.setItem('verticalSplit', document.querySelector('.vertical').style.flexBasis);
}

function loadSavedContent() {
    const savedFrontMatter = localStorage.getItem('frontMatter');
    const savedMarkdown = localStorage.getItem('markdown');

    if (savedFrontMatter) frontMatterInput.value = savedFrontMatter;
    if (savedMarkdown) markdownInput.value = savedMarkdown;
}

function saveContent() {
    localStorage.setItem('frontMatter', frontMatterInput.value);
    localStorage.setItem('markdown', markdownInput.value);
}

loadSplitterPositions();
loadSavedContent();
renderMarkdown();

const scaleFactor = 0.3;
previewFrame.style.width = `${1080 * scaleFactor}px`;
previewFrame.style.height = `${2340 * scaleFactor}px`;

frontMatterInput.addEventListener('input', renderMarkdown);
markdownInput.addEventListener('input', renderMarkdown);

frontMatterInput.addEventListener('input', saveContent);
markdownInput.addEventListener('input', saveContent);

window.addEventListener('resize', adjustContentHeight);

markdownInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const value = this.value;
        if (e.shiftKey) {
            // Inserisci un a-capo semplice
            this.value = value.slice(0, start) + '\n' + value.slice(end);
            this.selectionStart = this.selectionEnd = start + 1;
        } else {
            // Inserisci un a-capo con nuovo paragrafo
            this.value = value.slice(0, start) + '\n\n' + value.slice(end);
            this.selectionStart = this.selectionEnd = start + 2;
        }
        e.preventDefault();
        renderMarkdown();
    }
});
