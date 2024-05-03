function getMarkoWebsiteKey(key) {
  return `markojs-website:${key}`;
}

export function get(key) {
  return localStorage.getItem(getMarkoWebsiteKey(key));
}

export function set(key, value) {
  return localStorage.setItem(getMarkoWebsiteKey(key), value);
}

export {getMarkoWebsiteKey};
