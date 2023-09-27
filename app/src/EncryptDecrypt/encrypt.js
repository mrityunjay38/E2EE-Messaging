import AES from "crypto-js/aes";

const encrypt = (message, key) => {
  return Promise((resolve, reject) => {
    try {
      const encryptedMessage = AES.encrypt(message, key?.toString()).toString();
      resolve(encryptedMessage);
    } catch (err) {
      reject(err);
    }
  });
};

export default encrypt;
