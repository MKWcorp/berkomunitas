#!/usr/bin/env python3
"""Fix .env.local file by removing line breaks from JWT secrets"""

# Read the current file
with open('.env.local', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Process lines to join broken JWT secrets
new_lines = []
i = 0
while i < len(lines):
    line = lines[i].rstrip('\n\r')
    
    # Check if this is a JWT secret line that continues on next line
    if line.startswith('JWT_SECRET=') or line.startswith('JWT_REFRESH_SECRET='):
        # Check if the quote is not closed
        if line.count('"') == 1:
            # Join with next line(s) until we find the closing quote
            while i + 1 < len(lines) and line.count('"') % 2 == 1:
                i += 1
                next_line = lines[i].rstrip('\n\r')
                line += next_line
        
        new_lines.append(line + '\n')
    else:
        new_lines.append(line + '\n')
    
    i += 1

# Write the fixed file
with open('.env.local', 'w', encoding='utf-8', newline='\n') as f:
    f.writelines(new_lines)

print('✓ Fixed .env.local file')
print('JWT secrets are now on single lines')
