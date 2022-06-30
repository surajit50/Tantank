import * as React from 'react'
export * from '@tanstack/table-core'

import {
  createTable,
  TableOptions,
  TableOptionsResolved,
  RowData,
} from '@tanstack/table-core'

export type Renderable<TProps> =
  | React.ReactNode
  | React.FunctionComponent<TProps>
  | React.Component<TProps>

//

export function flexRender<TProps extends object>(
  Comp: Renderable<TProps>,
  props: TProps
): React.ReactNode | JSX.Element {
  return !Comp ? null : isReactComponent(Comp) ? <Comp {...props} /> : Comp
}

function isReactComponent(component: unknown): component is React.FC {
  return (
    isClassComponent(component) ||
    typeof component === 'function' ||
    isExoticComponent(component)
  )
}

function isClassComponent(component: any) {
  return (
    typeof component === 'function' &&
    (() => {
      const proto = Object.getPrototypeOf(component)
      return proto.prototype && proto.prototype.isReactComponent
    })()
  )
}

function isExoticComponent(component: any) {
  return (
    typeof component === 'object' &&
    typeof component.$$typeof === 'symbol' &&
    ['react.memo', 'react.forward_ref'].includes(component.$$typeof.description)
  )
}

export function useReactTable<TData extends RowData>(
  options: TableOptions<TData>
) {
  // Compose in the generic options to the user options
  const resolvedOptions: TableOptionsResolved<TData> = {
    state: {}, // Dummy state
    onStateChange: () => {}, // noop
    renderFallbackValue: null,
    ...options,
  }

  // Create a new table and store it in state
  const [instanceRef] = React.useState(() => ({
    current: createTable<TData>(resolvedOptions),
  }))

  // By default, manage table state here using the instance's initial state
  const [state, setState] = React.useState(
    () => instanceRef.current.initialState
  )

  // Compose the default state above with any user state. This will allow the user
  // to only control a subset of the state if desired.
  instanceRef.current.setOptions(prev => ({
    ...prev,
    ...options,
    state: {
      ...state,
      ...options.state,
    },
    // Similarly, we'll maintain both our internal state and any user-provided
    // state.
    onStateChange: updater => {
      setState(updater)
      options.onStateChange?.(updater)
    },
  }))

  return instanceRef.current
}
