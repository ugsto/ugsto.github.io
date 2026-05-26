import type { PageLoad } from './$types';

export interface WorkshopEntry {
  title: string;
  description: string;
  tutorialSlug: string;
  dashboardSlug: string;
  icon: string;
  date: string;
  tags: string[];
}

export const load: PageLoad = async () => {
  const workshops: WorkshopEntry[] = [
    {
      title: 'Kubernetes from Scratch — IFSUMMIT 2026',
      description: 'A hands-on workshop covering containers, Kubernetes architecture, debugging, and GitOps.',
      tutorialSlug: '/workshops/kubernetes-ifsummit-2026/tutorial/1.00-introducao',
      dashboardSlug: '/workshops/kubernetes-ifsummit-2026/dashboard',
      icon: 'k8s',
      date: '2026',
      tags: ['kubernetes', 'docker', 'containers', 'devops'],
    },
  ];

  return { workshops };
};
