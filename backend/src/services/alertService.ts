import { InvariantGroup, Check, AWSAccount } from '../db';
import { AWSAdapter } from '../adapters/awsAdapter';
import { SendEmailCommand } from '@aws-sdk/client-ses';

export const dispatchAlert = async (group: any, results: any[]) => {
    const failedChecks = results.filter(r => r.status === 'FAIL');

    const alertPayload = {
        group: group.name,
        status: group.lastStatus,
        failedChecks: failedChecks.map(c => ({
            checkId: c.checkId,
            reason: c.reason,
            expected: c.expected,
            observed: c.observed
        })),
        timestamp: new Date().toISOString()
    };

    console.log('--- ALERT DISPATCHER ---');
    console.log(JSON.stringify(alertPayload, null, 2));
    console.log('------------------------');

    // Future integration point for Slack, Email, etc.
    if (group.notificationEmails && group.lastStatus === 'FAIL') {
        await sendEmailNotification(group, failedChecks);
    }
};

async function sendEmailNotification(group: any, failedChecks: any[]) {
    const emails = group.notificationEmails.split(',').map((e: string) => e.trim()).filter((e: string) => e.length > 0);
    if (emails.length === 0) return;

    try {
        const account = await AWSAccount.findByPk(group.awsAccountId);
        if (!account) throw new Error('AWS Account not found for notification');

        const credentials = await AWSAdapter.getCredentials(account);
        const sesClient = await AWSAdapter.getSESClient(credentials, 'us-east-1'); // Default to us-east-1 for SES

        const subject = `${group.name} Evaluation Failed`;

        let htmlBody = `
            <h2>Architectural Invariant Groups Failure</h2>
            <p>The following checks failed for group: <strong>${group.name}</strong></p>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th>Alias</th>
                        <th>Type</th>
                        <th>Observed</th>
                        <th>Expected</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
        `;

        failedChecks.forEach(check => {
            htmlBody += `
                <tr>
                    <td>${check.alias || 'N/A'}</td>
                    <td>${check.type}</td>
                    <td>${check.observed}</td>
                    <td>${check.expected}</td>
                    <td style="color: #dc3545;">${check.reason}</td>
                </tr>
            `;
        });

        htmlBody += `
                </tbody>
            </table>
            <p>View full details in the <a href="${process.env.APP_URL || 'http://localhost:8800'}/groups/${group.id}">Dashboard</a>.</p>
        `;

        const command = new SendEmailCommand({
            Destination: { ToAddresses: emails },
            Message: {
                Subject: { Data: subject },
                Body: {
                    Html: { Data: htmlBody },
                    Text: { Data: `The evaluation for group ${group.name} failed. Check details in the dashboard.` }
                }
            },
            Source: process.env.SES_SENDER_EMAIL || 'no-reply@appgambit.com',
        });

        await sesClient.send(command);
        console.log(`Notification email sent to: ${emails.join(', ')}`);
    } catch (error: any) {
        console.error('Failed to send SES notification:', error.message);
    }
}
