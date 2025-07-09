export function randomNum() {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  return randomBuffer[0] / (0xffffffff + 1);
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomNum() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}