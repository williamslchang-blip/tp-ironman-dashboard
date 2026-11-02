import re
import json

with open(r'C:\Users\User\Desktop\TP\all_m45_rsc.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find all athlete dicts in the text
# They have structure {"id":..., "fullName":..., "ageGroup":"M45-49", ...}
# Let's use regex or search for patterns
pattern = r'\{[^{}]*?"fullName":"([^"]+)"[^{}]*?"ageGroup":"M45-49"[^{}]*?\}'

# Better: let's find the large array containing all athletes
# Search for [{"id":...
arrays = re.findall(r'(\[\{"id":\d+,"fullName":.+?\}\])', text)
print(f'Found {len(arrays)} arrays matching pattern')

all_athletes = []
for arr_str in arrays:
    try:
        arr = json.loads(arr_str)
        if isinstance(arr, list):
            for item in arr:
                if isinstance(item, dict) and item.get('ageGroup') == 'M45-49':
                    all_athletes.append(item)
    except Exception as e:
        pass

# If regex didn't parse full json, let's parse using a bracket matcher
if not all_athletes:
    print('Trying alternative JSON extractor...')
    for m in re.finditer(r'\{"id":\d+,"fullName":"[^"]+","ageGroup":"M45-49"', text):
        start = m.start()
        # count braces
        depth = 0
        end = start
        for i in range(start, min(len(text), start + 3000)):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        obj_str = text[start:end]
        try:
            obj = json.loads(obj_str)
            all_athletes.append(obj)
        except:
            pass

print(f'Total athletes parsed: {len(all_athletes)}')
seen = set()
unique_athletes = []
for a in all_athletes:
    k = a.get('bib') or a.get('fullName')
    if k not in seen:
        seen.add(k)
        unique_athletes.append(a)

print(f'Unique athletes in M45-49: {len(unique_athletes)}')

ranked = [a for a in unique_athletes if a.get('rankOverall') is not None]
ranked.sort(key=lambda x: x.get('rankOverall', 9999))
print(f'Unique ranked in M45-49: {len(ranked)}')

with open(r'C:\Users\User\Desktop\TP\m45_ranked.json', 'w', encoding='utf-8') as out:
    json.dump(ranked, out, ensure_ascii=False, indent=2)

for a in ranked:
    print(f"Rank {a.get('rankOverall')}: {a.get('fullName')} ({a.get('country')}) - Score {a.get('score')} | Best: {a.get('bestResult')}")
