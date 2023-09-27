const { crypto } = window;

export const generator = 5;
export const primeNumber = 63620261756108790361;
export const secret = () => {
  const arr = new Uint32Array(1);
  const [randValue] = crypto.getRandomValues(arr);
  return randValue;
};
