export const MarkdownRenderer = {
    props: {
        content: { type: String, required: true }
    },
    setup(props) {
        const { computed } = window.Vue;

        // Custom Marked Extension for ::: containers
        const customContainerExtension = {
            name: 'customContainer',
            level: 'block',
            start(src) { return src.match(/:::/)?.index; },
            tokenizer(src) {
                const rule = /^::: (tip|warning|danger|info)\s*([^\n]*)\n([\s\S]*?)\n:::/;
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: 'customContainer',
                        raw: match[0],
                        variant: match[1],
                        title: match[2] || match[1].toUpperCase(),
                        text: match[3].trim()
                    };
                }
            },
            renderer(token) {
                // We use marked.parse with the text to allow nested markdown in the container
                const body = window.marked.parse(token.text);
                return `<div class="container-block ${token.variant}">
                    <div class="container-title">${token.title}</div>
                    <div class="container-content">${body}</div>
                </div>`;
            }
        };

        const renderedHtml = computed(() => {
            if (!props.content) return '';

            // Setup marked options
            // Expecting window.marked, window.hljs, window.DOMPurify to be available
            if (typeof window.marked === 'undefined') {
                console.error("Marked.js is not loaded");
                return props.content;
            }

            // Configure Marked with custom extensions and highlight.js
            window.marked.use({
                extensions: [customContainerExtension],
                gfm: true,
                breaks: true,
                highlight: (code, lang) => {
                    if (window.hljs && lang && window.hljs.getLanguage(lang)) {
                        return window.hljs.highlight(code, { language: lang }).value;
                    }
                    return code;
                }
            });

            const html = window.marked.parse(props.content);

            // Sanitize if DOMPurify is available
            if (window.DOMPurify) {
                return window.DOMPurify.sanitize(html, {
                    ADD_TAGS: ['details', 'summary', 'kbd'],
                    ADD_ATTR: ['target']
                });
            }
            return html;
        });

        return { renderedHtml };
    },
    template: `
        <div class="markdown-body" v-html="renderedHtml"></div>
    `
};
