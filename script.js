const frontMatterInput = document.getElementById('front-matter');
const markdownInput = document.getElementById('markdown-input');
const previewContent = document.getElementById('preview-content');
const previewButtons = document.getElementById('preview-buttons');
const copyBtn = document.getElementById('copy-btn');
const saveImageBtn = document.getElementById('save-image-btn');
const loadBtn = document.getElementById('load-btn');
const saveBtn = document.getElementById('save-btn');
const displaySelect = document.getElementById('display-select');

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

function convertMarkdownToExport(markdown) {
    return markdown.replace(/(?<!\n)\n(?!\n)/g, '  \n').replace(/\n\n/g, '\n\n');
}

function convertMarkdownFromImport(markdown) {
    return markdown.replace(/  \n/g, '\n').replace(/\n\n/g, '\n\n');
}

frontMatterInput.addEventListener('input', renderMarkdown);
markdownInput.addEventListener('input', renderMarkdown);

markdownInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            // Shift+Enter: inserisce un a-capo semplice
            e.preventDefault();
            const start = markdownInput.selectionStart;
            const end = markdownInput.selectionEnd;
            const value = markdownInput.value;
            markdownInput.value = value.substring(0, start) + '\n' + value.substring(end);
            markdownInput.selectionStart = markdownInput.selectionEnd = start + 1;
        } else {
            // Enter: inserisce un a-capo con nuovo paragrafo
            e.preventDefault();
            const start = markdownInput.selectionStart;
            const end = markdownInput.selectionEnd;
            const value = markdownInput.value;
            markdownInput.value = value.substring(0, start) + '\n\n' + value.substring(end);
            markdownInput.selectionStart = markdownInput.selectionEnd = start + 2;
        }
        renderMarkdown();
    }
});

copyBtn.addEventListener('click', () => {
    const fullContent = `---\n${frontMatterInput.value}\n---\n\n${convertMarkdownToExport(markdownInput.value)}`;
    navigator.clipboard.writeText(fullContent).then(() => {
        alert('Contenuto copiato nella clipboard!');
    });
});

saveImageBtn.addEventListener('click', () => {
    html2canvas(document.getElementById('preview-frame')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'preview.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});

loadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            const content = event.target.result;
            const [, frontMatter, markdown] = content.match(/^(---\n[\s\S]*?\n---\n)?([\s\S]*)$/);
            frontMatterInput.value = frontMatter ? frontMatter.replace(/^---\n|---\n$/g, '') : '';
            markdownInput.value = convertMarkdownFromImport(markdown.trim());
            renderMarkdown();
        };
        reader.readAsText(file);
    };
    input.click();
});

saveBtn.addEventListener('click', () => {
    const content = `---\n${frontMatterInput.value}\n---\n\n${convertMarkdownToExport(markdownInput.value)}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.download = 'document.md';
    link.href = URL.createObjectURL(blob);
    link.click();
});

displaySelect.addEventListener('change', () => {
    const selectedDisplay = displaySelect.value;
    const previewFrame = document.getElementById('preview-frame');
    const scaleFactor = 0.3;

    switch (selectedDisplay) {
        case 'mobile':
            previewFrame.style.width = `${1080 * scaleFactor}px`;
            previewFrame.style.height = `${2340 * scaleFactor}px`;
            break;
        case 'tablet':
            previewFrame.style.width = `${2340 * scaleFactor}px`;
            previewFrame.style.height = `${1080 * scaleFactor}px`;
            break;
    }
});

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    breaks: true,
    highlight: function(code) {
        return `<pre><code>${code}</code></pre>`;
    }
});

const renderer = new marked.Renderer();

renderer.link = (href, title, text) => {
    if (href.startsWith('iohandledlink://')) {
        return `<a href="${href}" class="io-link">${text}</a>`;
    }
    return `<a href="${href}" target="_blank">${text}</a>`;
};

renderer.list = (body, ordered, start) => {
    const type = ordered ? 'ol' : 'ul';
    return `<${type} style="padding-left: 20px;">${body}</${type}>`;
};

renderer.listitem = (text) => {
    return `<li style="margin-bottom: 5px;">${text}</li>`;
};

renderer.heading = (text, level) => {
    const fontSize = 24 - (level * 2);
    return `<h${level} style="font-size: ${fontSize}px; margin-top: 20px; margin-bottom: 10px;">${text}</h${level}>`;
};

marked.use({ renderer });

function validateMarkdown(markdown) {
    const warnings = [];
    
    if (!/^#\s.+/m.test(markdown)) {
        warnings.push("Il documento dovrebbe iniziare con un titolo di primo livello (#).");
    }

    const lines = markdown.split('\n');
    lines.forEach((line, index) => {
        if (line.length > 100) {
            warnings.push(`La riga ${index + 1} supera i 100 caratteri.`);
        }
    });

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
        const [, text, url] = match;
        if (!url.startsWith('https://') && !url.startsWith('iohandledlink://')) {
            warnings.push(`Il link "${text}" non inizia con https:// o iohandledlink://.`);
        }
    }

    return warnings;
}

// Inizializza la visualizzazione mobile come default
displaySelect.value = 'mobile';
displaySelect.dispatchEvent(new Event('change'));

// Gestione degli splitter
const verticalSplitter = document.querySelector('.splitter.vertical');
const horizontalSplitter = document.querySelector('.splitter.horizontal');
const editor = document.getElementById('editor');
const previewContainer = document.getElementById('preview-container');
const frontMatter = document.getElementById('front-matter');

let isResizingVertical = false;
let isResizingHorizontal = false;

verticalSplitter.addEventListener('mousedown', (e) => {
    isResizingVertical = true;
    document.addEventListener('mousemove', handleVerticalResize);
    document.addEventListener('mouseup', stopResize);
});

horizontalSplitter.addEventListener('mousedown', (e) => {
    isResizingHorizontal = true;
    document.addEventListener('mousemove', handleHorizontalResize);
    document.addEventListener('mouseup', stopResize);
});

function handleVerticalResize(e) {
    if (!isResizingVertical) return;
    const newEditorWidth = e.clientX;
    const maxWidth = window.innerWidth - previewContainer.offsetWidth - 20; // 20px di margine
    if (newEditorWidth > 300 && newEditorWidth < maxWidth) {
        editor.style.width = `${newEditorWidth}px`;
    }
}

function handleHorizontalResize(e) {
    if (!isResizingHorizontal) return;
    const newFrontMatterHeight = e.clientY - editor.offsetTop;
    if (newFrontMatterHeight > 100 && newFrontMatterHeight < editor.offsetHeight - 100) {
        frontMatter.style.height = `${newFrontMatterHeight}px`;
        markdownInput.style.height = `${editor.offsetHeight - newFrontMatterHeight - 10}px`; // 10px per lo splitter
    }
}

function stopResize() {
    isResizingVertical = false;
    isResizingHorizontal = false;
    document.removeEventListener('mousemove', handleVerticalResize);
    document.removeEventListener('mousemove', handleHorizontalResize);
    saveSplitterPositions();
}

function saveSplitterPositions() {
    localStorage.setItem('editorWidth', editor.style.width);
    localStorage.setItem('frontMatterHeight', frontMatter.style.height);
}

function loadSplitterPositions() {
    const savedEditorWidth = localStorage.getItem('editorWidth');
    const savedFrontMatterHeight = localStorage.getItem('frontMatterHeight');
    if (savedEditorWidth) editor.style.width = savedEditorWidth;
    if (savedFrontMatterHeight) {
        frontMatter.style.height = savedFrontMatterHeight;
        markdownInput.style.height = `${editor.offsetHeight - parseInt(savedFrontMatterHeight) - 10}px`;
    }
}

loadSplitterPositions();
renderMarkdown();
