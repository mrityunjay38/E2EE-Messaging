import { generator, primeNumber } from "./utils";
const dhAlgo = (g = generator, x) => {
  return (g ^ x) % primeNumber;
};

export default dhAlgo;
