import { Router } from 'express';
import { InvariantGroup, Check, EvaluationRun, CheckResultLog, AWSAccount } from '../db';

const router = Router();

router.post('/', async (req, res) => {
    const { tenantId, awsAccountId, name, description, intervalMinutes, enabled, notificationEmails, checks } = req.body;

    try {
        const group = await InvariantGroup.create({
            tenantId,
            awsAccountId,
            name,
            description,
            intervalMinutes,
            enabled,
            notificationEmails,
        });

        if (checks && Array.isArray(checks)) {
            for (const checkData of checks) {
                await Check.create({
                    groupId: group.id,
                    ...checkData,
                });
            }
        }

        const result = await InvariantGroup.findByPk(group.id, {
            include: [{ model: Check, as: 'checks' }],
        });

        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/detail/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const group = await InvariantGroup.findByPk(id, {
            include: [
                { model: Check, as: 'checks' },
                { model: AWSAccount }
            ],
            order: [[{ model: Check, as: 'checks' }, 'createdAt', 'ASC']]
        });
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    try {
        const groups = await InvariantGroup.findAll({
            where: { tenantId },
            include: [{ model: Check, as: 'checks' }],
            order: [
                ['enabled', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });
        res.json(groups);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const group = await InvariantGroup.findByPk(id);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        await group.update(req.body);
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/checks', async (req, res) => {
    const { id } = req.params;
    try {
        const group = await InvariantGroup.findByPk(id);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const check = await Check.create({
            groupId: id,
            ...req.body,
        });

        res.status(201).json(check);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:groupId/checks/:checkId', async (req, res) => {
    const { groupId, checkId } = req.params;
    try {
        const check = await Check.findOne({
            where: { id: checkId, groupId },
        });

        if (!check) {
            return res.status(404).json({ error: 'Check not found' });
        }

        // Clear alias so it can be reused
        await check.update({ alias: null });
        await check.destroy();
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        const group = await InvariantGroup.findByPk(id);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        group.enabled = !group.enabled;
        await group.save();
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:groupId/checks/:checkId', async (req, res) => {
    try {
        const { groupId, checkId } = req.params;
        const { service, type, scope, region, parameters, alias } = req.body;

        const check = await Check.findOne({ where: { id: checkId, groupId } });
        if (!check) return res.status(404).json({ error: 'Check not found' });

        await check.update({
            service,
            type,
            scope,
            region,
            parameters,
            alias
        });

        res.json(check);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update check' });
    }
});

router.get('/:id/history', async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
        const { count, rows } = await EvaluationRun.findAndCountAll({
            where: { groupId: id },
            order: [['evaluatedAt', 'DESC']],
            limit,
            offset,
            distinct: true,
            include: [{
                model: CheckResultLog,
                as: 'results',
                include: [{
                    model: Check,
                    as: 'check',
                    paranoid: false // Include soft-deleted checks in historical logs
                }]
            }],
        });
        res.json({
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/evaluate', async (req, res) => {
    const { id } = req.params;
    try {
        const { evaluateGroup } = require('../services/evaluationService');
        const result = await evaluateGroup(id);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
