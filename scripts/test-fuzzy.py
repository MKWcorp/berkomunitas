import re
from difflib import SequenceMatcher

def normalize_name(name):
    if not name:
        return ''
    name = re.sub(r'\s+', ' ', name.strip().lower())
    # Fix: Remove academic/professional titles properly
    name = re.sub(r'\b(dr|ir|apt|prof|drs|drg)\b\.?', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bs\.(kom|pd|si|sos|farm|kep|t|h|e|akun|psi|hum|ip|ked|gz)\b', '', name, flags=re.IGNORECASE)
    return name.strip()

def calculate_name_similarity(name1, name2):
    name1_norm = normalize_name(name1)
    name2_norm = normalize_name(name2)
    
    # Fix: Skip if empty
    if not name1_norm or not name2_norm:
        return 0.0
    
    if name1_norm == name2_norm:
        return 1.0
    
    ratio = SequenceMatcher(None, name1_norm, name2_norm).ratio()
    
    # Fix: Require minimum length for contains check
    if len(name1_norm) >= 3 and len(name2_norm) >= 3:
        if name1_norm in name2_norm or name2_norm in name1_norm:
            ratio = max(ratio, 0.80)
    
    return ratio

# Test cases
tests = [
    ('asmeu ayang', 'Shafa Salsabila'),
    ('asmeu ayang', 'Shakiena shakiena'),
    ('budi santoso', 'Budi S.Kom'),  # Should match
    ('ahmad syahrial', 'Ahmad Syahrial S.Pd'),  # Should match
]

for name1, name2 in tests:
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)
    similarity = calculate_name_similarity(name1, name2)
    
    print(f'{name1} vs {name2}')
    print(f'  Normalized: "{n1}" vs "{n2}"')
    print(f'  Similarity: {similarity*100:.1f}%')
    print(f'  Match: {"✓" if similarity >= 0.80 else "✗"}')
    print()
