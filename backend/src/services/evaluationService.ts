import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeTargetHealthCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { Route53Client, ListResourceRecordSetsCommand } from '@aws-sdk/client-route-53';
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { S3Client, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { ECSClient, DescribeClustersCommand, DescribeServicesCommand } from '@aws-sdk/client-ecs';
import { AWSAdapter } from '../adapters/awsAdapter';
import { Check, InvariantGroup, AWSAccount, EvaluationRun, CheckResultLog } from '../db';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CheckResult {
    checkId: string;
    alias?: string;
    status: 'PASS' | 'FAIL';
    expected: string;
    observed: string;
    reason: string;
    data?: any; // Machine-readable data for dependencies (e.g., { publicIp: '...' })
}

export const evaluateCheck = async (check: Check, account: AWSAccount, context: Record<string, any> = {}): Promise<CheckResult> => {
    const credentials = await AWSAdapter.getCredentials(account);

    // Resolve placeholders in parameters
    const { resolved: resolvedParameters, resolutions } = resolvePlaceholders(check.parameters, context);
    const checkWithResolvedParams = { ...check.get({ plain: true }), parameters: resolvedParameters } as Check;

    try {
        let result: CheckResult;
        switch (check.service) {
            case 'EC2':
                result = await evaluateEC2Check(checkWithResolvedParams, credentials);
                break;
            case 'ALB':
                result = await evaluateALBCheck(checkWithResolvedParams, credentials);
                break;
            case 'Route53':
                result = await evaluateRoute53Check(checkWithResolvedParams, credentials);
                break;
            case 'IAM':
                result = await evaluateIAMCheck(checkWithResolvedParams, credentials);
                break;
            case 'S3':
                result = await evaluateS3Check(checkWithResolvedParams, credentials);
                break;
            case 'RDS':
                result = await evaluateRDSCheck(checkWithResolvedParams, credentials);
                break;
            case 'ECS':
                result = await evaluateECSCheck(checkWithResolvedParams, credentials);
                break;
            case 'NETWORK':
                if (check.type === 'PING') {
                    result = await evaluatePingCheck(checkWithResolvedParams);
                } else if (check.type === 'HTTP_200') {
                    result = await evaluateHTTPCheck(checkWithResolvedParams);
                } else {
                    throw new Error(`Unsupported network check type: ${check.type}`);
                }
                break;
            default:
                throw new Error(`Unsupported service: ${check.service}`);
        }

        // Add placeholder info to expected string if resolutions happened
        if (resolutions.length > 0) {
            result.expected = `${result.expected} (resolved from ${resolutions.join(', ')})`;
        }

        return result;
    } catch (error: any) {
        return {
            checkId: check.id,
            alias: check.alias,
            status: 'FAIL',
            expected: 'Successful API call',
            observed: 'API error',
            reason: error.message,
        };
    }
};

function resolvePlaceholders(parameters: any, context: Record<string, any>): { resolved: any, resolutions: string[] } {
    const resolutions: string[] = [];
    if (typeof parameters !== 'object' || parameters === null) return { resolved: parameters, resolutions };

    const result = Array.isArray(parameters) ? [...parameters] : { ...parameters };

    for (const key in result) {
        if (typeof result[key] === 'string') {
            // Match {{alias.property}}
            const matches = result[key].match(/\{\{([^}]+)\}\}/g);
            if (matches) {
                let replaced = result[key];
                for (const match of matches) {
                    const path = match.slice(2, -2).trim();
                    const [alias, property] = path.split('.');
                    const contextAlias = context[alias];
                    let value = undefined;
                    if (contextAlias) {
                        // Case-insensitive property lookup
                        const foundKey = Object.keys(contextAlias).find(k => k.toLowerCase() === property.toLowerCase());
                        if (foundKey) {
                            value = contextAlias[foundKey];
                        }
                    }
                    if (value !== undefined) {
                        replaced = replaced.replace(match, value);
                        if (!resolutions.includes(match)) resolutions.push(match);
                    }
                }
                result[key] = replaced;
            }
        } else if (typeof result[key] === 'object') {
            const childResult = resolvePlaceholders(result[key], context);
            result[key] = childResult.resolved;
            childResult.resolutions.forEach(res => {
                if (!resolutions.includes(res)) resolutions.push(res);
            });
        }
    }
    return { resolved: result, resolutions };
}

async function evaluateEC2Check(check: Check, credentials: any): Promise<CheckResult> {
    const client = await AWSAdapter.getEC2Client(credentials, check.region!);
    const { instanceId } = check.parameters;

    const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
    const response = await client.send(command);
    const instance = response.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
        return {
            checkId: check.id,
            status: 'FAIL',
            expected: check.type === 'INSTANCE_RUNNING' ? 'instance.state == running' : 'instance has public ip',
            observed: 'instance not found',
            reason: `EC2 instance ${instanceId} not found in ${check.region}`,
        };
    }

    const state = instance.State?.Name;
    const publicIp = instance.PublicIpAddress;
    const privateIp = instance.PrivateIpAddress;
    const instanceType = instance.InstanceType;
    const az = instance.Placement?.AvailabilityZone;
    const vpcId = instance.VpcId;
    const subnetId = instance.SubnetId;
    const nameTag = instance.Tags?.find(t => t.Key === 'Name')?.Value || 'Unnamed';

    // Detailed evidence string for history view
    const evidence = `ID: ${instanceId} | Name: ${nameTag} | State: ${state} | Type: ${instanceType} | AZ: ${az} | Public IP: ${publicIp || 'None'}`;

    if (check.type === 'INSTANCE_RUNNING') {
        return {
            checkId: check.id,
            alias: check.alias,
            status: state === 'running' ? 'PASS' : 'FAIL',
            expected: 'instance.state == running',
            observed: evidence,
            reason: state === 'running' ? `EC2 instance ${nameTag} (${instanceId}) is running` : `EC2 instance ${nameTag} (${instanceId}) is ${state}`,
            data: { instanceId, publicIp, privateIp, state, name: nameTag, instanceType, az, vpcId, subnetId }
        };
    }

    if (check.type === 'INSTANCE_HAS_PUBLIC_IP') {
        return {
            checkId: check.id,
            alias: check.alias,
            status: !!publicIp ? 'PASS' : 'FAIL',
            expected: 'instance has public ip',
            observed: evidence,
            reason: publicIp ? `EC2 instance ${nameTag} has public IP ${publicIp}` : `EC2 instance ${nameTag} has no public IP`,
            data: { instanceId, publicIp, privateIp, state, name: nameTag, instanceType, az, vpcId, subnetId }
        };
    }

    throw new Error(`Unsupported EC2 check type: ${check.type}`);
}

async function evaluateALBCheck(check: Check, credentials: any): Promise<CheckResult> {
    const client = await AWSAdapter.getALBClient(credentials, check.region!);
    const { targetGroupArn } = check.parameters;

    if (check.type === 'TARGET_GROUP_HEALTHY') {
        const command = new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn });
        const response = await client.send(command);
        const healthyTargets = response.TargetHealthDescriptions?.filter(t => t.TargetHealth?.State === 'healthy') || [];
        const totalTargets = response.TargetHealthDescriptions?.length || 0;

        const targetIds = healthyTargets.slice(0, 5).map(t => t.Target?.Id).join(', ') + (healthyTargets.length > 5 ? '...' : '');
        const evidence = `Healthy: ${healthyTargets.length}/${totalTargets} targets | IDs: ${targetIds || 'none'}`;

        return {
            checkId: check.id,
            alias: check.alias,
            status: healthyTargets.length > 0 ? 'PASS' : 'FAIL',
            expected: 'target group has >=1 healthy target',
            observed: evidence,
            reason: healthyTargets.length > 0 ? `Target group is healthy with ${healthyTargets.length} targets` : 'Target group has no healthy targets',
            data: { healthyCount: healthyTargets.length, totalCount: totalTargets, targetIds: healthyTargets.map(t => t.Target?.Id), targetGroupArn }
        };
    }

    throw new Error(`Unsupported ALB check type: ${check.type}`);
}

async function evaluateRoute53Check(check: Check, credentials: any): Promise<CheckResult> {
    const client = await AWSAdapter.getRoute53Client(credentials);
    const { recordName, expectedValue, hostedZoneId } = check.parameters;

    if (check.type === 'DNS_POINTS_TO') {
        const command = new ListResourceRecordSetsCommand({
            HostedZoneId: hostedZoneId,
            StartRecordName: recordName,
            MaxItems: 1,
        });
        const response = await client.send(command);
        const record = response.ResourceRecordSets?.find(r => r.Name === recordName || r.Name === `${recordName}.`);
        const values = record?.ResourceRecords?.map(v => v.Value) || [];
        const aliasValue = record?.AliasTarget?.DNSName;

        const matched = values.includes(expectedValue) || aliasValue?.includes(expectedValue);

        return {
            checkId: check.id,
            alias: check.alias,
            status: matched ? 'PASS' : 'FAIL',
            expected: `DNS record ${recordName} points to ${expectedValue}`,
            observed: `DNS record points to ${values.join(', ') || aliasValue || 'unknown'}`,
            reason: matched ? 'DNS record matches expected value' : 'DNS record does not match expected value',
            data: { recordName, values, aliasValue, type: record?.Type, ttl: record?.TTL, hostedZoneId }
        };
    }

    throw new Error(`Unsupported Route53 check type: ${check.type}`);
}

async function evaluateIAMCheck(check: Check, credentials: any): Promise<CheckResult> {
    const client = await AWSAdapter.getIAMClient(credentials);
    const { roleName, policyArn } = check.parameters;

    if (check.type === 'ROLE_EXISTS') {
        try {
            const command = new GetRoleCommand({ RoleName: roleName });
            const response = await client.send(command);
            return {
                checkId: check.id,
                alias: check.alias,
                status: 'PASS',
                expected: `IAM role ${roleName} exists`,
                observed: 'Role found',
                reason: 'IAM role exists',
                data: { roleName, arn: response.Role?.Arn, path: response.Role?.Path, createDate: response.Role?.CreateDate }
            };
        } catch (error: any) {
            return {
                checkId: check.id,
                alias: check.alias,
                status: 'FAIL',
                expected: `IAM role ${roleName} exists`,
                observed: 'Role not found',
                reason: error.message,
                data: { roleName }
            };
        }
    }

    if (check.type === 'ROLE_HAS_POLICY') {
        const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
        const response = await client.send(command);
        const hasPolicy = response.AttachedPolicies?.some(p => p.PolicyArn === policyArn);

        return {
            checkId: check.id,
            alias: check.alias,
            status: hasPolicy ? 'PASS' : 'FAIL',
            expected: `IAM role has policy ${policyArn} attached`,
            observed: hasPolicy ? 'Policy found' : 'Policy not found',
            reason: hasPolicy ? 'IAM role has the required policy' : 'IAM role is missing the required policy',
            data: { roleName, policyArn, attachedPolicies: response.AttachedPolicies }
        };
    }

    throw new Error(`Unsupported IAM check type: ${check.type}`);
}

async function evaluateS3Check(check: Check, credentials: any): Promise<CheckResult> {
    const { bucketName } = check.parameters;
    const client = await AWSAdapter.getS3Client(credentials, check.region || 'us-east-1');

    if (check.type === 'S3_LIFECYCLE_CONFIGURED') {
        try {
            const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
            const response = await client.send(command);
            const hasRules = (response.Rules?.length || 0) > 0;

            return {
                checkId: check.id,
                alias: check.alias,
                status: hasRules ? 'PASS' : 'FAIL',
                expected: `S3 bucket ${bucketName} has lifecycle rules`,
                observed: hasRules ? `${response.Rules?.length} rules found` : 'No lifecycle rules found',
                reason: hasRules ? 'Lifecycle policy is active' : 'Bucket missing lifecycle configuration',
                data: { bucketName, rulesCount: response.Rules?.length || 0, region: check.region || 'us-east-1' }
            };
        } catch (error: any) {
            return {
                checkId: check.id,
                alias: check.alias,
                status: 'FAIL',
                expected: `S3 bucket ${bucketName} has lifecycle rules`,
                observed: 'Error fetching configuration',
                reason: error.message,
                data: { bucketName }
            };
        }
    }

    throw new Error(`Unsupported S3 check type: ${check.type}`);
}

async function evaluateRDSCheck(check: Check, credentials: any): Promise<CheckResult> {
    const { dbInstanceIdentifier } = check.parameters;
    const client = await AWSAdapter.getRDSClient(credentials, check.region || 'us-east-1');

    try {
        const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceIdentifier });
        const response = await client.send(command);
        const dbInstance = response.DBInstances?.[0];

        if (!dbInstance) {
            return {
                checkId: check.id,
                status: 'FAIL',
                expected: 'RDS instance exists',
                observed: 'Not found',
                reason: `RDS instance ${dbInstanceIdentifier} not found`,
            };
        }

        const state = dbInstance.DBInstanceStatus;
        const publicAccess = dbInstance.PubliclyAccessible;
        const encrypted = dbInstance.StorageEncrypted;
        const engine = dbInstance.Engine;
        const instanceClass = dbInstance.DBInstanceClass;

        const evidence = `Status: ${state} | Public: ${publicAccess} | Encrypted: ${encrypted} | Engine: ${engine} | Class: ${instanceClass}`;

        if (check.type === 'RDS_INSTANCE_AVAILABLE') {
            return {
                checkId: check.id,
                alias: check.alias,
                status: state === 'available' ? 'PASS' : 'FAIL',
                expected: 'status == available',
                observed: evidence,
                reason: state === 'available' ? `RDS instance is available` : `RDS instance is ${state}`,
                data: { dbInstanceIdentifier, state, publicAccess, encrypted, engine, instanceClass }
            };
        }

        if (check.type === 'RDS_PUBLIC_ACCESS_DISABLED') {
            return {
                checkId: check.id,
                alias: check.alias,
                status: !publicAccess ? 'PASS' : 'FAIL',
                expected: 'PubliclyAccessible == false',
                observed: evidence,
                reason: !publicAccess ? `RDS instance is not publicly accessible` : `RDS instance IS publicly accessible`,
                data: { dbInstanceIdentifier, state, publicAccess, encrypted, engine, instanceClass }
            };
        }

        if (check.type === 'RDS_ENCRYPTION_ENABLED') {
            return {
                checkId: check.id,
                alias: check.alias,
                status: encrypted ? 'PASS' : 'FAIL',
                expected: 'StorageEncrypted == true',
                observed: evidence,
                reason: encrypted ? `RDS storage is encrypted` : `RDS storage is NOT encrypted`,
                data: { dbInstanceIdentifier, state, publicAccess, encrypted, engine, instanceClass }
            };
        }

        throw new Error(`Unsupported RDS check type: ${check.type}`);
    } catch (error: any) {
        return {
            checkId: check.id,
            status: 'FAIL',
            expected: 'Successful RDS API call',
            observed: 'API Error',
            reason: error.message,
        };
    }
}

async function evaluateECSCheck(check: Check, credentials: any): Promise<CheckResult> {
    const client = await AWSAdapter.getECSClient(credentials, check.region || 'us-east-1');

    try {
        if (check.type === 'ECS_CLUSTER_ACTIVE') {
            const { clusterName } = check.parameters;
            const command = new DescribeClustersCommand({ clusters: [clusterName] });
            const response = await client.send(command);
            const cluster = response.clusters?.[0];

            if (!cluster) {
                return {
                    checkId: check.id,
                    status: 'FAIL',
                    expected: 'ECS cluster exists',
                    observed: 'Not found',
                    reason: `ECS cluster ${clusterName} not found`,
                };
            }

            const status = cluster.status;
            const services = cluster.activeServicesCount;
            const tasks = cluster.runningTasksCount;
            const evidence = `Status: ${status} | Services: ${services} | Tasks: ${tasks}`;

            return {
                checkId: check.id,
                alias: check.alias,
                status: status === 'ACTIVE' ? 'PASS' : 'FAIL',
                expected: 'status == ACTIVE',
                observed: evidence,
                reason: status === 'ACTIVE' ? `ECS cluster is active` : `ECS cluster is ${status}`,
                data: { clusterName, status, services, tasks }
            };
        }

        if (check.type === 'ECS_SERVICE_RUNNING') {
            const { clusterName, serviceName } = check.parameters;
            const command = new DescribeServicesCommand({ cluster: clusterName, services: [serviceName] });
            const response = await client.send(command);
            const service = response.services?.[0];

            if (!service) {
                return {
                    checkId: check.id,
                    status: 'FAIL',
                    expected: 'ECS service exists',
                    observed: 'Not found',
                    reason: `ECS service ${serviceName} not found in cluster ${clusterName}`,
                };
            }

            const running = service.runningCount;
            const desired = service.desiredCount;
            const status = service.status;
            const evidence = `Status: ${status} | Running: ${running}/${desired} tasks`;

            return {
                checkId: check.id,
                alias: check.alias,
                status: (running !== undefined && desired !== undefined && running >= desired && status === 'ACTIVE') ? 'PASS' : 'FAIL',
                expected: `runningCount >= desiredCount (${desired})`,
                observed: evidence,
                reason: (running !== undefined && desired !== undefined && running >= desired) ? `ECS service is healthy` : `ECS service has insufficient tasks`,
                data: { clusterName, serviceName, running, desired, status }
            };
        }

        throw new Error(`Unsupported ECS check type: ${check.type}`);
    } catch (error: any) {
        return {
            checkId: check.id,
            status: 'FAIL',
            expected: 'Successful ECS API call',
            observed: 'API Error',
            reason: error.message,
        };
    }
}

async function evaluatePingCheck(check: Check): Promise<CheckResult> {
    const { target } = check.parameters;
    const start = Date.now();
    try {
        // macOS/Linux ping -c 1. For Windows it would be -n 1.
        const { stdout } = await execAsync(`ping -c 1 -W 2 ${target}`);
        const latencyMatch = stdout.match(/time=([\d\.]+)\s+ms/);
        const latency = latencyMatch ? parseFloat(latencyMatch[1]) : 0;

        return {
            checkId: check.id,
            alias: check.alias,
            status: 'PASS',
            expected: `Ping ${target} responds`,
            observed: `Response in ${latency}ms`,
            reason: 'ICMP echo received',
            data: { target, latency }
        };
    } catch (error: any) {
        return {
            checkId: check.id,
            alias: check.alias,
            status: 'FAIL',
            expected: `Ping ${target} responds`,
            observed: 'No response',
            reason: 'Request timed out or host unreachable',
            data: { target }
        };
    }
}

async function evaluateHTTPCheck(check: Check): Promise<CheckResult> {
    const { url } = check.parameters;
    const start = Date.now();
    try {
        const response = await axios.get(url, { timeout: 5000 });
        const latency = Date.now() - start;

        return {
            checkId: check.id,
            alias: check.alias,
            status: response.status === 200 ? 'PASS' : 'FAIL',
            expected: `HTTP GET ${url} returns 200 OK`,
            observed: `Status ${response.status} (${latency}ms)`,
            reason: response.status === 200 ? 'Service returned healthy status' : `Service returned ${response.status}`,
            data: { url, status: response.status, latency, contentType: response.headers['content-type'], server: response.headers['server'] }
        };
    } catch (error: any) {
        const latency = Date.now() - start;
        return {
            checkId: check.id,
            alias: check.alias,
            status: 'FAIL',
            expected: `HTTP GET ${url} returns 200 OK`,
            observed: error.response?.status ? `Status ${error.response.status}` : 'Request failed',
            reason: error.message,
            data: { url, status: error.response?.status, error: error.message, latency }
        };
    }
}

export const evaluateGroup = async (groupId: string) => {
    const group = await InvariantGroup.findByPk(groupId, {
        include: [{ model: Check, as: 'checks' }, { model: AWSAccount }],
        order: [[{ model: Check, as: 'checks' }, 'createdAt', 'ASC']]
    });

    if (!group || !group.AWSAccount) {
        throw new Error('Group or associated AWS Account not found');
    }

    const results: CheckResult[] = [];
    const context: Record<string, any> = {};

    for (const check of (group as any).checks) {
        const result = await evaluateCheck(check, (group as any).AWSAccount, context);
        results.push(result);

        // Populate context if alias is present
        if (check.alias && result.data) {
            context[check.alias] = result.data;
        }
    }

    const allPassed = results.every(r => r.status === 'PASS');
    const newStatus = allPassed ? 'PASS' : 'FAIL';

    const oldStatus = group.lastStatus;
    group.lastStatus = newStatus;
    group.lastEvaluatedAt = new Date();
    await group.save();

    // Persist History
    const run = await EvaluationRun.create({
        groupId: group.id,
        status: newStatus,
        evaluatedAt: group.lastEvaluatedAt,
    });

    for (const res of results) {
        await CheckResultLog.create({
            runId: run.id,
            checkId: res.checkId,
            status: res.status,
            expected: res.expected,
            observed: res.observed,
            reason: res.reason,
        });
    }

    return {
        groupId: group.id,
        status: newStatus,
        oldStatus,
        results,
        changed: oldStatus !== newStatus && oldStatus !== 'PENDING',
    };
};
