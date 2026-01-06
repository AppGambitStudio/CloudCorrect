import { Router } from 'express';
import { onboardAWSAccount } from '../services/awsAccountService';
import { AWSAccount } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', async (req, res) => {
    const {
        tenantId,
        awsAccountId,
        name,
        authMethod,
        roleArn,
        externalId,
        accessKeyId,
        secretAccessKey,
        region
    } = req.body;

    try {
        const account = await onboardAWSAccount({
            tenantId,
            awsAccountId,
            name,
            authMethod,
            roleArn,
            externalId: externalId || (authMethod === 'ROLE' ? uuidv4() : undefined),
            accessKeyId,
            secretAccessKey,
            region
        });
        res.status(201).json(account);
    } catch (error: any) {
        console.error('Onboarding error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    try {
        const accounts = await AWSAccount.findAll({
            where: { tenantId },
        });
        res.json(accounts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
