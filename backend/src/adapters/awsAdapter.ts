import { EC2Client } from '@aws-sdk/client-ec2';
import { S3Client } from '@aws-sdk/client-s3';
import { ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { Route53Client } from '@aws-sdk/client-route-53';
import { IAMClient } from '@aws-sdk/client-iam';
import { RDSClient } from '@aws-sdk/client-rds';
import { ECSClient } from '@aws-sdk/client-ecs';
import { SESClient } from '@aws-sdk/client-ses';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { AWSAccount } from '../db';

export class AWSAdapter {
    private static stsClient = new STSClient({ region: 'us-east-1' });

    static async getCredentials(account: AWSAccount) {
        if (account.authMethod === 'KEYS') {
            if (!account.accessKeyId || !account.secretAccessKey) {
                throw new Error('Access Key or Secret Key missing for account');
            }
            return {
                accessKeyId: account.accessKeyId,
                secretAccessKey: account.secretAccessKey,
            };
        }

        if (account.authMethod === 'ROLE') {
            if (!account.roleArn || !account.externalId) {
                throw new Error('Role ARN or External ID missing for account');
            }
            const command = new AssumeRoleCommand({
                RoleArn: account.roleArn,
                ExternalId: account.externalId,
                RoleSessionName: 'CloudCorrectSession',
            });

            const response = await this.stsClient.send(command);

            if (!response.Credentials) {
                throw new Error('Failed to assume role');
            }

            return {
                accessKeyId: response.Credentials.AccessKeyId!,
                secretAccessKey: response.Credentials.SecretAccessKey!,
                sessionToken: response.Credentials.SessionToken!,
            };
        }

        throw new Error(`Unsupported auth method: ${account.authMethod}`);
    }

    static async getEC2Client(credentials: any, region: string) {
        return new EC2Client({ region, credentials });
    }

    static async getALBClient(credentials: any, region: string) {
        return new ElasticLoadBalancingV2Client({ region, credentials });
    }

    static async getRoute53Client(credentials: any) {
        return new Route53Client({ region: 'us-east-1', credentials });
    }

    static async getIAMClient(credentials: any) {
        return new IAMClient({ region: 'us-east-1', credentials });
    }

    static async getS3Client(credentials: any, region: string) {
        return new S3Client({ region, credentials });
    }

    static async getRDSClient(credentials: any, region: string) {
        return new RDSClient({ region, credentials });
    }

    static async getECSClient(credentials: any, region: string) {
        return new ECSClient({ region, credentials });
    }

    static async getSESClient(credentials: any, region: string) {
        return new SESClient({ region, credentials });
    }
}
