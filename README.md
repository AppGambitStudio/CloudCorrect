# CloudCorrect

Architectural Invariant Monitoring for AWS. Ensure your infrastructure stays exactly as you intended.

CloudCorrect helps platform and architecture teams maintain the integrity of their AWS environments by monitoring "Invariants"—architectural rules that must always be true. Whether it's ensuring an EC2 instance is running, a critical S3 bucket is NOT public, or an ECS cluster maintains its desired capacity, CloudCorrect provides real-time visibility and historical proofs of your architectural state.

## 🚀 Key Features

- **Multi-Service Invariants**: Out-of-the-box support for **EC2, ALB, S3, Route53, IAM, RDS, and ECS**. More integrations are in the works.
- **Continuous Auditing**: Define resource groups and schedule automated, periodic health audits.
- **Dynamic Assertions**: Use aliases to create dependencies between checks (e.g., "DNS record must point to this EC2's Public IP").
- **Pause/Resume Control**: Granular monitoring control for individual groups.
- **Evidence-Based History**: Every audit run captures observed technical evidence and technical "reasons" for compliance audits.
- **Fail-Fast Notifications**: Automated email alerts whenever an evaluation fails, sent to a configurable list of recipients.
- **Multi-Tenant & Cross-Account**: Support for managing multiple AWS accounts using secure IAM Cross-Account Roles and External IDs.

## ❓ Why CloudCorrect?

How is this different from AWS Config, Trusted Advisor, or traditional monitoring?

- **Intent vs. Observation**: Traditional monitoring tells you if a service is "up." CloudCorrect tells you if your *intent* is still true. (e.g., "This DNS record should ALWAYS point to this specific Load Balancer.")
- **Dynamic Assertions (Aliases)**: Unlike static config tools, CloudCorrect allows you to bridge resources. You can capture a Public IP from an EC2 instance and automatically assert that a Route 53 record or a Security Group rule matches it.
- **Architectural Invariants**: While tools like AWS Config focus on compliance (e.g., "Is encryption enabled?"), CloudCorrect focuses on architectural topology and connectivity.
- **Audit-Ready Evidence**: Every evaluation captures and persists raw technical evidence, providing a historical paper trail for compliance and troubleshooting that goes beyond simple logs.
- **Developer-Centric**: Built for teams that move fast and need to ensure that manual changes or automation drifts don't break the intended architectural design.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Shadcn UI, Lucide Icons.
- **Backend**: Node.js, Express, Sequelize ORM (PostgreSQL).
- **AWS Integration**: AWS SDK v3 for all service interactions.
- **Infrastructure**: Docker Compose for local database spin-up.

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+) - *Required for local development*
- [Docker](https://www.docker.com/) & Docker Compose - *Required for database & production run*

---

### 💻 Local Development

Use this for active development and debugging.

#### 1. Start Database
```bash
docker-compose up -d db
```

#### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*Create a `.env` in `backend/` with `DATABASE_URL=postgres://cloudcorrect:cloudcorrect_pass@localhost:5437/cloudcorrect`*

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on [http://localhost:8800](http://localhost:8800)*

---

### 🚀 Production Run (Docker)

Use this to run the entire stack (Frontend, Backend, and DB) in production mode.

```bash
docker-compose up --build -d
```

- **Frontend**: [http://localhost:8800](http://localhost:8800)
- **Backend**: [http://localhost:5001](http://localhost:5001)
- **Database**: PostgreSQL on port 5437

*Note: In production mode, ensure your environmental variables are correctly set in the `docker-compose.yml`. Key variables include:*
- `SES_SENDER_EMAIL`: The verified sender email or domain in AWS SES.
- `APP_URL`: The public URL of the frontend (used for email notification links).

## � Commercial Support & Hosting

While CloudCorrect is fully open-source and free to self-host, we offer commercial options for teams and businesses that need additional support:

### Cloud Hosting
- **Managed Infrastructure** — We handle deployment, scaling, and maintenance so you can focus on your business.
- **Automatic Updates** — Always run the latest version with security patches and new features.
- **High Availability** — Enterprise-grade uptime with redundant infrastructure.

### Enterprise Enhancements
- **Additional Checks**: We can help you add additional checks suitable for your infrastructure.
- **Custom Integrations**: We can help you integrate CloudCorrect with your existing tools and workflows.
- **Advanced Analytics**: We can help you analyze your data and provide insights into your infrastructure.
- **Priority Support**: We offer priority support for our customers.
- **SLA Guarantees**: We offer SLA guarantees for our customers.

### Get in Touch
For cloud hosting, enterprise features, or custom development inquiries:

📧 **Email**: [dhaval@appgambit.com](mailto:dhaval@appgambit.com)

## �📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
