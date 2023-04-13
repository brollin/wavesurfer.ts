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

  it('should register the regions plugin', () => {
    cy.window().its('Regions').should('be.an', 'function')

    cy.window().then((win) => {
      const regions = win.wavesurfer.registerPlugin(
        win.Regions.create({
          dragSelection: true,
          draggable: true,
          resizeable: true,
        }),
      )

      expect(regions).to.be.an('object')

      // Add a region
      const color = 'rgba(100, 0, 0, 0.1)'
      const firstRegion = regions.add(1.5, 10.1, 'Hello', color)

      expect(firstRegion).to.be.an('object')
      expect(firstRegion.element).to.be.an('HTMLDivElement')
      expect(firstRegion.element.textContent).to.equal('Hello')
      expect(firstRegion.element.style.backgroundColor).to.equal(color)

      // Remove the region
      regions.remove(firstRegion)
      expect(firstRegion.element).to.be.null

      // Create another region
      const secondColor = 'rgba(0, 0, 100, 0.1)'
      const secondRegion = regions.add(5.8, 12, 'Second', secondColor)

      expect(secondRegion).to.be.an('object')
      expect(secondRegion.element).to.be.an('HTMLDivElement')
      expect(secondRegion.element.textContent).to.equal('Second')
      expect(secondRegion.element.style.backgroundColor).to.equal(secondColor)

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
      secondRegion.element.dispatchEvent(mouseDownEvent)
      regions.wrapper.dispatchEvent(mouseDownEvent)
      win.document.dispatchEvent(mouseMoveEvent)
      win.document.dispatchEvent(mouseUpEvent)

      expect(secondRegion.startTime).to.be.greaterThan(5.8)

      // Set region color
      regions.setRegionColor(secondRegion, 'rgba(0, 100, 0, 0.5)')
      expect(secondRegion.element.style.backgroundColor).to.equal('rgba(0, 100, 0, 0.5)')
    })
  })
})
