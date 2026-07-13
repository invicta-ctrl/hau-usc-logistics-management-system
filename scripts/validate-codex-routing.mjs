import path from 'node:path';
import { validatePolicyFiles } from './codex-routing.mjs';

const root = path.resolve(process.argv[2] || process.cwd());
const result = validatePolicyFiles(root);
console.log(`Codex routing policy valid: ${result.models.join(', ')}`);
console.log(`Verification profiles: ${result.profiles.join(', ')}`);

