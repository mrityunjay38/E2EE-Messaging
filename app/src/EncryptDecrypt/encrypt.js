const { subtle } = window.crypto;

async function encrypt(message, publicKey) {
    console.log(publicKey);
  const payload = message;
  const text = new TextEncoder();
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    text.encode(payload)
  );

  return Promise.resolve(encryptedData);
}

export default encrypt;
