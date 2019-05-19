class Autocomplete {
  constructor(input, options) {
    this.input = input
    this.options = options
    this.input.addEventListener('keyup', this.handleKeyup)
    window.addEventListener('click', this.handleClick)
  }

  handleKeyup = event => {
    const text = event.target.value

    if (text.length < 3) {
      this.closeDropdownIfExists()
      return
    }

    this.fetchItems(text).then(items => {
      if (!items.length) {
        this.closeDropdownIfExists()
        return
      }

      this.createDropdownIfNotExists()
      render(this.autocomplete, this.renderItems(items))
    })
  }

  handleClick = event => {
    if (this.autocomplete && !this.autocomplete.contains(event.target)) {
      this.closeDropdownIfExists()
    }
  }

  fetchItems = text => fetchJSON(this.options.url(text))

  createDropdownIfNotExists = () => {
    if (this.autocomplete) return

    this.autocomplete = document.createElement('div')
    this.autocomplete.className = 'autocomplete'

    const bounds = this.input.getBoundingClientRect()

    this.autocomplete.style.top = bounds.bottom + 'px'
    this.autocomplete.style.left = bounds.left + 'px'
    this.autocomplete.style.width = bounds.width + 'px'

    document.body.appendChild(this.autocomplete)
  }

  closeDropdownIfExists = () => {
    if (this.autocomplete) {
      this.autocomplete.remove()
      this.autocomplete = null
    }
  }

  handleItemClick = item => {
    this.closeDropdownIfExists()
    this.input.value = item.label
    this.options.onSelect(item)
  }

  renderItems = items => (
    <ul class="autocomplete-items">
      {items.map(item => (
        <li onClick={() => this.handleItemClick(item)}>
          {item.label} <span>({item.count})</span>
        </li>
      ))}
    </ul>
  )
}
