/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from 'react'
import { Utils, HTMLContainer, TLBounds } from '@tldraw/core'
import { AlignStyle, VideoRecorderShape, TDMeta, TDShapeType, TransformInfo } from '~types'
import { defaultTextStyle, getBoundsRectangle, TextAreaUtils } from '../shared'
import { TDShapeUtil } from '../TDShapeUtil'
// import { getStickyFontStyle, getStickyShapeStyle } from '../shared/shape-styles'
import { Icon } from '@iconify/react'
import { styled } from '~styles'
import { Vec } from '@tldraw/vec'
import { GHOSTED_OPACITY } from '~constants'
import { TLDR } from '~state/TLDR'
import { getTextSvgElement } from '../shared/getTextSvgElement'
import { stopPropagation } from '~components/stopPropagation'
import { relative } from 'path'
import { Modal } from 'react-bootstrap'
import useModal from './useModal'

type T = VideoRecorderShape
type E = HTMLDivElement

export class VideoRecorderUtil extends TDShapeUtil<T, E> {
  type = TDShapeType.VideoRecorder as const

  canBind = true

  canEdit = true

  canClone = true

  hideResizeHandles = true

  showCloneHandles = true

  getShape = (props: Partial<T>): T => {
    return Utils.deepMerge<T>(
      {
        id: 'id',
        type: TDShapeType.VideoRecorder,
        name: 'Sticky',
        parentId: 'page',
        childIndex: 1,
        point: [0, 0],
        size: [60, 60],
        isModalOpen: false,
        rotation: 0,
        style: defaultTextStyle,
      },
      props
    )
  }

  Component = TDShapeUtil.Component<T, E, TDMeta>(
    ({ shape, meta, events, isGhost, isBinding, isEditing, onShapeBlur, onShapeChange }, ref) => {
      // const font = getStickyFontStyle(shape.style)

      // const { color, fill } = getStickyShapeStyle(shape.style, meta.isDarkMode)

      const rContainer = React.useRef<HTMLDivElement>(null)

      // const rTextArea = React.useRef<HTMLTextAreaElement>(null)

      // const rText = React.useRef<HTMLDivElement>(null)

      const rIsMounted = React.useRef(false)

      const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
        e.stopPropagation()
      }, [])

      const onChange = React.useCallback(
        (text: string) => {
          onShapeChange?.({
            id: shape.id,
            type: shape.type,
          })
        },
        [shape.id]
      )

      const handleTextChange = React.useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          onChange(e.currentTarget.value)
        },
        [onShapeChange, onChange]
      )

      const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            onShapeBlur?.()
            return
          }

          // if (e.key === 'Tab' && shape.text.length === 0) {
          //   e.preventDefault()
          //   return
          // }

          if (!(e.key === 'Meta' || e.metaKey)) {
            e.stopPropagation()
          } else if (e.key === 'z' && e.metaKey) {
            if (e.shiftKey) {
              document.execCommand('redo', false)
            } else {
              document.execCommand('undo', false)
            }
            e.stopPropagation()
            e.preventDefault()
            return
          }
          if ((e.metaKey || e.ctrlKey) && e.key === '=') {
            e.preventDefault()
          }
          if (e.key === 'Tab') {
            e.preventDefault()
            if (e.shiftKey) {
              TextAreaUtils.unindent(e.currentTarget)
            } else {
              TextAreaUtils.indent(e.currentTarget)
            }

            onShapeChange?.({ ...shape })
          }
        },
        [shape, onShapeChange]
      )

      const handleBlur = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
        e.currentTarget.setSelectionRange(0, 0)
        onShapeBlur?.()
      }, [])

      const handleFocus = React.useCallback(
        (e: React.FocusEvent<HTMLTextAreaElement>) => {
          if (!isEditing) return
          if (!rIsMounted.current) return
          e.currentTarget.select()
        },
        [isEditing]
      )

      // Focus when editing changes to true
      // React.useEffect(() => {
      //   if (isEditing) {
      //     rIsMounted.current = true
      //     const elm = rTextArea.current!
      //     elm.focus()
      //     elm.select()
      //   }
      // }, [isEditing])

      // // Resize to fit text
      // React.useEffect(() => {
      //   const text = rText.current!

      //   const { size } = shape
      //   const { offsetHeight: currTextHeight } = text
      //   const minTextHeight = MIN_CONTAINER_HEIGHT - PADDING * 2
      //   const prevTextHeight = size[1] - PADDING * 2

      //   // Same size? We can quit here
      //   if (currTextHeight === prevTextHeight) return

      //   if (currTextHeight > minTextHeight) {
      //     // Snap the size to the text content if the text only when the
      //     // text is larger than the minimum text height.
      //     onShapeChange?.({ id: shape.id, size: [size[0], currTextHeight + PADDING * 2] })
      //     return
      //   }

      //   if (currTextHeight < minTextHeight && size[1] > MIN_CONTAINER_HEIGHT) {
      //     // If we're smaller than the minimum height and the container
      //     // is too tall, snap it down to the minimum container height
      //     onShapeChange?.({ id: shape.id, size: [size[0], MIN_CONTAINER_HEIGHT] })
      //     return
      //   }

      //   const textarea = rTextArea.current
      //   textarea?.focus()
      // }, [shape.text, shape.size[1], shape.style])

      // const style = {
      //   font,
      //   color,
      //   textShadow: meta.isDarkMode
      //     ? `0.5px 0.5px 2px rgba(255, 255, 255,.25)`
      //     : `0.5px 0.5px 2px rgba(255, 255, 255,.5)`,
      // }

      const {
        isOpen: isRecordOpen,
        size,
        className,
        scroll,
        toggleModal: toggleRecord,
        openModalWithClass,
      } = useModal()

      return (
        <HTMLContainer ref={ref} {...events}>
          <StyledVideoContainer
            ref={rContainer}
            isDarkMode={meta.isDarkMode}
            isGhost={isGhost}
            // style={{ backgroundColor: fill, ...style }}
          >
            {isBinding && (
              <div
                className="tl-binding-indicator"
                style={{
                  position: 'absolute',
                  top: -this.bindingDistance,
                  left: -this.bindingDistance,
                  width: `calc(100% + ${this.bindingDistance * 2}px)`,
                  height: `calc(100% + ${this.bindingDistance * 2}px)`,
                  backgroundColor: 'var(--tl-selectFill)',
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Icon
                icon="bi:record-circle"
                color="red"
                width="100%"
                style={{
                  cursor: 'pointer',
                }}
                onClick={() => {
                  alert('test')
                  console.log('clicked')
                  openModalWithClass('modal-full-width')
                }}
              />
              <Modal
                show={isRecordOpen}
                onHide={toggleRecord}
                dialogClassName={className}
                size={size}
                scrollable={scroll}
              >
                <Modal.Body>
                  <Modal.Header onHide={toggleRecord} closeButton>
                    <h4 className="modal-title">Record</h4>
                  </Modal.Header>
                  <p>test</p>
                </Modal.Body>
              </Modal>
            </div>
            {/* <StyledText ref={rText} isEditing={isEditing} alignment={shape.style.textAlign}>
              {shape.text}&#8203;
            </StyledText> */}
            {/* {isEditing && (
              <StyledTextArea
                // ref={rTextArea}
                onPointerDown={handlePointerDown}
                // value={shape.text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                tabIndex={-1}
                autoComplete="false"
                autoCapitalize="false"
                autoCorrect="false"
                autoSave="false"
                autoFocus
                spellCheck={true}
                alignment={shape.style.textAlign}
                onContextMenu={stopPropagation}
                onCopy={stopPropagation}
                onPaste={stopPropagation}
                onCut={stopPropagation}
              />
            )} */}
          </StyledVideoContainer>
        </HTMLContainer>
      )
    }
  )

  Indicator = TDShapeUtil.Indicator<T>(({ shape }) => {
    const {
      size: [width, height],
    } = shape

    return (
      <rect x={0} y={0} rx={3} ry={3} width={Math.max(1, width)} height={Math.max(1, height)} />
    )
  })

  getBounds = (shape: T) => {
    return getBoundsRectangle(shape, this.boundsCache)
  }

  shouldRender = (prev: T, next: T) => {
    return next.size !== prev.size || next.style !== prev.style
  }

  transform = (
    shape: T,
    bounds: TLBounds,
    { scaleX, scaleY, transformOrigin }: TransformInfo<T>
  ): Partial<T> => {
    const point = Vec.toFixed([
      bounds.minX +
        (bounds.width - shape.size[0]) * (scaleX < 0 ? 1 - transformOrigin[0] : transformOrigin[0]),
      bounds.minY +
        (bounds.height - shape.size[1]) *
          (scaleY < 0 ? 1 - transformOrigin[1] : transformOrigin[1]),
    ])

    return {
      point,
    }
  }

  transformSingle = (shape: T): Partial<T> => {
    return shape
  }

  getSvgElement = (shape: T, isDarkMode: boolean): SVGElement | void => {
    const bounds = this.getBounds(shape)
    const textBounds = Utils.expandBounds(bounds, -PADDING)
    // const textElm = getTextSvgElement(shape.text, shape.style, textBounds)
    // const style = getStickyShapeStyle(shape.style, isDarkMode)
    // textElm.setAttribute('fill', style.color)
    // textElm.setAttribute('transform', `translate(${PADDING}, ${PADDING})`)

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', bounds.width + '')
    rect.setAttribute('height', bounds.height + '')
    // rect.setAttribute('fill', style.fill)
    rect.setAttribute('rx', '3')
    rect.setAttribute('ry', '3')

    g.appendChild(rect)
    // g.appendChild(textElm)

    return g
  }
}

/* -------------------------------------------------- */
/*                       Helpers                      */
/* -------------------------------------------------- */

const PADDING = 8
const MIN_CONTAINER_HEIGHT = 60

const StyledVideoContainer = styled('div', {
  pointerEvents: 'all',
  position: 'relative',
  backgroundColor: '#ddd',
  fontFamily: 'sans-serif',
  height: '100%',
  width: '100%',
  padding: PADDING + 'px',
  borderRadius: '3px',
  perspective: '800px',
  variants: {
    isGhost: {
      false: { opacity: 1 },
      true: { transition: 'opacity .2s', opacity: GHOSTED_OPACITY },
    },
    isDarkMode: {
      true: {
        boxShadow:
          '2px 3px 12px -2px rgba(0,0,0,.3), 1px 1px 4px rgba(0,0,0,.3), 1px 1px 2px rgba(0,0,0,.3)',
      },
      false: {
        boxShadow:
          '2px 3px 12px -2px rgba(0,0,0,.2), 1px 1px 4px rgba(0,0,0,.16),  1px 1px 2px rgba(0,0,0,.16)',
      },
    },
  },
})

const commonTextWrapping = {
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
}

const StyledText = styled('div', {
  position: 'absolute',
  top: PADDING,
  left: PADDING,
  width: `calc(100% - ${PADDING * 2}px)`,
  height: 'fit-content',
  font: 'inherit',
  pointerEvents: 'none',
  userSelect: 'none',
  variants: {
    isEditing: {
      true: {
        opacity: 1,
      },
      false: {
        opacity: 1,
      },
    },
    alignment: {
      [AlignStyle.Start]: {
        textAlign: 'left',
      },
      [AlignStyle.Middle]: {
        textAlign: 'center',
      },
      [AlignStyle.End]: {
        textAlign: 'right',
      },
      [AlignStyle.Justify]: {
        textAlign: 'justify',
      },
    },
  },
  ...commonTextWrapping,
})

const StyledTextArea = styled('textarea', {
  width: '100%',
  height: '100%',
  border: 'none',
  overflow: 'hidden',
  background: 'none',
  outline: 'none',
  textAlign: 'left',
  font: 'inherit',
  padding: 0,
  color: 'transparent',
  verticalAlign: 'top',
  resize: 'none',
  caretColor: 'black',
  ...commonTextWrapping,
  variants: {
    alignment: {
      [AlignStyle.Start]: {
        textAlign: 'left',
      },
      [AlignStyle.Middle]: {
        textAlign: 'center',
      },
      [AlignStyle.End]: {
        textAlign: 'right',
      },
      [AlignStyle.Justify]: {
        textAlign: 'justify',
      },
    },
  },
  '&:focus': {
    outline: 'none',
    border: 'none',
  },
})
