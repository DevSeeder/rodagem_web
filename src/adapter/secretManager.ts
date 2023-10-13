import { SecretsManager } from "aws-sdk";

export const getSecret = async (secretName: string): Promise<any> => {
	const secretsManager = new SecretsManager();

	const params = {
		SecretId: secretName,
	};

	try {
		const data = await secretsManager.getSecretValue(params).promise();
		if (data.SecretString) {
			return JSON.parse(data.SecretString);
		} else if (data.SecretBinary) {
			const binarySecret = Buffer.from(data.SecretBinary.toString(), "base64");
			return binarySecret;
		}
	} catch (error) {
		console.error(`Erro ao obter o segredo ${secretName}:`, error);
		throw error;
	}
};
