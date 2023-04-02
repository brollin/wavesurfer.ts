const GISTS_API_URL = 'https://api.github.com/gists'

const fetchJson = async (url) => {
  const resp = await fetch(url)
  const json = await resp.json()
  return json
}

export const readGist = async (id) => {
  const data = await fetchJson(`${GISTS_API_URL}/${id}`)
  return Object.values(data.files)[0].content
}
