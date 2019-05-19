describe('Sidebar', () => {

  let element

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(element)
  })

  it('is hidden when initiated on mobile', () => {
    new Sidebar(element, { innerWidth: 320 })
    expect(element.style.display).toEqual('none')
  })

  it('is visible when initiated on a non-mobile device', () => {
    new Sidebar(element, { innerWidth: 600 })
    expect(element.style.display).toEqual('block')
  })

  it(`doesn't have the "sidebar-open" CSS class when initiated on mobile`, () => {
    new Sidebar(element, { innerWidth: 600 })
    expect(element.classList).toContain('sidebar-open')
  })

  it('adds the "sidebar-open" CSS class when initiated on a non-mobile device', () => {
    new Sidebar(element, { innerWidth: 600 })
    expect(element.classList).toContain('sidebar-open')
  })

  it('opens when the window changes from mobile to desktop', () => {
    const windowMock = { innerWidth: 320 }
    new Sidebar(element, windowMock)
    expect(element.style.display).toEqual('none')
    windowMock.innerWidth = 600
    windowMock.onresize()
    expect(element.style.display).toEqual('block')
  })

  describe('#open', () => {

    it('sets the display to "block" when on mobile', () => {
      const sidebar = new Sidebar(element, { innerWidth: 320 })
      expect(element.style.display).toEqual('none')
      sidebar.open()
      expect(element.style.display).toEqual('block')
    })

    it('adds the "sidebar-open" CSS class', done => {
      const sidebar = new Sidebar(element, { innerWidth: 320 })
      expect(element.classList).not.toContain('sidebar-open')
      sidebar.open()
      setTimeout(() => {
        expect(element.classList).toContain('sidebar-open')
        done()
      })
    })

  })

  describe('#close', () => {

    let sidebar

    beforeEach(done => {
      sidebar = new Sidebar(element, { innerWidth: 320 })
      sidebar.open()
      setTimeout(() => {
        done()
      })
    })

    it('sets the display to "none" when on mobile', done => {
      expect(element.style.display).toEqual('block')
      sidebar.close()
      setTimeout(() => {
        expect(element.style.display).toEqual('none')
        done()
      }, 200)
    })

    it('removes the "sidebar-open" CSS class', () => {
      expect(element.classList).toContain('sidebar-open')
      sidebar.close()
      expect(element.classList).not.toContain('sidebar-open')
    })

  })

  describe('#showResults', () => {

    let sidebar

    beforeEach(() => {
      sidebar = new Sidebar(element, { innerWidth: 0 })
    })

    it('renders a message when receives an empty array', () => {
      sidebar.showResults([])
      expect(element.innerText).toContain('Nenhum imóvel encontrado nesta área.')
    })

    it('renders in the header the number of properties', () => {
      sidebar.showResults([{}])
      let header = element.querySelector('.sidebar-header')
      expect(header.innerText).toContain('1 imóvel encontrado')

      sidebar.showResults([{}, {}])
      header = element.querySelector('.sidebar-header')
      expect(header.innerText).toContain('2 imóveis encontrados')
    })

    it('adds the "results-item-occupied" CSS class when the property is occupied', () => {
      sidebar.showResults([{ is_occupied: true }])
      const result = element.querySelector('.results li:first-child')
      expect(result.classList).toContain('results-item-occupied')
    })

    it('adds the "results-item-unoccupied" CSS class when the property is not occupied', () => {
      sidebar.showResults([{ is_occupied: false }])
      const result = element.querySelector('.results li:first-child')
      expect(result.classList).toContain('results-item-unoccupied')
    })

    it('renders the status when the property is occupied', () => {
      sidebar.showResults([{ is_occupied: true }])
      expect(element.querySelector('.results-item-status').innerText).toEqual('OCUPADO')
    })

    it('renders the status when the property is occupied', () => {
      sidebar.showResults([{ is_occupied: false }])
      expect(element.querySelector('.results-item-status').innerText).toEqual('DESOCUPADO')
    })

    it('calls the function passed to "onResultClick" with the slug of the property clicked', () => {
      sidebar.onResultClick(slug => {
        expect(slug).toEqual('123-foobar')
      })
      sidebar.showResults([{ slug: '123-foobar' }])
      element.querySelector('.results-item').click()
    })

  })

})
