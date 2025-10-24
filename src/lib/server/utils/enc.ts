import crypto from 'crypto';
function encrypt(text: string, salt: string): string {
	// Create a key from session ID
	const key = crypto.scryptSync(salt, 'salt', 32);
	const iv = crypto.randomBytes(16);

	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	// Return IV + encrypted data
	return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string, salt: string): string | null {
	try {
		// Split IV and encrypted data
		const parts = encryptedData.split(':');
		if (parts.length !== 2) {
			return null;
		}

		const [ivHex, encrypted] = parts;

		// Derive the same key from session ID
		const key = crypto.scryptSync(salt, 'salt', 32);
		const iv = Buffer.from(ivHex, 'hex');

		// Create decipher
		const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

		// Decrypt the data
		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	} catch {
		return null;
	}
}

export { encrypt, decrypt };
