let editor = null

export const getContent = () => {
  return editor ? editor.getModel().getValue() : ''
}

export const setContent = (newContent) => {
  newContent = newContent.replace(/\.\.\/dist\//g, '/dist/')
  if (!editor) {
    setTimeout(() => setContent(newContent), 10)
  } else {
    editor.getModel().setValue(newContent)
    editor.setScrollPosition({ scrollTop: 0 })
  }
}

export const fetchContent = async (url) => {
  return fetch(url).then((res) => res.text())
}

const mobileDetect = () => window.innerWidth <= 768

export const initEditor = (onSetContent) => {
  require.config({
    paths: {
      vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.37.1/min/vs',
    },
  })

  require(['vs/editor/editor.main'], async () => {
    let theme = 'vs'
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'vs-dark'
    }

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      lib: ['es2019', 'dom'],
      allowJs: true,
      allowNonTsExtensions: true,
      baseUrl: window.location.origin,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Classic,
    })

    const libs = [
      '/dist/wavesurfer.d.ts',
      '/dist/player.d.ts',
      '/dist/event-emitter.d.ts',
      '/dist/plugins/envelope.d.ts',
      '/dist/plugins/minimap.d.ts',
      '/dist/plugins/multitrack.d.ts',
      '/dist/plugins/record.d.ts',
      '/dist/plugins/regions.d.ts',
      '/dist/plugins/timeline.d.ts',
    ]
    const libCodes = await Promise.all(libs.map((url) => fetchContent(url)))
    libCodes.forEach((code, index) => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(code, libs[index])
    })

    const monacoEditor = monaco.editor.create(document.getElementById('editor'), {
      language: 'typescript',
      quickSuggestions: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      autoClosingBrackets: false,
      minimap: { enabled: false },
      tabSize: 2,
      theme,
      ...(mobileDetect() && {
        glyphMargin: false,
        folding: false,
        lineNumbers: 'off',
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
      }),
    })

    let debounce
    const model = monacoEditor.getModel()
    model.onDidChangeContent(() => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(onSetContent, 300)
    })

    // Export
    editor = monacoEditor
  })
}
