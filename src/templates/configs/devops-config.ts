import type { TemplateConfig } from './frontend-config.js';

export const devopsConfig: TemplateConfig = {
  name: 'DevOps / Infrastructure',
  description: 'Infrastructure, CI/CD pipelines, and deployment configurations',
  questions: [
    {
      name: 'containerization',
      message: 'Containerization?',
      type: 'select',
      choices: [
        { name: 'Docker', value: 'docker', description: 'Industry standard containers' },
        { name: 'Podman', value: 'podman', description: 'Daemonless, rootless alternative' },
        { name: 'None', value: 'none', description: 'No containerization' },
      ],
      default: 'docker',
    },
    {
      name: 'orchestration',
      message: 'Orchestration?',
      type: 'select',
      choices: [
        { name: 'Kubernetes', value: 'kubernetes', description: 'Full orchestration platform' },
        { name: 'Docker Compose', value: 'docker-compose', description: 'Multi-container dev setup' },
        { name: 'None', value: 'none', description: 'No orchestration' },
      ],
      default: 'docker-compose',
    },
    {
      name: 'cicd',
      message: 'CI/CD platform?',
      type: 'select',
      choices: [
        { name: 'GitHub Actions', value: 'github-actions', description: 'GitHub native CI/CD' },
        { name: 'GitLab CI', value: 'gitlab-ci', description: 'GitLab native pipelines' },
        { name: 'Jenkins', value: 'jenkins', description: 'Self-hosted, extensible' },
        { name: 'None', value: 'none', description: 'No CI/CD' },
      ],
      default: 'github-actions',
    },
    {
      name: 'cloud',
      message: 'Cloud provider?',
      type: 'select',
      choices: [
        { name: 'AWS', value: 'aws', description: 'Amazon Web Services' },
        { name: 'GCP', value: 'gcp', description: 'Google Cloud Platform' },
        { name: 'Azure', value: 'azure', description: 'Microsoft Azure' },
        { name: 'None / Self-hosted', value: 'none', description: 'On-premise or agnostic' },
      ],
      default: 'aws',
    },
    {
      name: 'iac',
      message: 'Infrastructure as Code?',
      type: 'select',
      choices: [
        { name: 'Terraform', value: 'terraform', description: 'Multi-cloud, declarative' },
        { name: 'Pulumi', value: 'pulumi', description: 'Programming language IaC' },
        { name: 'CloudFormation', value: 'cloudformation', description: 'AWS native IaC' },
        { name: 'None', value: 'none', description: 'Manual provisioning' },
      ],
      default: 'terraform',
      when: (answers) => answers.cloud !== 'none',
    },
    {
      name: 'monitoring',
      message: 'Monitoring?',
      type: 'select',
      choices: [
        { name: 'Prometheus + Grafana', value: 'prometheus-grafana', description: 'Open source metrics and dashboards' },
        { name: 'Datadog', value: 'datadog', description: 'Full-stack observability SaaS' },
        { name: 'Cloud-native', value: 'cloud-native', description: 'CloudWatch / Stackdriver / Monitor' },
        { name: 'None', value: 'none', description: 'No monitoring setup' },
      ],
      default: 'prometheus-grafana',
    },
  ],
  variables: {
    cloudProvider: (answers) => {
      const labels: Record<string, string> = {
        aws: 'Amazon Web Services (AWS)',
        gcp: 'Google Cloud Platform (GCP)',
        azure: 'Microsoft Azure',
        none: 'Self-hosted / On-premise',
      };
      return labels[(answers.cloud as string)] || 'Not specified';
    },
    deploymentStrategy: (answers) => {
      const orch = answers.orchestration as string;
      if (orch === 'kubernetes') return 'Rolling update with Kubernetes deployments';
      if (orch === 'docker-compose') return 'Docker Compose up/down with health checks';
      return 'Direct deployment to host';
    },
    installCommand: (answers) => {
      const deps: string[] = [];
      const iac = (answers.iac as string) || 'terraform';
      const containerization = (answers.containerization as string) || 'docker';

      if (containerization === 'docker') deps.push('# Install Docker: https://docs.docker.com/get-docker/');
      if (containerization === 'podman') deps.push('# Install Podman: https://podman.io/getting-started/installation');
      if (iac === 'terraform') deps.push('# Install Terraform: https://developer.hashicorp.com/terraform/install');
      if (iac === 'pulumi') deps.push('# Install Pulumi: https://www.pulumi.com/docs/install/');
      if (iac === 'cloudformation') deps.push('# Install AWS CLI: https://aws.amazon.com/cli/');

      return deps.join('\n');
    },
  },
};
