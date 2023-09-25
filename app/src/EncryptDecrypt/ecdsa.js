const { subtle } = window.crypto;

async function generateKey(namedCurve = "P-256") {
  const { publicKey, privateKey } = await subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve,
    },
    true,
    ["sign", "verify"]
  );

  console.log(publicKey, privateKey);

  return Promise.resolve({ publicKey, privateKey });
}

export default generateKey;
