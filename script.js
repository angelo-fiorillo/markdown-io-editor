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
    previewButtons.innerHTML = ctaButtons;

    // Aggiusta l'altezza del contenuto in base alla presenza di CTA
    adjustContentHeight();
}

function generateCTAButtons(data) {
    let buttons = '';
    if (data.cta_1) {
        buttons += `<a href="${data.cta_1.action}" class="io-button">${data.cta_1.text}</a>`;
    }
    if (data.cta_2) {
        buttons += `<a href="${data.cta_2.action}" class="io-button">${data.cta_2.text}</a>`;
    }
    return buttons;
}

function adjustContentHeight() {
    const frameHeight = previewFrame.offsetHeight;
    const buttonsHeight = previewButtons.offsetHeight;
    previewContent.style.height = `${frameHeight - buttonsHeight}px`;
}

copyBtn.addEventListener('click', () => {
    const textToCopy = frontMatterInput.value + '\n---\n' + markdownInput.value;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Contenuto copiato negli appunti!');
    });
});

saveImageBtn.addEventListener('click', () => {
    // Creiamo un contenitore temporaneo per l'immagine completa
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
            const [frontMatter, markdown] = content.split('---\n');
            frontMatterInput.value = frontMatter.trim();
            markdownInput.value = markdown.trim();
            renderMarkdown();
        };
        reader.readAsText(file);
    }
});

saveBtn.addEventListener('click', () => {
    const content = frontMatterInput.value + '\n---\n' + markdownInput.value;
    const blob = new Blob([content], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'document.md';
    link.click();
});

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

// Imposta le dimensioni iniziali del preview-frame
const scaleFactor = 0.3;
previewFrame.style.width = `${1080 * scaleFactor}px`;
previewFrame.style.height = `${2340 * scaleFactor}px`;

// Aggiorna il rendering quando il contenuto cambia
frontMatterInput.addEventListener('input', renderMarkdown);
markdownInput.addEventListener('input', renderMarkdown);

// Salva il contenuto quando cambia
frontMatterInput.addEventListener('input', saveContent);
markdownInput.addEventListener('input', saveContent);

// Gestione del ridimensionamento
window.addEventListener('resize', adjustContentHeight);
