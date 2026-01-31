const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const loadConfig = async () => {
    // 1. Check if DATABASE_URL is already set (e.g. local .env)
    if (process.env.DATABASE_URL) {
        console.log('✅ Configuration loaded from environment variables');
        return;
    }

    // 2. Check for SSM Parameter Name
    const paramName = process.env.DB_SSM_PARAM_NAME;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!paramName) {
        console.warn('⚠️ No DATABASE_URL or DB_SSM_PARAM_NAME found. Database connection may fail.');
        return;
    }

    try {
        console.log(`⏳ Fetching configuration from AWS Parameter Store: ${paramName} (${region})...`);
        const client = new SSMClient({ region });
        const command = new GetParameterCommand({
            Name: paramName,
            WithDecryption: true
        });
        const response = await client.send(command);
        
        // Set the environment variable so standard pg Pool flows work
        process.env.DATABASE_URL = response.Parameter.Value;
        console.log('✅ Configuration successfully loaded from AWS SSM');
    } catch (error) {
        console.error('❌ Failed to fetch from AWS SSM:', error.message);
        throw error;
    }
};

module.exports = { loadConfig };
