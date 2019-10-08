export const render = (container, child) => {
  while (container.firstChild) {
    container.firstChild.remove();
  }
  container.appendChild(child);
};

export const reduceChildren = (children, vnode) => {
  if (Array.isArray(vnode)) {
    children = [...children, ...vnode.reduce(reduceChildren, [])];
  } else {
    children.push(vnode);
  }
  return children;
};

export const jsxToDom = (element, props, ...children) => {
  const el =
    typeof element === 'function'
      ? element(props)
      : document.createElement(element);

  if (props) {
    for (let key of Object.keys(props)) {
      const eventName = key.match(/^on([A-Z]\w+)$/);
      if (eventName) {
        el.addEventListener(eventName[1].toLowerCase(), props[key]);
      } else if (typeof props[key] === 'boolean') {
        el[key] = props[key];
      } else {
        el.setAttribute(key, props[key]);
      }
    }
  }

  children = children.reduce(reduceChildren, []);
  for (let child of children) {
    if (child) {
      el.appendChild(
        child instanceof HTMLElement ? child : document.createTextNode(child)
      );
    }
  }

  return el;
};

export const fetchJSON = url => fetch(url).then(response => response.json());
