const { subtle } = window.crypto;

async function decrypt(message, privateKey) {
  console.log(privateKey);
  const decryptedData = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    message
  );

  const text = new TextDecoder();
  const payload = text.decode(decryptedData);

  return Promise.resolve(payload);
}

export default decrypt;
