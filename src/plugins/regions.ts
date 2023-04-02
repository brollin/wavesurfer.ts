import BasePlugin from '../base-plugin'
import type { WaveSurferPluginParams } from '../index'

const MIN_WIDTH = 10

export type RegionsPluginOptions = {
  dragSelection?: boolean
  draggable?: boolean
  resizable?: boolean
}

const defaultOptions: RegionsPluginOptions = {
  dragSelection: true,
  draggable: true,
  resizable: true,
}

type Region = {
  startTime: number
  endTime: number
  title: string
  start: number
  end: number
  element: HTMLElement
}

export type RegionsPluginEvents = {
  'region-created': { region: Region }
  'region-updated': { region: Region }
  'region-clicked': { region: Region }
}

const style = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
  for (const key in styles) {
    element.style[key] = styles[key] || ''
  }
}

const el = (tagName: string, css: Partial<CSSStyleDeclaration>): HTMLElement => {
  const element = document.createElement(tagName)
  style(element, css)
  return element
}

class RegionsPlugin extends BasePlugin<RegionsPluginEvents, RegionsPluginOptions> {
  private dragStart = NaN
  private regionsContainer: HTMLElement
  private regions: Region[] = []
  private createdRegion: Region | null = null
  private modifiedRegion: Region | null = null
  private isResizingLeft = false
  private isMoving = false

  /** Create an instance of RegionsPlugin */
  constructor(params: WaveSurferPluginParams, options: RegionsPluginOptions) {
    super(params, options)

    this.options = Object.assign({}, defaultOptions, options)

    this.regionsContainer = this.initRegionsContainer()

    const unsubscribe = this.wavesurfer.once('decode', () => {
      this.wrapper.appendChild(this.regionsContainer)
    })
    this.subscriptions.push(unsubscribe)

    this.wrapper.addEventListener('mousedown', this.handleMouseDown)
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
  }

  /** Unmount */
  public destroy() {
    this.wrapper.removeEventListener('mousedown', this.handleMouseDown)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp, true)

    this.regionsContainer.remove()

    super.destroy()
  }

  private initRegionsContainer(): HTMLElement {
    return el('div', {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '3',
      pointerEvents: 'none',
    })
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (this.options.draggable || this.options.resizable || this.options.dragSelection) {
      this.dragStart = e.clientX - this.wrapper.getBoundingClientRect().left
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    const dragEnd = e.clientX - this.wrapper.getBoundingClientRect().left

    if (this.options.draggable && this.modifiedRegion && this.isMoving) {
      this.moveRegion(this.modifiedRegion, dragEnd - this.dragStart)
      this.dragStart = dragEnd
      return
    }

    if (this.options.resizable && this.modifiedRegion) {
      this.updateRegion(
        this.modifiedRegion,
        this.isResizingLeft ? dragEnd : undefined,
        this.isResizingLeft ? undefined : dragEnd,
      )
      return
    }

    if (this.options.dragSelection && !isNaN(this.dragStart)) {
      const dragEnd = e.clientX - this.regionsContainer.getBoundingClientRect().left

      if (dragEnd - this.dragStart >= MIN_WIDTH) {
        if (!this.createdRegion) {
          this.wrapper.style.pointerEvents = 'none'

          this.createdRegion = this.createRegion(this.dragStart, dragEnd)
        } else {
          this.updateRegion(this.createdRegion, this.dragStart, dragEnd)
        }
      }
    }
  }

  private handleMouseUp = () => {
    if (this.createdRegion) {
      this.addRegion(this.createdRegion)
      this.createdRegion = null
    }
    this.modifiedRegion = null
    this.isMoving = false
    this.dragStart = NaN
    this.wrapper.style.pointerEvents = ''
  }

  private createRegionElement(start: number, end: number, title = ''): HTMLElement {
    const noWidth = start === end

    const div = el('div', {
      position: 'absolute',
      left: `${start}px`,
      width: `${end - start}px`,
      height: '100%',
      backgroundColor: noWidth ? '' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: '2px',
      boxSizing: 'border-box',
      borderLeft: noWidth ? '2px solid rgba(0, 0, 0, 0.5)' : '',
      transition: 'background-color 0.2s ease',
      cursor: this.options.draggable ? 'move' : '',
      pointerEvents: 'all',
      whiteSpace: noWidth ? 'nowrap' : '',
      padding: '0.2em',
    })
    div.textContent = title

    const leftHandle = el('div', {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '6px',
      height: '100%',
      cursor: this.options.resizable ? 'ew-resize' : '',
      pointerEvents: 'all',
      borderLeft: noWidth ? '' : '2px solid rgba(0, 0, 0, 0.5)',
      borderRadius: '2px 0 0 2px',
    })
    div.appendChild(leftHandle)

    const rightHandle = leftHandle.cloneNode() as HTMLElement
    style(rightHandle, {
      left: '',
      right: '0',
      borderLeft: '',
      borderRight: noWidth ? '' : '2px solid rgba(0, 0, 0, 0.5)',
      borderRadius: '0 2px 2px 0',
    })
    div.appendChild(rightHandle)

    leftHandle.addEventListener('mousedown', (e) => {
      if (!this.options.resizable) return
      e.stopPropagation()
      this.modifiedRegion = this.regions.find((r) => r.element === div) || null
      this.isResizingLeft = true
      this.isMoving = false
    })

    rightHandle.addEventListener('mousedown', (e) => {
      if (!this.options.resizable) return
      e.stopPropagation()
      this.modifiedRegion = this.regions.find((r) => r.element === div) || null
      this.isResizingLeft = false
      this.isMoving = false
    })

    div.addEventListener('mousedown', () => {
      if (!this.options.draggable) return
      this.modifiedRegion = this.regions.find((r) => r.element === div) || null
      this.isMoving = true
    })

    div.addEventListener('click', () => {
      const region = this.regions.find((r) => r.element === div)
      if (region) {
        this.emit('region-clicked', { region })
      }
    })

    this.regionsContainer.appendChild(div)

    return div
  }

  private createRegion(start: number, end: number, title = ''): Region {
    const duration = this.wavesurfer.getDuration()
    const width = this.regionsContainer.clientWidth

    start = Math.max(0, Math.min(start, width - 1))
    end = Math.max(0, Math.min(end, width - 1))

    return {
      element: this.createRegionElement(start, end, title),
      start,
      end,
      startTime: (start / width) * duration,
      endTime: (end / width) * duration,
      title,
    }
  }

  private addRegion(region: Region) {
    this.regions.push(region)

    this.emit('region-created', { region })
  }

  private updateRegion(region: Region, start?: number, end?: number) {
    const width = this.regionsContainer.clientWidth

    if (start != null) {
      start = Math.max(0, Math.min(start, width))
      region.start = start
      region.element.style.left = `${region.start}px`
      region.element.style.width = `${region.end - region.start}px`
      region.startTime = (start / this.regionsContainer.clientWidth) * this.wavesurfer.getDuration()
    }

    if (end != null) {
      end = Math.max(0, Math.min(end, width))
      region.end = end
      region.element.style.width = `${region.end - region.start}px`
      region.endTime = (end / this.regionsContainer.clientWidth) * this.wavesurfer.getDuration()
    }

    this.emit('region-updated', { region })
  }

  private moveRegion(region: Region, delta: number) {
    this.updateRegion(region, region.start + delta, region.end + delta)
  }

  /** Create a region at a given start and end time, with an optional title */
  public add(startTime: number, endTime: number, title = '', color = ''): Region {
    const duration = this.wavesurfer.getDuration()
    const width = this.regionsContainer.clientWidth
    const start = (startTime / duration) * width
    const end = (endTime / duration) * width
    const region = this.createRegion(start, end, title)
    this.addRegion(region)
    if (color) this.setRegionColor(region, color)
    return region
  }

  /** Set the background color of a region */
  public setRegionColor(region: Region, color: string) {
    region.element.style[region.startTime === region.endTime ? 'borderColor' : 'backgroundColor'] = color
  }
}

export default RegionsPlugin
