import { AWSAccount } from '../db';

interface OnboardParams {
    tenantId: string;
    awsAccountId: string;
    name: string;
    authMethod: 'ROLE' | 'KEYS';
    roleArn?: string;
    externalId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
}

export const onboardAWSAccount = async (params: OnboardParams) => {
    const { tenantId, awsAccountId, name, authMethod } = params;

    // Check if account already exists for another tenant
    const existingAccount = await AWSAccount.findOne({
        where: { awsAccountId },
    });

    if (existingAccount && existingAccount.tenantId !== tenantId) {
        throw new Error('This AWS Account is already associated with another tenant');
    }

    const account = await AWSAccount.create({
        tenantId,
        awsAccountId,
        name,
        authMethod,
        roleArn: params.roleArn,
        externalId: params.externalId,
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
        region: params.region || 'us-east-1',
    });

    return account;
};

export const generateCloudFormationUrl = (tenantId: string, externalId: string) => {
    const stackName = 'CloudCorrect-ReadOnly-Role';
    // Updated path to point to a more descriptive (mock) URL
    const templatePath = 'https://cloudcorrect-templates.s3.amazonaws.com/cloudcorrect-readonly-role.yaml';

    return `https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?stackName=${stackName}&templateURL=${templatePath}&param_ExternalId=${externalId}&param_TenantId=${tenantId}`;
};
