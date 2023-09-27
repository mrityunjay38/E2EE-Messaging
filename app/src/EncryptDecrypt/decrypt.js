import { enc } from "crypto-js";
import AES from "crypto-js/aes";

const decrypt = (message, key) => {
  console.log(key);
  return new Promise((resolve, reject) => {
    try {
      const decryptedMessage = AES.decrypt(message, key?.toString()).toString(
        enc.Utf8
      );
      resolve(decryptedMessage);
    } catch (err) {
      reject(err);
    }
  });
};

export default decrypt;
