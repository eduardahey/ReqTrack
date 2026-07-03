export default function ChecklistEditor({ items, onChange, placeholder }) {
  function updateItem(index, value) {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onChange([...items, ''])
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            className="flex-1 h-10 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-xs font-semibold text-[#0058be] hover:underline flex items-center gap-1"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        Adicionar critério
      </button>
    </div>
  )
}
