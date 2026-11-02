import re
import json

with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Extract all push arguments
chunks = []
for m in re.finditer(r'self\.__next_f\.push\(\[1,\s*"(.*?)"\]\)', html, re.DOTALL):
    s = m.group(1)
    # decode python string escapes
    try:
        decoded = bytes(s, 'utf-8').decode('unicode_escape')
        chunks.append(decoded)
    except Exception as e:
        chunks.append(s.replace('\\"', '"').replace('\\\\', '\\'))

full_text = '\n'.join(chunks)
print(f'Total decoded RSC length: {len(full_text)}')

# Now search for all athletes in M45-49
# Match {"id":..., "fullName":"...", ..., "ageGroup":"M45-49", ...}
# Let's find every occurrence of "ageGroup":"M45-49"
athletes = []
for m in re.finditer(r'"ageGroup":"M45-49"', full_text):
    # find enclosing { and }
    idx = m.start()
    start = full_text.rfind('{', 0, idx)
    # now find closing }
    depth = 0
    end = start
    for i in range(start, min(len(full_text), start + 4000)):
        if full_text[i] == '{':
            depth += 1
        elif full_text[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    try:
        obj = json.loads(full_text[start:end])
        athletes.append(obj)
    except:
        pass

print(f'Parsed {len(athletes)} M45-49 athlete objects')

seen = set()
unique = []
for a in athletes:
    k = a.get('bib') or a.get('fullName')
    if k not in seen:
        seen.add(k)
        unique.append(a)

print(f'Unique M45-49 athletes: {len(unique)}')

ranked = [a for a in unique if a.get('rankOverall') is not None]
ranked.sort(key=lambda x: x.get('rankOverall', 9999))
print(f'Unique ranked M45-49 athletes: {len(ranked)}')

with open(r'C:\Users\User\Desktop\TP\m45_ranked_full.json', 'w', encoding='utf-8') as out:
    json.dump(ranked, out, ensure_ascii=False, indent=2)

with open(r'C:\Users\User\Desktop\TP\m45_all_athletes.json', 'w', encoding='utf-8') as out:
    json.dump(unique, out, ensure_ascii=False, indent=2)

print("\n--- ALL RANKED M45-49 ATHLETES ---")
for a in ranked:
    print(f"Rank {a.get('rankOverall')}: {a.get('fullName')} ({a.get('country')}) | Bib: {a.get('bib')} | Score: {a.get('score')} | Swim: {a.get('scoreSwim')} | Bike: {a.get('scoreBike')} | Run: {a.get('scoreRun')} | Best: {a.get('bestResult')}")
