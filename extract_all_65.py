import re
import json

with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Replace \" with " and \\" with \"
clean_html = html.replace('\\"', '"').replace('\\\\', '\\')

athletes_map = {}
idx = 0
while True:
    idx = clean_html.find('"ageGroup":"M45-49"', idx)
    if idx == -1:
        break
    start = clean_html.rfind('{', 0, idx)
    depth = 0
    end = start
    for i in range(start, min(len(clean_html), start + 3000)):
        if clean_html[i] == '{':
            depth += 1
        elif clean_html[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    s = clean_html[start:end]
    try:
        obj = json.loads(s)
        if obj.get('ageGroup') == 'M45-49':
            name = obj.get('fullName')
            # keep the one with more fields or higher score
            if name not in athletes_map or (obj.get('score') or 0) > (athletes_map[name].get('score') or 0):
                athletes_map[name] = obj
    except:
        pass
    idx += len('"ageGroup":"M45-49"')

print(f'Total distinct M45-49 athletes found: {len(athletes_map)}')

ranked_athletes = [a for a in athletes_map.values() if (a.get('score') or 0) > 0]
ranked_athletes.sort(key=lambda x: x.get('score', 0), reverse=True)

print(f'Total ranked athletes (score > 0): {len(ranked_athletes)}')

with open(r'C:\Users\User\Desktop\TP\m45_all_65_ranked.txt', 'w', encoding='utf-8') as out:
    for i, a in enumerate(ranked_athletes):
        out.write(f"{i+1:2d}. Bib {a.get('bib','?'):<5} | {a.get('fullName'):<22} | {a.get('country','?'):<10} | PowerIndex: {a.get('score',0):5.1f} | S:{a.get('scoreSwim',0) or 0:4.1f} B:{a.get('scoreBike',0) or 0:4.1f} R:{a.get('scoreRun',0) or 0:4.1f} | Conf: {a.get('confidence')}\n")

print('Done writing txt!')
