import { initEditor, fetchContent, setContent, getContent } from './editor.js'
import { readGist } from './gists.js'

const onSetContent = () => {
  const code = getContent()
  const html = (code.replace(/\n/g, '').match(/<html>(.+)<\/html>/) || [])[1] || ''
  const script = code
    .replace(/<\/?script>?/g, '') // sanitize HTML
    .replace(/from 'wavesurfer.js'/g, "from '/dist/index.js'") // replace imports
    .replace(/from 'wavesurfer.js\/dist/g, "from '/dist") // replace dist imports
  const isBabel = script.includes('@babel')

  document.getElementById('preview').srcdoc = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Preview</title>
    <style>
      html, body {
        background-color: transparent;
        margin: 0;
        padding: 0;
      }
      body {
        padding: 1rem;
      }
    </style>
  </head>

  <body>
    ${html}

    <script type="${isBabel ? 'text/babel' : 'module'}" data-type="module">
      ${script}
    </script>
  </body>
</html>
<body>
</body>
`
}

const initSidebar = () => {
  const introUrl = '#/examples/intro.js'

  // Load the example code on menu click
  let currentLink = null
  document.addEventListener('click', (e) => {
    const url = e.target.hash

    if (url && url.startsWith('#/examples/')) {
      fetchContent(url.slice(1)).then(setContent)

      // Mark the link as current
      if (currentLink) currentLink.classList.remove('active')
      currentLink = e.target
      currentLink.classList.add('active')

      // Remove the search query
      if (window.location.search) {
        window.location.href = window.location.pathname + window.location.hash
      }
    }
  })

  // Open the example from the URL hash, or the default one
  const { search } = window.location
  if (search && search.includes('gist')) {
    const gistId = search.match(/[?&]gist=([^&]+)/)[1]
    readGist(gistId).then(setContent)
  } else {
    const hash = window.location.hash || introUrl
    const link = document.querySelector(`a[href="${hash}"]`)
    if (link) link.click()
  }
}

const init = () => {
  // Init the Monaco editor
  initEditor(onSetContent)

  // Init the sidebar
  initSidebar()
}

init()
