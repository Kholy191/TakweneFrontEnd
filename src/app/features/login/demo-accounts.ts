// Seeded test accounts (see the backend's users.json); for reviewers only.
export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  icon: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Admin', email: 'admin@takwene.com', password: 'Admin@12345', icon: 'pi pi-shield' },
  { label: 'Amr Diab', email: 'amr@takwene.com', password: 'Artist@12345', icon: 'pi pi-user' },
  { label: 'Cairokee', email: 'cairokee@takwene.com', password: 'Artist@12345', icon: 'pi pi-user' },
  { label: 'Wegz', email: 'wegz@takwene.com', password: 'Artist@12345', icon: 'pi pi-user' },
];
