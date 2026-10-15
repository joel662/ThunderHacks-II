export const DEMO_EMAIL = 'demo@311brampton.ca';
export const DEMO_PASSWORD = 'demo123';
export const DEMO_UID = 'demo-user-001';

let _isDemoMode = false;

export function isDemoMode() {
  return _isDemoMode;
}

export function setDemoMode(val: boolean) {
  _isDemoMode = val;
}
