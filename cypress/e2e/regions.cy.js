describe('WaveSurfer plugins', () => {
  const mockUrl = '/examples/audio.wav'

  beforeEach((done) => {
    cy.visit('cypress/e2e/index.html')

    cy.window().its('wavesurfer').should('exist')

    cy.window().then((win) => {
      const waitForReady = new Promise((resolve) => {
        win.wavesurfer.once('ready', () => resolve())
      })

      cy.wrap(waitForReady).then(done)
    })
  })

  it('should create and remove regions', () => {
    cy.window().then((win) => {
      const regions = win.wavesurfer.getActivePlugins()[0]

      expect(regions).to.be.an('object')

      // Add a region
      const color = 'rgba(100, 0, 0, 0.1)'
      const firstRegion = regions.add(1.5, 10.1, 'Hello', color)

      expect(firstRegion).to.be.an('object')
      expect(firstRegion.element).to.be.an('HTMLDivElement')
      expect(firstRegion.element.textContent).to.equal('Hello')
      expect(firstRegion.element.style.backgroundColor).to.equal(color)

      firstRegion.remove()
      expect(firstRegion.element).to.be.null

      // Create another region
      const secondColor = 'rgba(0, 0, 100, 0.1)'
      const secondRegion = regions.addRegion({
        start: 5.8,
        end: 12,
        content: 'Second',
        color: secondColor
      })

      expect(secondRegion).to.be.an('object')
      expect(secondRegion.element).to.be.an('HTMLDivElement')
      expect(secondRegion.element.textContent).to.equal('Second')
      expect(secondRegion.element.style.backgroundColor).to.equal(secondColor)

      secondRegion.remove()
      expect(secondRegion.element).to.be.null
    })
  })

  it('should drag a region', () => {
    cy.window().then((win) => {
      const regions = win.wavesurfer.getActivePlugins()[0]
      const region = regions.add(3, 8, 'Region', 'rgba(0, 100, 0, 0.2)')

      expect(region.start).to.equal(3)

      // Drag the region
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 90,
        clientY: 1,
      })
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 10,
      })
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 200,
        clientY: 10,
      })
      region.element.dispatchEvent(mouseDownEvent)
      win.document.dispatchEvent(mouseMoveEvent)
      win.document.dispatchEvent(mouseUpEvent)

      expect(region.start).to.be.greaterThan(3)
    })
  })

  it('should set the color of a region', () => {
    cy.window().then((win) => {
      const regions = win.wavesurfer.getActivePlugins()[0]
      const region = regions.add(3, 8, 'Region', 'rgba(0, 100, 0, 0.2)')

      expect(region.color).to.equal('rgba(0, 100, 0, 0.2)')

      region.setOptions({ color: 'rgba(100, 0, 0, 0.1)' })

      expect(region.color).to.equal('rgba(100, 0, 0, 0.1)')

      region.remove()
    })
  })

  it('should set a region position', () => {
    cy.window().then((win) => {
      const regions = win.wavesurfer.getActivePlugins()[0]
      const region = regions.add(3, 8, 'Region', 'rgba(0, 100, 0, 0.2)')

      expect(region.start).to.equal(3)
      expect(region.end).to.equal(8)
      expect(region.resize).to.equal(true)

      region.setOptions({
        start: 5,
        end: 10,
        resize: false,
      })

      expect(region.start).to.equal(5)
      expect(region.end).to.equal(10)
      expect(region.resize).to.equal(false)
    })
  })
})
