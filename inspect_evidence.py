with open(r'C:\Users\User\Desktop\TP\m45_all_65_ranked.txt', 'r', encoding='utf-8') as f:
    lines = [l.strip() for l in f if l.strip()]

with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

import re

for line in lines[::5]:
    # parse bib and name
    parts = line.split('|')
    bib = parts[0].split()[1]
    name = parts[1].strip()
    score = parts[3].strip()
    # find evidence in html
    idx = html.find(name)
    ev = ""
    if idx != -1:
        snip = html[idx:idx+500]
        m = re.search(r'#(?:[\d,]+)\s+of\s+[\d,]+[^<"\']+', snip)
        if m:
            ev = m.group(0).replace('&nbsp;', ' ').replace('P', '·')
    print(f"{parts[0].strip()} | {name:<20} | {score} | Evidence: {ev}")
