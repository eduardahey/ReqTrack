// Requisitos e histórias não têm um código legível salvo no banco (só cuid).
// O código curto (RF01, RNF01, US01...) é derivado da ordem de criação,
// então precisa ser calculado sempre a partir da lista completa (não filtrada)
// do projeto para não mudar dependendo do filtro ativo na tela.

export function getRequirementCodeMap(requirements) {
  const sorted = [...requirements].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const counters = {}
  const map = {}
  for (const req of sorted) {
    const prefix = req.type === 'FUNCTIONAL' ? 'RF' : 'RNF'
    counters[prefix] = (counters[prefix] || 0) + 1
    map[req.id] = `${prefix}${String(counters[prefix]).padStart(2, '0')}`
  }
  return map
}

export function getUserStoryCodeMap(stories) {
  const sorted = [...stories].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const map = {}
  sorted.forEach((story, i) => {
    map[story.id] = `US${String(i + 1).padStart(2, '0')}`
  })
  return map
}
