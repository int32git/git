const fs = require('fs');
const path = require('path');

// Define the replacement map
const replacements = [
  {
    from: 'import { createServerComponentClient } from \'@supabase/auth-helpers-nextjs\';',
    to: 'import { createServerClient } from \'@supabase/ssr\';\nimport { cookies } from \'next/headers\';'
  },
  {
    from: 'import { createClientComponentClient } from \'@supabase/auth-helpers-nextjs\';',
    to: 'import { createBrowserClient } from \'@supabase/ssr\';'
  },
  {
    from: 'import { createRouteHandlerClient } from \'@supabase/auth-helpers-nextjs\';',
    to: 'import { createServerClient } from \'@supabase/ssr\';\nimport { cookies } from \'next/headers\';\nimport { CookieOptions } from \'@supabase/ssr\';'
  },
  {
    from: 'import { createMiddlewareClient } from \'@supabase/auth-helpers-nextjs\';',
    to: 'import { createServerClient } from \'@supabase/ssr\';\nimport { CookieOptions } from \'@supabase/ssr\';'
  },
  {
    from: 'const supabase = createServerComponentClient',
    to: 'const cookieStore = cookies();\nconst supabase = createServerClient'
  },
  {
    from: 'const supabase = createClientComponentClient()',
    to: 'const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)'
  },
  {
    from: 'const supabase = createRouteHandlerClient',
    to: 'const cookieStore = cookies();\nconst supabase = createServerClient'
  },
  {
    from: /createServerComponentClient<Database>\(\{ cookies \}\)/g,
    to: 'createServerClient<Database>(\n      process.env.NEXT_PUBLIC_SUPABASE_URL!,\n      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\n      {\n        cookies: {\n          get(name: string) {\n            return cookieStore.get(name)?.value;\n          },\n          set(name: string, value: string, options: CookieOptions) {\n            cookieStore.set(name, value, options);\n          },\n          remove(name: string, options: CookieOptions) {\n            cookieStore.set(name, \'\', { ...options, maxAge: 0 });\n          },\n        },\n      }\n    )'
  },
  {
    from: /createRouteHandlerClient<Database>\(\{ cookies \}\)/g,
    to: 'createServerClient<Database>(\n      process.env.NEXT_PUBLIC_SUPABASE_URL!,\n      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\n      {\n        cookies: {\n          get(name: string) {\n            return cookieStore.get(name)?.value;\n          },\n          set(name: string, value: string, options: CookieOptions) {\n            cookieStore.set(name, value, options);\n          },\n          remove(name: string, options: CookieOptions) {\n            cookieStore.set(name, \'\', { ...options, maxAge: 0 });\n          },\n        },\n      }\n    )'
  },
  {
    from: /createMiddlewareClient\(\{ req, res \}\)/g,
    to: 'createServerClient(\n    process.env.NEXT_PUBLIC_SUPABASE_URL!,\n    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\n    {\n      cookies: {\n        get(name) {\n          return req.cookies.get(name)?.value;\n        },\n        set(name, value, options) {\n          res.cookies.set(name, value, options);\n        },\n        remove(name, options) {\n          res.cookies.set(name, \'\', { ...options, maxAge: 0 });\n        },\n      },\n    }\n  )'
  }
];

// Walk through the src directory
function processDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      processFile(fullPath);
    }
  }
}

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const replacement of replacements) {
    if (typeof replacement.from === 'string') {
      if (content.includes(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    } else {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    }
  }
  
  if (changed) {
    console.log(`Updated ${filePath}`);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

// Start processing from the src directory
processDirectory('./src');
console.log('Migration completed!'); 