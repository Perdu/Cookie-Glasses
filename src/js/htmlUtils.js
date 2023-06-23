export function isElementHidden(element) {
  return element.classList.contains('hidden');
}

export function hideElement(elementId) {
  document.getElementById(elementId).classList.add('hidden');
}

export function showHiddenElement(elementId) {
  document.getElementById(elementId).classList.remove('hidden');
}

export function createColumnWithChild(child) {
  const column = document.createElement('td');
  column.appendChild(child);
  return column;
}

export function createColumnWithTextContent(textContent, className) {
  const column = document.createElement('td');
  column.textContent = textContent;
  column.classList.add(className);
  return column;
}

export function createLink(href, textContent) {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.innerText = textContent;
  return link;
}
