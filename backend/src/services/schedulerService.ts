import cron from 'node-cron';
import { InvariantGroup } from '../db';
import { evaluateGroup } from './evaluationService';
import { dispatchAlert } from './alertService';

export const initScheduler = () => {
    // Run every minute to check which groups need evaluation
    cron.schedule('* * * * *', async () => {
        console.log('Running scheduler tick...');
        const now = new Date();

        try {
            const groups = await InvariantGroup.findAll({
                where: { enabled: true },
            });

            for (const group of groups) {
                const lastRun = group.lastEvaluatedAt ? new Date(group.lastEvaluatedAt) : new Date(0);
                const nextRun = new Date(lastRun.getTime() + group.intervalMinutes * 60000);

                if (now >= nextRun) {
                    console.log(`Evaluating group: ${group.name}`);
                    try {
                        const result = await evaluateGroup(group.id);
                        if (result.changed || result.status === 'FAIL') {
                            if (result.changed) {
                                console.log(`ALERT: Group ${group.name} status changed from ${result.oldStatus} to ${result.status}`);
                            }
                            await dispatchAlert(group, result.results);
                        }
                    } catch (error) {
                        console.error(`Error evaluating group ${group.id}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error in scheduler:', error);
        }
    });
};
