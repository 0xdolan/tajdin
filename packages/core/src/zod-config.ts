import { z } from 'zod';

// Extension pages forbid eval, and store reviewers flag `new Function`. Zod's JIT uses it, so
// validation runs in its interpreted mode everywhere (plenty fast for Tajdîn's data sizes).
z.config({ jitless: true });
