const render = (container, child) => {
  while (container.firstChild) {
    container.firstChild.remove()
  }
  container.appendChild(child)
}

const reduceChildren = (children, vnode) => {
  if (Array.isArray(vnode)) {
    children = [...children, ...(vnode.reduce(reduceChildren, []))]
  } else {
    children.push(vnode)
  }
  return children
}

const jsxToDom = (element, props, ...children) => {
  const el = typeof element === 'function' ? element(props) : document.createElement(element)

  if (props) {
    for (let key of Object.keys(props)) {
      const eventName = key.match(/^on([A-Z]\w+)$/)
      if (eventName) {
        el.addEventListener(eventName[1].toLowerCase(), props[key])
      } else {
        el.setAttribute(key, props[key])
      }
    }
  }

  children = children.reduce(reduceChildren, [])
  for (let child of children) {
    if (child) {
      el.appendChild(child instanceof HTMLElement
        ? child
        : document.createTextNode(child)
      )
    }
  }

  return el
}

const currencyMask = value => {
  const valueAsString = String(parseFloat(value).toFixed(2))
  const [ intValue, decimalValue ] = valueAsString.split('.')
  const groups = []
  let consumed = intValue
  while (consumed.length > 3) {
    groups.unshift(consumed.substr(-3))
    consumed = consumed.slice(0, -3)
  }
  groups.unshift(consumed)
  return 'R$ ' + groups.join('.') + ',' + decimalValue
}

const areaMask = value => {
  return String(value).replace('.', ',') + ' m²'
}

const fetchJSON = url => fetch(url).then(response => response.json())
