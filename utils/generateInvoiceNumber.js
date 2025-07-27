function generateInvoiceNumber(item) {
  // Simple invoice generator: "INV-" + timestamp + random 4 digits
  const timestamp = Date.now();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}-${randomDigits}`;
}

module.exports = { generateInvoiceNumber };
