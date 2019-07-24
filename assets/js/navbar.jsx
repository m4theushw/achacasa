class Navbar {
  constructor(element) {
    this.element = element
    this.occupiedIsChecked = false

    this.initEvents()
    this.initAutocomplete()
  }

  onTypeChange = callback => {
    this.handleTypeChange = callback
  }

  onOccupiedChange = callback => {
    this.handleOccupiedChange = callback
  }

  onCityChange = callback => {
    this.handleCityChange = callback
  }

  initEvents = () => {
    const typeInput = document.getElementById('type')
    const unoccupiedCheckBox = document.getElementById('unoccupied')

    typeInput.addEventListener('change', event =>
      this.handleTypeChange(event.target.value)
    )

    unoccupiedCheckBox.addEventListener('click', () =>
      this.handleOccupiedChange(
        (this.occupiedIsChecked = !this.occupiedIsChecked)
      )
    )
  }

  url = text => {
    const textNormalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return '/api/cities?search=' + textNormalized
  }

  initAutocomplete = () => {
    new Autocomplete(document.getElementById('city'), {
      url: this.url,
      onSelect: city => {
        this.handleCityChange(city)
      },
    })
  }
}
