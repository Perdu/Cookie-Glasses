export function isElementHidden(element) {
  element.classList.contains('hidden');
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

export function createColumnWithTextContent(textContent) {
  const column = document.createElement('td');
  column.textContent = textContent;
  return column;
}

export function createLink(href, textContent) {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.innerText = textContent;
  return link;
}
