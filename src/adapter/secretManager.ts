import { SecretsManager } from "aws-sdk";
import AWS from "aws-sdk";

AWS.config.update({
	region: process.env.NEXT_PUBLIC_AWS_REGION,
	accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
});

export const getSecret = async (secretName: string): Promise<any> => {
	const secretsManager = new SecretsManager();

	const params = {
		SecretId: secretName,
	};

	try {
		const data = await secretsManager.getSecretValue(params).promise();
		if (data.SecretString) {
			return data.SecretString;
		} else if (data.SecretBinary) {
			const binarySecret = Buffer.from(data.SecretBinary.toString(), "base64");
			return binarySecret;
		}
	} catch (error) {
		console.error(`Erro ao obter o segredo ${secretName}:`, error);
		throw error;
	}
};
